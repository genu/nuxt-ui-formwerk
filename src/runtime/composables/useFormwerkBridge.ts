import { provide, reactive, computed } from "vue"
import { useEventBus } from "@vueuse/core"
import { formBusInjectionKey, formOptionsInjectionKey } from "@nuxt/ui/composables/useFormField"
import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvent, type FormwerkInputEvents } from "../types/form"

export interface FormwerkBridgeOptions {
  /**
   * The formwerk form id. Both event buses are keyed off this, so forms that
   * share an id also share a bus and will see each other's field events.
   */
  id: string
  validateOn: () => FormwerkInputEvents
  disabled: () => boolean
  isSubmitAttempted: () => boolean
}

export interface FormwerkBridgeState {
  dirtyFields: ReadonlySet<string>
  touchedFields: ReadonlySet<string>
  blurredFields: ReadonlySet<string>
}

/**
 * Wires a formwerk form into Nuxt UI's form system.
 *
 * This is the half of a form root that has nothing to do with where the form
 * came from: it provides the injection keys `UFormField` needs, bridges the two
 * event buses, and tracks per-field interaction state. Every form root shares
 * it and differs only in how it obtains the form.
 */
export const useFormwerkBridge = (options: FormwerkBridgeOptions): FormwerkBridgeState => {
  const formwerkBus = useEventBus<FormwerkInputEvents, FormwerkInputEvent>(`formwerk-form-${options.id}`)
  const NuxtUiFormBus = useEventBus<any>(`form-${options.id}`)

  const dirtyFields: Set<string> = reactive(new Set<string>())
  const touchedFields: Set<string> = reactive(new Set<string>())
  const blurredFields: Set<string> = reactive(new Set<string>())

  /**
   * Providers
   */
  provide(formwerkBusInjectionKey, formwerkBus)
  provide(formBusInjectionKey, NuxtUiFormBus)
  provide(
    formwerkOptionsInjectionKey,
    computed(() => ({
      validateOn: options.validateOn(),
      isSubmitAttempted: options.isSubmitAttempted(),
    })),
  )
  provide(
    formOptionsInjectionKey,
    computed(() => ({
      disabled: options.disabled(),
    })),
  )

  /**
   * Event Handlers
   */
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

  return { dirtyFields, touchedFields, blurredFields }
}
