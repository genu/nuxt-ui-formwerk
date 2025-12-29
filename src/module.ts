import { defineNuxtModule, addComponentsDir, createResolver } from "@nuxt/kit";

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
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    // Auto-register components
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "Formwerk",
    });
  },
});
