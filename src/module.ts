import { defineNuxtModule, addComponent, createResolver } from "@nuxt/kit"

// Module options TypeScript interface definition
// export interface ModuleOptions {}

export type * from "./runtime/types"

export default defineNuxtModule({
  meta: {
    name: "nuxt-ui-formwerk",
    configKey: "uiElements",
  },
  defaults: {},
  moduleDependencies: {
    "@nuxt/ui": {},
  },
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Get the prefix from Nuxt UI's config, defaulting to 'U'
    const uiOptions = nuxt.options.ui as { prefix?: string } | undefined
    const prefix = uiOptions?.prefix ?? "U"

    // Ensure @formwerk/core resolves to the same instance for both module and app
    nuxt.options.alias["@formwerk/core"] = resolver.resolve(nuxt.options.rootDir, "node_modules/@formwerk/core")

    // Rename Nuxt UI's Form and FormField to NuxtUi* so we can override them
    const componentsToRename = [`${prefix}Form`, `${prefix}FormField`]

    nuxt.hook("components:extend", (components) => {
      for (const name of componentsToRename) {
        const component = components.find((c) => c.pascalName === name && c.filePath?.includes("@nuxt/ui"))
        if (component) {
          component.pascalName = `NuxtUi${name.slice(prefix.length)}`
          component.kebabName = `nuxt-ui-${name.slice(prefix.length).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
        }
      }
    })

    // Register our components with the same prefix
    addComponent({
      name: `${prefix}Form`,
      filePath: resolver.resolve("./runtime/components/Form.vue"),
    })

    addComponent({
      name: `${prefix}FormField`,
      filePath: resolver.resolve("./runtime/components/Field.vue"),
    })

    addComponent({
      name: `${prefix}FormGroup`,
      filePath: resolver.resolve("./runtime/components/Group.vue"),
    })
  },
})
