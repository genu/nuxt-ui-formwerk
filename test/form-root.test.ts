// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import { flushPromises } from "@vue/test-utils"
import FormRootHarness from "./fixtures/basic/components/FormRootHarness.vue"

/**
 * `UFormRoot` adopts a form the caller already owns, which is the only way to
 * reach the form during `setup` — a template ref on `USchemaForm` is null until
 * mount, and provide/inject only travels downward.
 *
 * The wiring it shares with the other roots is covered in event-bridge.test.ts;
 * what matters here is that adoption works at all, and that a caller-owned form
 * still gets validation, submit and error display.
 */
const settle = async () => {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 30))
  await flushPromises()
}

describe("UFormRoot", () => {
  it("gives the caller the form during setup", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await settle()

    expect(wrapper.get('[data-testid="setup-access"]').text()).toBe("true")
  })

  it("wires fields to the adopted form", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await wrapper.get('[data-testid="email"]').setValue("hello")
    await settle()

    // A setup-registered watcher on the caller's own form saw the field's value.
    expect(wrapper.get('[data-testid="watched"]').text()).toBe("hello")
  })

  it("validates and gates errors like the other roots", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await wrapper.get('[data-testid="email"]').setValue("ab")
    await settle()
    expect(wrapper.text()).not.toContain("email too short")

    await wrapper.get('[data-testid="email"]').trigger("blur")
    await settle()

    expect(wrapper.text()).toContain("email too short")
  })

  it("emits submit with the validated payload", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await wrapper.get('[data-testid="email"]').setValue("valid")
    await settle()

    await wrapper.get('[data-testid="form"]').trigger("submit")
    await settle()

    expect(wrapper.get('[data-testid="submitted"]').text()).toContain("valid")
  })

  it("does not emit submit when validation fails", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await wrapper.get('[data-testid="email"]').setValue("ab")
    await settle()

    await wrapper.get('[data-testid="form"]').trigger("submit")
    await settle()

    expect(wrapper.get('[data-testid="submitted"]').text()).toBe("none")
    expect(wrapper.text()).toContain("email too short")
  })

  it("renders a real form element with novalidate", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    const form = wrapper.get('[data-testid="form"]')

    expect(form.element.tagName).toBe("FORM")
    expect(form.attributes("novalidate")).toBeDefined()
  })
})
