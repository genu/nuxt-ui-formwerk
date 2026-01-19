import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

describe("ssr - custom prefix", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/custom-prefix", import.meta.url)),
  })

  it("renders with custom N prefix", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="basic"')
    expect(html).toContain("custom-prefix")
  })

  it("renders NForm (custom prefix) without infinite recursion", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="form"')
  })

  it("renders NFormField (custom prefix) without infinite recursion", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="form-field"')
  })

  it("makes original Nuxt UI FormField accessible as NuxtUiFormField with custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="nuxtui-form-field"')
  })
})
