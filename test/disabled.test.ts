// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import DisabledHarness from "./fixtures/basic/components/DisabledHarness.vue"

/**
 * These have to be component tests, not the SSR `$fetch` kind used elsewhere.
 * formwerk registers a field's disabled state inside `initFormPathIfNecessary`,
 * which defers the transaction to `nextTick`, and the `isDisabled` watcher is
 * not immediate — so the form's disabled map is still empty when SSR serialises
 * the markup.
 *
 * This guards an integration seam rather than module logic: `disabled` travels
 * useForm -> formwerk's disabled context -> the field, and the payload stripping
 * is formwerk's. Worth pinning because both ends are ours to keep working, and
 * because a regression here is invisible in markup — the input carries the
 * `disabled` attribute either way via Nuxt UI's separate formOptions channel.
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
