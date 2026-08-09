import { fileURLToPath } from "node:url"

export default defineNuxtConfig({
  compatibilityDate: "2025-12-15",

  modules: [
    "../src/module",

    // src/module.ts aliases @formwerk/core to whichever copy resolves from the
    // module's own location — the repo root's node_modules. That is right for a
    // real consumer, but the playground is a separate pnpm project with its own
    // node_modules, so it drags the root's Vue in alongside the playground's.
    // Two Vue runtimes in one page silently kills all client-side reactivity:
    // markup renders, nothing responds, and the console stays clean.
    //
    // Inline modules run after the ones listed above them, so this re-points the
    // alias at the playground's own copy, using the same expression module.ts
    // uses — just evaluated from here.
    (_options, nuxt) => {
      nuxt.options.alias["@formwerk/core"] = fileURLToPath(import.meta.resolve("@formwerk/core"))
    },
  ],

  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },

  vite: {
    resolve: {
      dedupe: ["vue", "@vue/runtime-core", "@vue/runtime-dom", "@vue/shared"],
    },
  },
})
