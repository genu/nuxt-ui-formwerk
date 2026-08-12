import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

/**
 * Registration is one shared `${prefix}Name` template, so one component stands in
 * for all of them. Only the rename's `prefix.length` slicing is genuinely
 * prefix-sensitive.
 */
describe("ssr - custom prefix", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/custom-prefix", import.meta.url)),
  })

  it("registers our components under the custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toContain("custom-prefix")
    expect(html).toMatch(/<form(?=[^>]*data-testid="schema-form")[^>]*>/)
    expect(html).toContain('data-testid="form-field"')
  })

  it("renames Nuxt UI's FormField correctly when the prefix is not U", async () => {
    const html = await $fetch("/")
    // An off-by-one in the slice leaves NFormField recursing into itself.
    expect(html).toContain('data-testid="nuxtui-form-field"')
    expect(html).toContain('data-testid="form-field"')
  })

  it("leaves Nuxt UI's own NForm registered under the custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<form[^>]*data-testid="nuxtui-form"/)
  })
})
