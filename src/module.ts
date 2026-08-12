import { defineNuxtModule, addComponent, createResolver, resolveModule, directoryToURL } from "@nuxt/kit"

export type * from "./runtime/types"

export default defineNuxtModule({
  meta: {
    name: "nuxt-ui-formwerk",
  },
  moduleDependencies: {
    "@nuxt/ui": {},
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Get the prefix from Nuxt UI's config, defaulting to 'U'
    const uiOptions = nuxt.options.ui as { prefix?: string } | undefined
    const prefix = uiOptions?.prefix ?? "U"

    // Pin every import of @formwerk/core to one file. Two instances break context sharing
    // between useForm() and useFormContext(), and each drags its own Vue in — the symptom is
    // silent: markup renders, reactivity is dead, and the console stays clean.
    //
    // Resolve from the consumer's rootDir first so a linked checkout (pnpm workspace or
    // monorepo) gets the app's copy rather than this module's own, then fall back to ours
    // for the normal npm install, where the consumer has no direct @formwerk/core.
    let formwerk: string
    try {
      formwerk = resolveModule("@formwerk/core", { url: directoryToURL(nuxt.options.rootDir) })
    } catch {
      formwerk = resolveModule("@formwerk/core", { url: new URL(import.meta.url) })
    }
    nuxt.options.alias["@formwerk/core"] = formwerk

    // Nuxt UI's injection keys are plain per-module Symbols, so two physical copies of @nuxt/ui
    // never match and our provide() is invisible to its components. Pin just this subpath —
    // consumer's rootDir first, ours as fallback — rather than the whole package.
    let uiFormField: string
    try {
      uiFormField = resolveModule("@nuxt/ui/composables/useFormField", { url: directoryToURL(nuxt.options.rootDir) })
    } catch {
      uiFormField = resolveModule("@nuxt/ui/composables/useFormField", { url: new URL(import.meta.url) })
    }
    nuxt.options.alias["@nuxt/ui/composables/useFormField"] = uiFormField

    // Rename Nuxt UI's FormField to NuxtUiFormField so we can override it.
    //
    // Only FormField. Nuxt UI's Form is left alone: its API (state, schema,
    // @submit, a real <form>) has no formwerk equivalent, so shadowing it
    // replaced working forms with silently broken ones. Formwerk forms are
    // opt-in through USchemaForm / USchemalessForm.
    const componentsToRename = [`${prefix}FormField`]

    nuxt.hook("components:extend", (components) => {
      for (const name of componentsToRename) {
        const component = components.find((c) => c.pascalName === name && c.filePath?.includes("@nuxt/ui"))

        // Throwing rather than skipping: the match depends on @nuxt/ui internals
        // (a filePath substring). If it ever stops matching, our Field.vue
        // renders <NuxtUiFormField>, which no longer resolves — a silent, and
        // very confusing, break at runtime.
        if (!component) {
          throw new Error(
            `[nuxt-ui-formwerk] Could not find Nuxt UI's ${name} to rename. ` +
              `The installed @nuxt/ui version may be incompatible with this module.`,
          )
        }

        component.pascalName = `NuxtUi${name.slice(prefix.length)}`
        component.kebabName = `nuxt-ui-${name
          .slice(prefix.length)
          .replaceAll(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase()}`
      }
    })

    // Register our components with the same prefix
    addComponent({
      name: `${prefix}FormField`,
      filePath: resolver.resolve("./runtime/components/Field.vue"),
    })

    addComponent({
      name: `${prefix}FormGroup`,
      filePath: resolver.resolve("./runtime/components/Group.vue"),
    })

    addComponent({
      name: `${prefix}FormRepeater`,
      filePath: resolver.resolve("./runtime/components/Repeater.vue"),
    })

    addComponent({
      name: `${prefix}SchemaForm`,
      filePath: resolver.resolve("./runtime/components/SchemaForm.vue"),
    })

    addComponent({
      name: `${prefix}SchemalessForm`,
      filePath: resolver.resolve("./runtime/components/SchemalessForm.vue"),
    })
  },
})
