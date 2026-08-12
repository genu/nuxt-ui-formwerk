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

  // This component overrides Nuxt UI's UFormField, so it can be reached from
  // inside a plain Nuxt UI <UForm> — where it would keep its value in formwerk
  // while the form read from `state`, and silently submit nothing. Fail loudly
  // instead.
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
    // Static. This only labels the field in formwerk's devtools inspector —
    // nothing branches on it. It used to be guessed by invoking the default
    // slot during setup and reading the first vnode's component name, but that
    // call runs before `useCustomControl` produces `setValue` and `fieldValue`,
    // so it could only pass a half-built payload and any slot reading a
    // property off `value` crashed. The ordering is circular, so there is no
    // version of the guess that works.
    controlType: "CustomInput",
    _field: field,
  })

  const emitFormEvent = (type: FormwerkInputEvents, name?: string, payload?: unknown) => {
    if (formwerkBus && name) formwerkBus.emit(type, { name, payload })
  }

  watch(isTouched, (newValue) => emitFormEvent("touched", props.name, newValue))
  watch(isBlurred, (newValue) => emitFormEvent("blur", props.name, newValue))
  watch(isDirty, (newValue) => emitFormEvent("dirty", props.name, newValue))

  /**
   * A validation error, but only once the field has reached the state the form
   * asked to gate on. Without the gate, validating one field would light up
   * every other field in the schema, none of which the user has touched yet.
   */
  const visibleValidationError = computed(() => {
    if (!errorMessage.value) return undefined

    // Once a submit has been attempted, formwerk has already run full-schema
    // validation, so surface errors regardless of per-field interaction state
    // (mirrors Nuxt UI's own <UForm>, which always validates on submit).
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
    // A live validation error wins: after a submit the gate is open anyway, so
    // reaching the fallback means the schema is currently happy with this field
    // and a stale submit error would be the more misleading of the two.
    if (visibleValidationError.value) return visibleValidationError.value

    // Submit errors skip the gate. They are never speculative — either
    // formwerk's submit handler wrote them, or the app did for a server-side
    // failure — and formwerk clears them at the start of every submit, so they
    // cannot outlive the attempt that produced them.
    return submitErrorMessage.value || undefined
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
