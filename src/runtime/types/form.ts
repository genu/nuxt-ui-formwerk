import type { InjectionKey, ComputedRef } from "vue"
import type { UseEventBusReturn } from "@vueuse/core"

export interface FormInjectedOptions {
  disabled?: boolean
  validateOn?: FormwerkInputEvents
}

export type FormwerkInputEvent = {
  name: string
  payload: unknown
}

export type FormwerkInputEvents = "touched" | "blur" | "dirty"

export const formwerkOptionsInjectionKey: InjectionKey<ComputedRef<FormInjectedOptions>> = Symbol("nuxt-ui-formwerk.form-options")
export const formwerkBusInjectionKey: InjectionKey<UseEventBusReturn<FormwerkInputEvents, FormwerkInputEvent>> =
  Symbol("nuxt-ui-formwerk.form-events")
