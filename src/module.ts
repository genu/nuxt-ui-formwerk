import {
  defineNuxtModule,
  addComponentsDir,
  createResolver,
  hasNuxtModule,
  useLogger,
} from "@nuxt/kit";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-ui-formwerk",
    configKey: "uiElements",
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);
    const logger = useLogger("nuxt-ui-formwerk");

    // Check for @nuxt/ui after all modules are loaded
    if (!hasNuxtModule("@nuxt/ui")) {
      logger.error(
        "[nuxt-ui-formwerk] @nuxt/ui is required. Please install it",
      );
    }

    // Auto-register components
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "Formwerk",
    });
  },
});
