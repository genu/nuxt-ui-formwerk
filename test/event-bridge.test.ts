// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import { nextTick } from "vue"
import EventBridgeHarness from "./fixtures/basic/components/EventBridgeHarness.vue"

/**
 * Coverage for the bridge between Nuxt UI's form events and formwerk's field
 * state — the thing this module exists to do, and the part most exposed to
 * @nuxt/ui internals moving, since it rides on `formBusInjectionKey` and the
 * event shape Nuxt UI's inputs emit. None of it is observable in SSR markup.
 */
const mount = (showErrorsOn?: "touched" | "blur" | "dirty") =>
  mountSuspended(EventBridgeHarness, { props: showErrorsOn ? { showErrorsOn } : {} })

/**
 * formwerk batches schema validation behind a 10ms `setTimeout` (SCHEMA_BATCH_MS),
 * so `flushPromises` alone returns before any error exists — microtasks only.
 * Every assertion about an error message has to clear that timer first.
 */
const settle = async () => {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 30))
  await flushPromises()
}

describe("Nuxt UI to formwerk event bridge", () => {
  describe("state tracking", () => {
    it("starts with every set empty", async () => {
      const wrapper = await mount()
      await nextTick()

      expect(wrapper.get('[data-testid="blurred"]').text()).toBe("")
      expect(wrapper.get('[data-testid="touched"]').text()).toBe("")
      expect(wrapper.get('[data-testid="dirty"]').text()).toBe("")
    })

    it("records a blur", async () => {
      const wrapper = await mount()
      await wrapper.get('[data-testid="email"]').trigger("blur")
      await flushPromises()

      expect(wrapper.get('[data-testid="blurred"]').text()).toBe("email")
    })

    it("records a focus as touched", async () => {
      const wrapper = await mount()
      await wrapper.get('[data-testid="email"]').trigger("focus")
      await flushPromises()

      expect(wrapper.get('[data-testid="touched"]').text()).toBe("email")
    })

    it("records typing as dirty", async () => {
      const wrapper = await mount()
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await flushPromises()

      expect(wrapper.get('[data-testid="dirty"]').text()).toBe("email")
    })

    it("keeps fields independent", async () => {
      const wrapper = await mount()
      await wrapper.get('[data-testid="other"]').trigger("blur")
      await flushPromises()

      expect(wrapper.get('[data-testid="blurred"]').text()).toBe("other")
    })

    it("clears dirty when the value returns to its original", async () => {
      const wrapper = await mount()
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await flushPromises()
      expect(wrapper.get('[data-testid="dirty"]').text()).toBe("email")

      await wrapper.get('[data-testid="email"]').setValue("")
      await flushPromises()

      expect(wrapper.get('[data-testid="dirty"]').text()).toBe("")
    })
  })

  describe("showErrorsOn", () => {
    it("blur: hides the error until the field is blurred", async () => {
      const wrapper = await mount("blur")
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await settle()

      // Dirty and touched by now, but not blurred.
      expect(wrapper.text()).not.toContain("email too short")

      await wrapper.get('[data-testid="email"]').trigger("blur")
      await settle()

      expect(wrapper.text()).toContain("email too short")
    })

    it("dirty: shows the error as soon as the value changes", async () => {
      const wrapper = await mount("dirty")
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await settle()

      expect(wrapper.text()).toContain("email too short")
    })

    it("touched: shows the error once the field is touched", async () => {
      const wrapper = await mount("touched")
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await settle()

      expect(wrapper.text()).toContain("email too short")
    })

    it("never leaks one field's error onto an untouched sibling", async () => {
      const wrapper = await mount("blur")
      await wrapper.get('[data-testid="email"]').setValue("ab")
      await wrapper.get('[data-testid="email"]').trigger("blur")
      await settle()

      // Full-schema validation ran, so `other` has an error too — the gate is
      // the only thing keeping it off a field the user has never seen.
      expect(wrapper.text()).toContain("email too short")
      expect(wrapper.text()).not.toContain("other too short")
    })
  })

  describe("submit", () => {
    it("shows errors on fields that were never interacted with", async () => {
      const wrapper = await mount("blur")
      expect(wrapper.text()).not.toContain("too short")

      await wrapper.get('[data-testid="form"]').trigger("submit")
      await settle()

      expect(wrapper.text()).toContain("email too short")
      expect(wrapper.text()).toContain("other too short")
    })
  })
})
