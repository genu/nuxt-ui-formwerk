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

  it("registers NSchemaForm under the custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="schema-form"')
    // Same lookahead style as basic.test.ts, so it does not assume attribute order.
    expect(html).toMatch(/<form(?=[^>]*data-testid="schema-form")[^>]*>/)
  })

  it("registers NSchemalessForm under the custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="schemaless-form"')
  })
})
