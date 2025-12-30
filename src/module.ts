import { defineNuxtModule, addComponentsDir, createResolver } from "@nuxt/kit"

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
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

    // Ensure @formwerk/core resolves to the same instance for both module and app
    nuxt.options.alias["@formwerk/core"] = resolver.resolve(nuxt.options.rootDir, "node_modules/@formwerk/core")

    // Auto-register components
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "Formwerk",
    })
  },
})
