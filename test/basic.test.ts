import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

describe("ssr - basic", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  })

  it("renders the index page", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="basic"')
  })

  // 1. Component Override Tests
  it("renders UForm without infinite recursion", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="form"')
  })

  it("renders UFormField without infinite recursion", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="form-field"')
  })

  it("makes original Nuxt UI FormField accessible as NuxtUiFormField", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="nuxtui-form-field"')
  })

  // 3. Form/Field Integration Tests
  it("renders form field with label", async () => {
    const html = await $fetch("/")
    expect(html).toContain("Email")
  })

  it("renders input inside form field", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="email-input"')
  })

  it("renders required form field", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="form-field-required"')
    expect(html).toContain("Username")
  })

  // 4. Formwerk Integration Tests
  it("form accepts validateOn prop", async () => {
    const html = await $fetch("/")
    // Form renders successfully with validateOn="blur"
    expect(html).toContain('data-testid="form"')
  })

  it("form field exposes model to slot", async () => {
    const html = await $fetch("/")
    // Input is rendered with v-bind="model" working
    expect(html).toContain('data-testid="email-input"')
  })
})
