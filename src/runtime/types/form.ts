import type { InjectionKey, ComputedRef, Component } from "vue"
import type { UseEventBusReturn } from "@vueuse/core"
import type { StandardSchema, FormObject, FormReturns, TouchedSchema, DirtySchema } from "@formwerk/core"

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

/**
 * The values bag a form root exposes: a deep partial of the form's input shape.
 *
 * Declared as a named alias — rather than being read inline off `FormReturns` —
 * so the declaration emitter prints `FormValues<T>` instead of expanding it into
 * type-fest's `_PartialDeep`, which type-fest never exports and TypeScript
 * therefore cannot name in a `.d.ts` (TS2883). Expanding it produced empty
 * declaration files for the form roots.
 */
export type FormValues<TInput extends FormObject> = FormReturns<TInput>["values"]

/**
 * The output type a Standard Schema produces after validation.
 *
 * Both parameters are inferred. Pinning the input side to `never` (the mirror of
 * what `SchemaInput` does with `unknown`) never matches, because a schema's
 * declared input has to be assignable to it — so every schema silently fell back
 * to `FormObject` and `@submit` handed over untyped data.
 */
export type SchemaOutput<TSchema> =
  TSchema extends StandardSchema<infer _TInput, infer TOutput> ? (TOutput extends FormObject ? TOutput : FormObject) : FormObject

/**
 * Props common to every self-contained form root.
 *
 * This is formwerk's `_FormProps` minus the two options that provably no-op on
 * these components, plus `as` and `validateOn`.
 *
 * `scrollToInvalidFieldOnSubmit` is absent because it queries
 * `[aria-invalid][aria-errormessage][data-fw-form-id]`, and `Field.vue` never
 * binds formwerk's `controlProps`, so those attributes never reach the input.
 *
 * `disableHtmlValidation` is absent because native constraint validation is
 * always off here: the rendered `<form>` carries `novalidate`, matching
 * formwerk's own `formProps`.
 */
export interface FormRootProps<TInput extends FormObject> {
  /** Element or component to render as. Set to a non-form element to avoid invalid nested `<form>` markup. */
  as?: string | Component
  /** Form identifier. Auto-generated when omitted. */
  id?: string
  /** When field errors become visible. */
  validateOn?: FormwerkInputEvents
  /** Debounce, in ms, that Nuxt UI inputs apply before emitting their `input` event. */
  validateOnInputDelay?: number
  /** Disables every field, and strips disabled paths out of the submitted data. */
  disabled?: boolean
  /** Marks fields as touched on mount. */
  initialTouched?: TouchedSchema<TInput>
  /** Marks fields as dirty on mount. */
  initialDirty?: DirtySchema<TInput>
}
