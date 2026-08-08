import { computed, provide, reactive, toValue, type MaybeRefOrGetter } from "vue"
import { useEventBus } from "@vueuse/core"
import type { FormReturns } from "@formwerk/core"
import { formBusInjectionKey, formOptionsInjectionKey } from "@nuxt/ui/composables/useFormField"
import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvent, type FormwerkInputEvents } from "../types/form"

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
export function useFormRoot(form: FormReturns<any, any>, options: UseFormRootOptions): FormRootState {
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
