import { fileURLToPath } from "node:url"
import { defineVitestConfig } from "@nuxt/test-utils/config"

export default defineVitestConfig({
  test: {
    dir: "test",
    // E2E tests run against a real Nuxt server and need no DOM. Component tests
    // opt into the Nuxt environment per file with `// @vitest-environment nuxt`,
    // which is why this is defineVitestConfig rather than plain defineConfig.
    environmentOptions: {
      nuxt: {
        // The Nuxt environment needs an app with the module registered, so it
        // reuses the e2e fixture rather than standing up a second one.
        rootDir: fileURLToPath(new URL("./test/fixtures/basic", import.meta.url)),
      },
    },
  },
})
