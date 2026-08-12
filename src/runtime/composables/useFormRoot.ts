import { computed, provide, reactive, toValue, type MaybeRefOrGetter } from "vue"
import { useEventBus } from "@vueuse/core"
import { useForm, type FormReturns, type IssueCollection } from "@formwerk/core"
import { formBusInjectionKey, formOptionsInjectionKey } from "@nuxt/ui/composables/useFormField"
import {
  formwerkOptionsInjectionKey,
  formwerkBusInjectionKey,
  type FormwerkInputEvent,
  type FormwerkInputEvents,
  type ErrorVisibility,
} from "../types/form"

/**
 * Loose on value types by necessity: they derive from the caller's unresolved
 * generic, so there is nothing to check them against. Key names still are.
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
 * `useForm` for generic SFCs. TypeScript cannot prove the options satisfy either
 * overload from inside one (TS2769), hence the assertion. Pass `TForm` explicitly
 * or the public typing collapses to `FormReturns<never>`.
 */
export const useGenericForm = <TForm>(options: UseGenericFormOptions): TForm => useForm(options as never) as unknown as TForm

export interface UseFormRootOptions {
  /** When field errors become visible. Defaults to `"blur"`. */
  showErrorsOn?: MaybeRefOrGetter<ErrorVisibility>
  /** Disables every field in the form. Defaults to `false`. */
  disabled?: MaybeRefOrGetter<boolean>
  /** Debounce Nuxt UI inputs apply before emitting `input`. Defaults to `300`, matching Nuxt UI. */
  validateOnInputDelay?: MaybeRefOrGetter<number>
}

export interface FormRootState {
  blurredFields: Set<string>
  touchedFields: Set<string>
  dirtyFields: Set<string>
}

export interface FormSubmitHandlers {
  onSubmit: (data: any) => void
  onError: (issues: IssueCollection[]) => void
}

/**
 * Submit handler shared by every form root.
 *
 * `handleSubmit` has no failure hook, so failures come from `getSubmitErrors()`
 * afterwards — a read that lands after an `await` and would otherwise report a
 * concurrent attempt's issues, hence the `isSubmitting` gate.
 */
export const useFormSubmit = (form: FormReturns<any, any>, handlers: FormSubmitHandlers) => {
  return async (event?: Event) => {
    if (form.isSubmitting.value) {
      event?.preventDefault()
      return
    }

    await form.handleSubmit((data) => handlers.onSubmit(data))(event)

    const issues = form.getSubmitErrors()

    if (issues.length) handlers.onError(issues)
  }
}

/**
 * Wires a formwerk form into Nuxt UI's form system: both event buses, the four
 * injection keys the field components inject, and per-field interaction state.
 *
 * Taking the form as an argument rather than calling `useForm()` is what lets one
 * component host several independent forms.
 *
 * Prefer `UFormRoot` unless you also want to own the element, `novalidate` and
 * submit handling.
 */
export const useFormRoot = (form: FormReturns<any, any>, options: UseFormRootOptions = {}): FormRootState => {
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
      showErrorsOn: toValue(options.showErrorsOn) ?? "blur",
      isSubmitAttempted: isSubmitAttempted.value,
    })),
  )
  provide(
    formOptionsInjectionKey,
    computed(() => ({
      disabled: toValue(options.disabled) ?? false,
      validateOnInputDelay: toValue(options.validateOnInputDelay) ?? 300,
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
