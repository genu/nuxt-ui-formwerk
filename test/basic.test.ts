import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { setup, $fetch } from "@nuxt/test-utils/e2e"

/**
 * SSR-specific coverage. Behaviour belongs in the component suites, which mount
 * and interact; what only this harness can prove is that the module renders on
 * the server at all — `Field.vue` calls `useSlots()` and reads the first slot
 * vnode during setup, and the roots `provide()` there — and that component
 * registration and the `UFormField` rename survive a real Nuxt build.
 */
describe("ssr - basic", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url)),
  })

  it("leaves Nuxt UI's own UForm registered and rendering a form element", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<form[^>]*data-testid="nuxtui-form"/)
  })

  it("makes original Nuxt UI FormField accessible as NuxtUiFormField", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="nuxtui-form-field"')
  })

  it("renders UFormField, its label and its slotted input", async () => {
    const html = await $fetch("/")
    // Also the recursion guard: an unrenamed NuxtUiFormField would recurse.
    expect(html).toContain('data-testid="form-field"')
    expect(html).toContain("Schema Email")
    expect(html).toContain('data-testid="schema-email-input"')
  })

  it("renders USchemaForm as a real form element with an id", async () => {
    const html = await $fetch("/")
    // Order-independent: Vue always merges a component's own bound attrs (id)
    // ahead of fallthrough attrs (data-testid) in the rendered tag, so the two
    // lookaheads assert both are present on the same <form> without assuming order.
    expect(html).toMatch(/<form(?=[^>]*data-testid="schema-form")(?=[^>]*id="[^"]+")[^>]*>/)
  })

  it("marks the rendered form novalidate so native validation never swallows submit", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<form(?=[^>]*data-testid="schema-form")(?=[^>]*novalidate)[^>]*>/)
  })

  it("honours the as prop, and drops novalidate with it", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<div[^>]*data-testid="as-div-form"/)
    expect(html).not.toMatch(/<div(?=[^>]*data-testid="as-div-form")(?=[^>]*novalidate)[^>]*>/)
  })

  it("gives two forms in one component separate ids, so their buses stay separate", async () => {
    const html = await $fetch("/")
    const idOf = (testid: string) => html.match(new RegExp(`<form(?=[^>]*data-testid="${testid}")[^>]*id="([^"]+)"`))?.[1]

    const a = idOf("multi-form-a")
    const b = idOf("multi-form-b")

    expect(a).toBeTruthy()
    expect(b).toBeTruthy()
    // Event buses are keyed on the form id — sharing one would cross the wires.
    expect(a).not.toBe(b)
  })

  it("registers UFormRoot for a caller-owned form", async () => {
    const html = await $fetch("/")
    expect(html).toMatch(/<form[^>]*data-testid="form-root"/)
    expect(html).toContain('data-testid="adopted-input"')
  })

  it("renders fields inside USchemalessForm", async () => {
    const html = await $fetch("/")
    expect(html).toContain('data-testid="nickname-input"')
    expect(html).toContain("Nickname")
  })
})
