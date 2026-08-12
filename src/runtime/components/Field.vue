<script lang="ts">
  import { useCustomControl, useFormField } from "@formwerk/core"
  import type { FormFieldProps } from "@nuxt/ui"
  import { formBusInjectionKey } from "@nuxt/ui/composables/useFormField"
  import { inject, watch, computed } from "vue"
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

  const formBus = inject(formBusInjectionKey, undefined)
  const formwerkBus = inject(formwerkBusInjectionKey, undefined)
  const formwerkOptions = inject(formwerkOptionsInjectionKey, undefined)

  // Overriding Nuxt UI's UFormField means a plain <UForm> can reach this, where it
  // would hold its value in formwerk while that form reads from `state`.
  if (!formwerkOptions) {
    throw new Error(
      "UFormField requires a formwerk form root. Wrap it in <USchemaForm> or <USchemalessForm>, " +
        "or use <NuxtUiFormField> for a plain Nuxt UI field.",
    )
  }

  const field = useFormField({
    path: props.name,
    label: props.label,
    description: props.description,
  })

  const {
    field: { errorMessage, submitErrorMessage, fieldValue, setValue, setBlurred, setTouched, isTouched, isBlurred, isDirty },
  } = useCustomControl<any>({
    name: props.name,
    // Devtools label only. Do not try to detect it from the slot: that has to run
    // before the values it would need to pass exist, and crashed slots reading them.
    controlType: "CustomInput",
    _field: field,
  })

  const emitFormEvent = (type: FormwerkInputEvents, name?: string, payload?: unknown) => {
    if (formwerkBus && name) formwerkBus.emit(type, { name, payload })
  }

  watch(isTouched, (newValue) => emitFormEvent("touched", props.name, newValue))
  watch(isBlurred, (newValue) => emitFormEvent("blur", props.name, newValue))
  watch(isDirty, (newValue) => emitFormEvent("dirty", props.name, newValue))

  // Gated, because validating one field populates errors for every other field in
  // the schema, none of which the user has touched yet.
  const visibleValidationError = computed(() => {
    if (!errorMessage.value) return undefined

    // Submit already validated the whole schema, so the gate has nothing left to protect.
    if (formwerkOptions.value.isSubmitAttempted) return errorMessage.value

    switch (formwerkOptions.value.showErrorsOn) {
      case "blur":
        return isBlurred.value ? errorMessage.value : undefined
      case "touched":
        return isTouched.value ? errorMessage.value : undefined
      case "dirty":
        return isDirty.value ? errorMessage.value : undefined
      default:
        return errorMessage.value
    }
  })

  const error = computed(() => {
    if (visibleValidationError.value) return visibleValidationError.value

    // Ungated: a submit error is never speculative, and formwerk clears them at the
    // start of every submit. Second, so a live error beats a stale server one.
    return submitErrorMessage.value || undefined
  })

  const model = computed(() => ({
    modelValue: fieldValue.value,
    "onUpdate:modelValue": setValue,
  }))

  if (formBus) {
    formBus.on(async (event) => {
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
  <NuxtUiFormField v-bind="props" :error="error">
    <slot
      :model="model"
      :set-value="setValue"
      :value="fieldValue"
      :is-touched="isTouched"
      :is-blurred="isBlurred"
      :is-dirty="isDirty" />
  </NuxtUiFormField>
</template>
