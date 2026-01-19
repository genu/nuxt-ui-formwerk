import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    dir: "test",
    // E2E tests don't need a DOM environment - they test against a real Nuxt server
  },
})
