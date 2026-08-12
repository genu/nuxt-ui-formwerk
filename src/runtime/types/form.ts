import type { InjectionKey, ComputedRef, Component } from "vue"
import type { UseEventBusReturn } from "@vueuse/core"
import type { StandardSchema, FormObject, FormReturns, TouchedSchema, DirtySchema } from "@formwerk/core"

export interface FormInjectedOptions {
  showErrorsOn?: ErrorVisibility
  isSubmitAttempted?: boolean
}

export type FormwerkInputEvent = {
  name: string
  payload: unknown
}

export type FormwerkInputEvents = "touched" | "blur" | "dirty"

/**
 * Which field state has to be reached before that field's error is shown.
 *
 * Not `validateOn`: Nuxt UI has a prop by that name meaning an array of DOM
 * events, and sharing it silently swallowed the array form.
 */
export type ErrorVisibility = FormwerkInputEvents

export const formwerkOptionsInjectionKey: InjectionKey<ComputedRef<FormInjectedOptions>> = Symbol("nuxt-ui-formwerk.form-options")
export const formwerkBusInjectionKey: InjectionKey<UseEventBusReturn<FormwerkInputEvents, FormwerkInputEvent>> =
  Symbol("nuxt-ui-formwerk.form-events")

/** Via formwerk's `StandardSchema` re-export, to avoid depending on `@standard-schema/spec`. */
export type SchemaInput<TSchema> =
  TSchema extends StandardSchema<infer TInput, unknown> ? (TInput extends FormObject ? TInput : FormObject) : FormObject

/**
 * Named alias, not read inline off `FormReturns`: inlining expands to type-fest's
 * unexported `_PartialDeep`, which TS cannot name in a `.d.ts` (TS2883), and the
 * emitter silently produced empty declarations for the form roots.
 */
export type FormValues<TInput extends FormObject> = FormReturns<TInput>["values"]

/**
 * Both parameters inferred. Pinning the input side to `never` matches nothing, so
 * every schema fell back to `FormObject` and `@submit` handed over untyped data.
 */
export type SchemaOutput<TSchema> =
  TSchema extends StandardSchema<infer _TInput, infer TOutput> ? (TOutput extends FormObject ? TOutput : FormObject) : FormObject

/**
 * formwerk's `_FormProps` plus `as`, minus two that provably no-op here:
 * `scrollToInvalidFieldOnSubmit` needs attributes `Field.vue` never binds, and
 * `disableHtmlValidation` is redundant against the `novalidate` we always set.
 */
export interface FormRootProps<TInput extends FormObject> {
  /** Element or component to render as. Set to a non-form element to avoid invalid nested `<form>` markup. */
  as?: string | Component
  /** Form identifier. Auto-generated when omitted. */
  id?: string
  /** When field errors become visible. */
  showErrorsOn?: ErrorVisibility
  /** Debounce, in ms, that Nuxt UI inputs apply before emitting their `input` event. */
  validateOnInputDelay?: number
  /** Disables every field, and strips disabled paths out of the submitted data. */
  disabled?: boolean
  /** Marks fields as touched on mount. */
  initialTouched?: TouchedSchema<TInput>
  /** Marks fields as dirty on mount. */
  initialDirty?: DirtySchema<TInput>
}
