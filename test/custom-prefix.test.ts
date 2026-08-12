import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

/**
 * The prefix is read from Nuxt UI's own config, so every component is
 * registered as `${prefix}Name`. Only two things are actually prefix-sensitive
 * and worth asserting separately: the rename, which slices `prefix.length` off
 * the name and rebuilds a kebab one, and the decision not to shadow Nuxt UI's
 * Form. Registration itself is one shared template — asserting it per component
 * would test the same line repeatedly, so one representative stands in.
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
    // The rename slices `prefix.length`; an off-by-one leaves NuxtUiFormField
    // unresolvable and NFormField recursing into itself.
    expect(html).toContain('data-testid="nuxtui-form-field"')
    expect(html).toContain('data-testid="form-field"')
  })

  it("leaves Nuxt UI's own NForm registered under the custom prefix", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<form[^>]*data-testid="nuxtui-form"/)
  })
})
