// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import ServerErrorHarness from "./fixtures/basic/components/ServerErrorHarness.vue"

/**
 * Server-side errors reach a field through formwerk's submit-error bag, which
 * `Field.vue` surfaces without applying the `showErrorsOn` gate.
 *
 * The distinction matters: `form.setErrors` writes to the *same* bag as schema
 * validation, so an error set that way on a pristine field is indistinguishable
 * from a speculative validation error and stays hidden until the field is
 * interacted with or a submit is attempted.
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

    // Never blurred, touched or dirtied — so the gate would have hidden this
    // had it been routed through the validation-error bag.
    expect(wrapper.text()).toContain("already taken")
  })
})
