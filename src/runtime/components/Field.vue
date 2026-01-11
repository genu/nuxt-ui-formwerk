<script lang="ts">
  import { useCustomControl, useFormField } from "@formwerk/core"
  import type { FormFieldProps } from "@nuxt/ui"
  import { formBusInjectionKey } from "#imports"
  import { inject, watch, computed, useSlots, type Component } from "vue"
  import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvents } from "../types/form"
</script>

<script setup lang="ts">
  export type FieldProps = Omit<FormFieldProps, "validateOnInputDelay" | "errorPattern" | "eagerValidation" | "error">

  export interface FieldSlots {
    default(props: {
      model: { modelValue: any; "onUpdate:modelValue": (value: any) => void }
      setValue: (value: any) => void
      value: any
    }): any
  }

  const props = defineProps<FieldProps>()
  const slots = useSlots()

  const formBus = inject(formBusInjectionKey, undefined)
  const formwerkBus = inject(formwerkBusInjectionKey, undefined)
  const formwerkOptions = inject(formwerkOptionsInjectionKey, undefined)

  const field = useFormField({
    path: props.name,
    label: props.label,
    description: props.description,
  })

  const defaultSlot = slots.default?.({ model: {} })
  const firstNode = defaultSlot?.[0]

  let slotComponentName: string | null = null

  if (firstNode && typeof firstNode.type === "object" && firstNode.type !== null) {
    const component = firstNode.type as Component & { __name?: string }
    if (component.__name || component.name) slotComponentName = component.__name || component.name || null
  }

  const {
    field: { errorMessage, fieldValue, setValue, setBlurred, setTouched, isTouched, isBlurred, isDirty },
  } = useCustomControl<any>({
    name: props.name,
    required: props.required,
    disabled: formwerkOptions?.value?.disabled,
    controlType: slotComponentName || "CustomInput",
    _field: field,
  })

  const emitFormEvent = (type: FormwerkInputEvents, name?: string, payload?: unknown) => {
    if (formwerkBus && name) formwerkBus.emit(type, { name, payload })
  }

  watch(isTouched, (newValue) => emitFormEvent("touched", props.name, newValue))
  watch(isBlurred, (newValue) => emitFormEvent("blur", props.name, newValue))
  watch(isDirty, (newValue) => emitFormEvent("dirty", props.name, newValue))

  const error = computed(() => {
    if (!formwerkOptions || !formwerkOptions.value) return errorMessage.value ? errorMessage.value : undefined

    if (formwerkOptions.value.validateOn === "blur") {
      return isBlurred.value && errorMessage.value ? errorMessage.value : undefined
    }
    return errorMessage.value ? errorMessage.value : undefined
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
      // Only respond to events for this specific field
      if ("name" in event && event.name !== props.name) return

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
    <slot
      :model="model"
      :set-value="setValue"
      :value="fieldValue"
      :is-touched="isTouched"
      :is-blurred="isBlurred"
      :is-dirty="isDirty" />
  </UFormField>
</template>
