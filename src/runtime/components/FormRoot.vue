<script lang="ts">
  import type { ConsumableData, FormObject, FormReturns, IssueCollection } from "@formwerk/core"
  import { computed, type Component } from "vue"
  import { useFormRoot, useFormSubmit, type FormRootState } from "../composables/useFormRoot"
  import type { ErrorVisibility, FormValues } from "../types/form"

  /**
   * `schema`, `id`, `initialValues`, `initialTouched`, `initialDirty` and `disabled`
   * are absent on purpose: they belong to the caller's `useForm()`, so accepting
   * them here would mean silently ignoring them.
   */
  interface Props<TInput extends FormObject, TOutput extends FormObject> {
    /** A form from `useForm()`. Read once at setup — use `:key` to swap it. */
    form: FormReturns<TInput, TOutput>
    /** Element or component to render as. Set to a non-form element to avoid invalid nested `<form>` markup. */
    as?: string | Component
    /** When field errors become visible. */
    showErrorsOn?: ErrorVisibility
    /** Debounce, in ms, that Nuxt UI inputs apply before emitting their `input` event. */
    validateOnInputDelay?: number
  }

  interface SlotProps<TInput extends FormObject, TOutput extends FormObject> {
    form: FormReturns<TInput, TOutput>
    values: FormValues<TInput>
    blurredFields: ReadonlySet<string>
    touchedFields: ReadonlySet<string>
    dirtyFields: ReadonlySet<string>
  }

  interface Slots<TInput extends FormObject, TOutput extends FormObject> {
    default(props: SlotProps<TInput, TOutput>): unknown
  }

  interface Emits<TOutput extends FormObject> {
    submit: [data: ConsumableData<TOutput>]
    error: [issues: IssueCollection[]]
  }
</script>

<script lang="ts" setup generic="TInput extends FormObject, TOutput extends FormObject = TInput">
  const { form, as = "form", showErrorsOn = "blur", validateOnInputDelay = 300 } = defineProps<Props<TInput, TOutput>>()

  const emit = defineEmits<Emits<TOutput>>()

  defineSlots<Slots<TInput, TOutput>>()

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    showErrorsOn: () => showErrorsOn,
    validateOnInputDelay: () => validateOnInputDelay,
    // `useForm({ disabled })` reaches formwerk's context but not Nuxt UI's inputs,
    // which read formOptions. Without this, formwerk strips the path from the
    // payload while the input stays editable.
    disabled: () => form.isDisabled.value,
  })

  // Without novalidate the browser's constraint bubbles swallow the submit event.
  const novalidate = computed(() => (as === "form" ? true : undefined))

  const onSubmit = useFormSubmit(form, {
    onSubmit: (data) => emit("submit", data),
    onError: (issues) => emit("error", issues),
  })

  // Only the interaction state: the caller already holds the form.
  defineExpose<FormRootState>({ blurredFields, touchedFields, dirtyFields })
</script>

<template>
  <component :is="as" :id="form.formProps.id" :novalidate="novalidate" @submit="onSubmit">
    <slot
      :form="form"
      :values="form.values"
      :blurred-fields="blurredFields"
      :touched-fields="touchedFields"
      :dirty-fields="dirtyFields" />
  </component>
</template>
