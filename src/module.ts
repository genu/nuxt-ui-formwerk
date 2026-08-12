import { defineNuxtModule, addComponent, addImports, createResolver, resolveModule, directoryToURL } from "@nuxt/kit"

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

    const uiOptions = nuxt.options.ui as { prefix?: string } | undefined
    const prefix = uiOptions?.prefix ?? "U"

    // Two copies of @formwerk/core break context sharing between useForm() and
    // useFormContext(), silently: markup renders, reactivity is dead, console is clean.
    // Consumer's copy wins so a linked checkout resolves to the app's, not ours.
    let formwerk: string
    try {
      formwerk = resolveModule("@formwerk/core", { url: directoryToURL(nuxt.options.rootDir) })
    } catch {
      formwerk = resolveModule("@formwerk/core", { url: new URL(import.meta.url) })
    }
    nuxt.options.alias["@formwerk/core"] = formwerk

    // Nuxt UI's injection keys are per-module Symbols, so two copies never match and
    // our provide() is invisible to its components. Pin the subpath, not the package.
    let uiFormField: string
    try {
      uiFormField = resolveModule("@nuxt/ui/composables/useFormField", { url: directoryToURL(nuxt.options.rootDir) })
    } catch {
      uiFormField = resolveModule("@nuxt/ui/composables/useFormField", { url: new URL(import.meta.url) })
    }
    nuxt.options.alias["@nuxt/ui/composables/useFormField"] = uiFormField

    // FormField only. Shadowing Nuxt UI's Form replaced working forms with silently
    // broken ones — its state/schema/@submit API has no formwerk equivalent.
    const componentsToRename = [`${prefix}FormField`]

    nuxt.hook("components:extend", (components) => {
      for (const name of componentsToRename) {
        const component = components.find((c) => c.pascalName === name && c.filePath?.includes("@nuxt/ui"))

        // Matching on an @nuxt/ui internal. Skipping instead of throwing would leave
        // Field.vue rendering an unresolvable <NuxtUiFormField> at runtime.
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

    addComponent({
      name: `${prefix}FormRoot`,
      filePath: resolver.resolve("./runtime/components/FormRoot.vue"),
    })

    addImports({
      name: "useFormRoot",
      from: resolver.resolve("./runtime/composables/useFormRoot"),
    })
  },
})
