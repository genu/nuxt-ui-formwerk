import type { InjectionKey, ComputedRef, Component } from "vue"
import type { UseEventBusReturn } from "@vueuse/core"
import type { StandardSchema, FormObject, TouchedSchema, DirtySchema } from "@formwerk/core"

export interface FormInjectedOptions {
  disabled?: boolean
  validateOn?: FormwerkInputEvents
  isSubmitAttempted?: boolean
}

export type FormwerkInputEvent = {
  name: string
  payload: unknown
}

export type FormwerkInputEvents = "touched" | "blur" | "dirty"

export const formwerkOptionsInjectionKey: InjectionKey<ComputedRef<FormInjectedOptions>> = Symbol("nuxt-ui-formwerk.form-options")
export const formwerkBusInjectionKey: InjectionKey<UseEventBusReturn<FormwerkInputEvents, FormwerkInputEvent>> =
  Symbol("nuxt-ui-formwerk.form-events")

/**
 * The input type a Standard Schema validates.
 *
 * Derived from formwerk's own `StandardSchema` export so this package does not
 * take a direct dependency on `@standard-schema/spec`.
 */
export type SchemaInput<TSchema> =
  TSchema extends StandardSchema<infer TInput, unknown> ? (TInput extends FormObject ? TInput : FormObject) : FormObject

/** The output type a Standard Schema produces after validation. */
export type SchemaOutput<TSchema> =
  TSchema extends StandardSchema<never, infer TOutput> ? (TOutput extends FormObject ? TOutput : FormObject) : FormObject

/**
 * Props common to every self-contained form root.
 *
 * This is formwerk's `_FormProps` minus `scrollToInvalidFieldOnSubmit` (which
 * cannot work — see the design spec), plus `as` and `validateOn`.
 */
export interface FormRootProps<TInput extends FormObject> {
  /** Element or component to render as. Set to a non-form element to avoid invalid nested `<form>` markup. */
  as?: string | Component
  /** Form identifier. Auto-generated when omitted. */
  id?: string
  /** When field errors become visible. */
  validateOn?: FormwerkInputEvents
  /** Disables every field, and strips disabled paths out of the submitted data. */
  disabled?: boolean
  /** Turns off native HTML5 validation for this form. */
  disableHtmlValidation?: boolean
  /** Marks fields as touched on mount. */
  initialTouched?: TouchedSchema<TInput>
  /** Marks fields as dirty on mount. */
  initialDirty?: DirtySchema<TInput>
}
