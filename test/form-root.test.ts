// @vitest-environment nuxt
import { describe, it, expect } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import FormRootHarness from "./fixtures/basic/components/FormRootHarness.vue"
import { settle } from "./setup/settle"

/**
 * `UFormRoot` adopts a caller-owned form, the only way to reach one during `setup`.
 * Shared wiring is covered in event-bridge.test.ts; what matters here is that
 * adoption works and an adopted form still validates, submits and shows errors.
 */
describe("UFormRoot", () => {
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

  it("disables Nuxt UI inputs when the adopted form is disabled", async () => {
    const wrapper = await mountSuspended(FormRootHarness, { props: { disabled: true } })
    await settle()

    // `useForm({ disabled })` reaches formwerk but not Nuxt UI's inputs, so without
    // forwarding, formwerk strips the path while the input stays editable.
    expect(wrapper.get('[data-testid="email"]').attributes("disabled")).toBeDefined()
  })

  it("leaves inputs editable when the adopted form is not disabled", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    await settle()

    expect(wrapper.get('[data-testid="email"]').attributes("disabled")).toBeUndefined()
  })

  it("renders a real form element with novalidate", async () => {
    const wrapper = await mountSuspended(FormRootHarness)
    const form = wrapper.get('[data-testid="form"]')

    expect(form.element.tagName).toBe("FORM")
    expect(form.attributes("novalidate")).toBeDefined()
  })
})
