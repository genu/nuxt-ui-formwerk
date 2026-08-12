// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import DisabledHarness from "./fixtures/basic/components/DisabledHarness.vue"

/**
 * Cannot be an SSR test: formwerk defers the disabled registration to `nextTick`,
 * so the map is empty when the markup serialises. Nor can it assert on the input's
 * `disabled` attribute, which Nuxt UI sets through its own channel either way.
 */
describe("form-level disabled", () => {
  it("tells formwerk the field is disabled", async () => {
    const wrapper = await mountSuspended(DisabledHarness, { props: { disabled: true } })
    await nextTick()

    expect(wrapper.get('[data-testid="is-path-disabled"]').text()).toBe("true")
  })

  it("strips disabled paths out of the submitted data", async () => {
    const wrapper = await mountSuspended(DisabledHarness, { props: { disabled: true } })
    await nextTick()

    // handleSubmit validates asynchronously, so a single tick is not enough.
    await wrapper.get('[data-testid="form"]').trigger("submit")
    await flushPromises()

    expect(wrapper.get('[data-testid="submitted"]').text()).toBe("{}")
  })

  it("keeps the value when the form is not disabled", async () => {
    const wrapper = await mountSuspended(DisabledHarness, { props: { disabled: false } })
    await nextTick()

    await wrapper.get('[data-testid="form"]').trigger("submit")
    await flushPromises()

    expect(wrapper.get('[data-testid="submitted"]').text()).toContain("a@b.c")
  })

  it("still disables the Nuxt UI input", async () => {
    const wrapper = await mountSuspended(DisabledHarness, { props: { disabled: true } })
    await nextTick()

    expect(wrapper.get('[data-testid="email-input"]').attributes("disabled")).toBeDefined()
  })
})
