// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import SlotPropsHarness from "./fixtures/basic/components/SlotPropsHarness.vue"

describe("UFormField slot props", () => {
  it("renders a slot that reads a property off `value`", async () => {
    const wrapper = await mountSuspended(SlotPropsHarness)

    expect(wrapper.get('[data-testid="len"]').text()).toBe("5")
  })

  it("exposes a working setValue", async () => {
    const wrapper = await mountSuspended(SlotPropsHarness)
    await wrapper.get('[data-testid="set"]').trigger("click")
    await flushPromises()

    expect(wrapper.get('[data-testid="len"]').text()).toBe("3")
  })
})
