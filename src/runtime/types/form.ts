import type { InjectionKey, ComputedRef } from "vue"
import type { UseEventBusReturn } from "@vueuse/core"
import type { FormObject, FormReturns, GenericFormSchema, Path } from "@formwerk/core"

/**
 * Standard Schema exposes its input/output types through `~standard.types`, so
 * we read them straight off the schema rather than taking a dependency on
 * `@standard-schema/spec` just to reach `StandardSchemaV1.InferInput`.
 *
 * These must stay plain aliases. Wrapping them in a conditional (to re-assert
 * the `FormObject` constraint, say) leaves the type deferred for an unresolved
 * `TSchema`, and a deferred conditional will not unify with the resolved type
 * formwerk infers internally — every slot prop then fails to type-check.
 */
export type InferSchemaInput<TSchema extends GenericFormSchema> = NonNullable<TSchema["~standard"]["types"]>["input"]

export type InferSchemaOutput<TSchema extends GenericFormSchema> = NonNullable<TSchema["~standard"]["types"]>["output"]

/**
 * Slot props shared by the form roots that own their form. Field paths are
 * typed, which the ambient `UForm` cannot do since it has no idea what shape
 * the form it inherits has.
 */
export interface OwnedFormSlotProps<TInput extends FormObject, TOutput extends FormObject> {
  /** Current form values. */
  values: FormReturns<TInput, TOutput>["values"]
  /** Validates, then emits `submit` with the parsed output if the form is valid. */
  submit: (e?: Event) => Promise<void>
  /** Resets values, touched and dirty state back to their initial snapshot. */
  reset: () => Promise<void>
  isSubmitting: boolean
  isValid: boolean
  blurredFields: ReadonlySet<Path<TInput>>
  touchedFields: ReadonlySet<Path<TInput>>
  dirtyFields: ReadonlySet<Path<TInput>>
}

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
