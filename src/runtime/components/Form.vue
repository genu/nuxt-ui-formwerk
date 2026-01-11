<script lang="ts">
  import { provide, reactive, computed } from "vue"
  import { useEventBus } from "@vueuse/core"
  import { useFormContext } from "@formwerk/core"
  import { formBusInjectionKey, formOptionsInjectionKey } from "#imports"
  import {
    formwerkOptionsInjectionKey,
    formwerkBusInjectionKey,
    type FormwerkInputEvent,
    type FormwerkInputEvents,
  } from "../types/form"

  export interface Props {
    validateOn?: "touched" | "blur" | "dirty"
    disabled?: boolean
  }
</script>

<script lang="ts" setup>
  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<any>; touchedFields: ReadonlySet<any>; dirtyFields: ReadonlySet<any> }): any
  }
  const formContext = useFormContext()

  if (!formContext) {
    throw new Error("FormwerkForm must be used within a component that has called useForm()")
  }

  const { context } = formContext

  const { validateOn = "blur", disabled = false } = defineProps<Props>()
  const formwerkBus = useEventBus<FormwerkInputEvents, FormwerkInputEvent>(`formwerk-form-${context.id}`)
  const NuxtUiFormBus = useEventBus<any>(`form-${context.id}`)

  const dirtyFields: Set<any> = reactive(new Set<any>())
  const touchedFields: Set<any> = reactive(new Set<any>())
  const blurredFields: Set<any> = reactive(new Set<any>())

  /**
   * Providers
   */
  provide(formwerkBusInjectionKey, formwerkBus)
  provide(formBusInjectionKey, NuxtUiFormBus)
  provide(
    formwerkOptionsInjectionKey,
    computed(() => ({
      validateOn: validateOn,
    })),
  )
  provide(
    formOptionsInjectionKey,
    computed(() => ({
      disabled,
    })),
  )

  /**
   * Event Handlers
   */
  const toggleState = (set: Set<any>, payload?: FormwerkInputEvent) => {
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
</script>

<template>
  <div>
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </div>
</template>
