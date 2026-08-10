import { fileURLToPath } from "node:url"

export default defineNuxtConfig({
  compatibilityDate: "2025-12-15",

  modules: [
    "../src/module",

    // The playground is a separate pnpm project, so src/module.ts's
    // @formwerk/core alias resolves to the repo root's copy and drags a second
    // Vue in. That silently kills client-side reactivity: renders fine, nothing
    // responds, console stays clean. Re-point the alias at the playground's copy.
    (_options, nuxt) => {
      nuxt.options.alias["@formwerk/core"] = fileURLToPath(import.meta.resolve("@formwerk/core"))
    },
  ],

  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
})
