// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import ServerErrorHarness from "./fixtures/basic/components/ServerErrorHarness.vue"

/**
 * Server errors arrive through formwerk's submit-error bag, which `Field.vue`
 * shows ungated. `form.setErrors` writes to the validation bag instead, where it
 * is indistinguishable from a speculative error and stays hidden.
 */
describe("server-side errors", () => {
  it("does not show an error before submit", async () => {
    const wrapper = await mountSuspended(ServerErrorHarness)
    await nextTick()

    expect(wrapper.text()).not.toContain("already taken")
  })

  it("shows a submit error on an untouched field", async () => {
    const wrapper = await mountSuspended(ServerErrorHarness)
    await nextTick()

    await wrapper.get('[data-testid="form"]').trigger("submit")
    await flushPromises()
    await nextTick()

    // Never blurred, touched or dirtied: the gate would have hidden a validation error.
    expect(wrapper.text()).toContain("already taken")
  })
})
