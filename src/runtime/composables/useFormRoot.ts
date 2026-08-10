import { computed, provide, reactive, toValue, type MaybeRefOrGetter } from "vue"
import { useEventBus } from "@vueuse/core"
import { useForm, type FormReturns } from "@formwerk/core"
import { formBusInjectionKey, formOptionsInjectionKey } from "@nuxt/ui/composables/useFormField"
import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvent, type FormwerkInputEvents } from "../types/form"

/**
 * The options `useGenericForm` forwards to `useForm`.
 *
 * Deliberately loose on the value types. Every one of them is derived from the
 * caller's unresolved generic parameter, so there is nothing to check them
 * against — see `useGenericForm`. Key names are still checked, because excess
 * property checking applies to the object literals the form roots pass in.
 */
export interface UseGenericFormOptions {
  id?: string
  schema?: unknown
  initialValues?: unknown
  initialTouched?: unknown
  initialDirty?: unknown
  disabled?: MaybeRefOrGetter<boolean | undefined>
}

/**
 * Calls `useForm()` from inside a component that is itself generic, returning
 * the form API as `TForm`.
 *
 * This exists to hold one unavoidable type assertion in a single reviewed
 * place. `useForm` is overloaded — one signature takes `NoSchemaFormProps<TInput
 * extends FormObject>`, the other `SchemaFormProps<TSchema extends
 * GenericFormSchema>`. Inside a generic SFC the options object is built out of
 * props whose types are expressed in terms of the SFC's own type parameter,
 * which is still unresolved at that point. TypeScript cannot prove such a type
 * satisfies either overload's constraint, so it discards both candidates and
 * the call fails with TS2769 ("No overload matches this call"). The same code
 * type checks fine once the parameter is substituted with a concrete type, so
 * there is no error in the object being passed — only in what TypeScript is
 * able to prove about it while the parameter is generic.
 *
 * `as never` therefore silences the argument check (`never` is assignable to
 * both overloads' parameter types), and the second assertion restores the
 * return type the caller declares. Neither can be dropped: without `as never`
 * the call does not compile, and without the return assertion the form API
 * comes back as `FormReturns<never>`, which erases the entire public surface of
 * the form roots.
 *
 * Do not try to "fix" this by adding overloads here or by making the options
 * generic — the constraint cannot be satisfied from a generic call site, which
 * is the whole reason the assertion is needed. The caller's `TForm` is the one
 * thing that keeps the public typing precise, so it must always be supplied
 * explicitly.
 */
export const useGenericForm = <TForm>(options: UseGenericFormOptions): TForm => useForm(options as never) as unknown as TForm

export interface UseFormRootOptions {
  validateOn: MaybeRefOrGetter<FormwerkInputEvents>
  disabled: MaybeRefOrGetter<boolean>
}

export interface FormRootState {
  blurredFields: Set<string>
  touchedFields: Set<string>
  dirtyFields: Set<string>
}

/**
 * Wires a formwerk form into Nuxt UI's form system.
 *
 * Creates the two event buses, provides the four injection keys that Field,
 * Group and Repeater rely on, and tracks per-field interaction state.
 *
 * Callers own the `useForm()` / `useFormContext()` call and pass the result in,
 * which is what lets a single component host several independent forms.
 */
export const useFormRoot = (form: FormReturns<any, any>, options: UseFormRootOptions): FormRootState => {
  const { context, isSubmitAttempted } = form

  const formwerkBus = useEventBus<FormwerkInputEvents, FormwerkInputEvent>(`formwerk-form-${context.id}`)
  const nuxtUiFormBus = useEventBus<any>(`form-${context.id}`)

  const dirtyFields: Set<string> = reactive(new Set<string>())
  const touchedFields: Set<string> = reactive(new Set<string>())
  const blurredFields: Set<string> = reactive(new Set<string>())

  provide(formwerkBusInjectionKey, formwerkBus)
  provide(formBusInjectionKey, nuxtUiFormBus)
  provide(
    formwerkOptionsInjectionKey,
    computed(() => ({
      validateOn: toValue(options.validateOn),
      isSubmitAttempted: isSubmitAttempted.value,
    })),
  )
  provide(
    formOptionsInjectionKey,
    computed(() => ({
      disabled: toValue(options.disabled),
    })),
  )

  const toggleState = (set: Set<string>, payload?: FormwerkInputEvent) => {
    if (!payload) return

    const { name, payload: isSet } = payload

    if (isSet) {
      set.add(name)
    } else {
      set.delete(name)
    }
  }

  formwerkBus.on(async (event, payload) => {
    switch (event) {
      case "touched":
        toggleState(touchedFields, payload)
        break
      case "blur":
        toggleState(blurredFields, payload)
        break
      case "dirty":
        toggleState(dirtyFields, payload)
        break
    }
  })

  return { blurredFields, touchedFields, dirtyFields }
}
