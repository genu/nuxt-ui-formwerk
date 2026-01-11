<script lang="ts">
  import type { FormFieldProps } from "@nuxt/ui"
</script>

<script setup lang="ts">
  import { useCustomControl } from "@formwerk/core"
  import { formBusInjectionKey } from "#imports"
  import { inject, watch, computed } from "vue"
  import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvents } from "../types/form"

  export type FieldProps = Omit<FormFieldProps, "validateOnInputDelay" | "errorPattern" | "eagerValidation" | "error">

  export interface FieldSlots {
    default(props: {
      model: { modelValue: any; "onUpdate:modelValue": (value: any) => void }
      setValue: (value: any) => void
      value: any
    }): any
  }

  const props = defineProps<FieldProps>()

  const formBus = inject(formBusInjectionKey, undefined)
  const formwerkBus = inject(formwerkBusInjectionKey, undefined)
  const formwerkOptions = inject(formwerkOptionsInjectionKey, undefined)

  const {
    field: { errorMessage, fieldValue, setValue, setBlurred, setTouched, isTouched, isBlurred, isDirty },
  } = useCustomControl<any>({
    name: props.name,
    required: props.required,
    disabled: formwerkOptions?.value?.disabled,
  })

  const emitFormEvent = (type: FormwerkInputEvents, name?: string, payload?: unknown) => {
    if (formwerkBus && name) formwerkBus.emit(type, { name, payload })
  }

  watch(isTouched, (newValue) => emitFormEvent("touched", props.name, newValue))
  watch(isBlurred, (newValue) => emitFormEvent("blur", props.name, newValue))
  watch(isDirty, (newValue) => emitFormEvent("dirty", props.name, newValue))

  const error = computed(() => {
    if (!formwerkOptions || !formwerkOptions.value) return errorMessage.value ? errorMessage.value : undefined

    switch (formwerkOptions.value.validateOn) {
      case "blur":
        return isBlurred.value && errorMessage.value ? errorMessage.value : undefined
      default:
        return errorMessage.value ? errorMessage.value : undefined
    }
  })

  const model = computed(() => ({
    modelValue: fieldValue.value,
    "onUpdate:modelValue": setValue,
  }))

  /**
   * Intercept form events
   */

  if (formBus) {
    formBus.on(async (event) => {
      switch (event.type) {
        case "blur":
          setBlurred(true)
          break
        case "change":
        case "input":
        case "focus":
          setTouched(true)
          break
      }
    })
  }
</script>

<template>
  <UFormField v-bind="props" :error="error">
    <slot :model="model" :set-value="setValue" :value="fieldValue" />
  </UFormField>
</template>
