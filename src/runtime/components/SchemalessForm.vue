<script lang="ts">
  import type { ConsumableData, FormObject, FormReturns, IssueCollection } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, useFormSubmit, useGenericForm, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues } from "../types/form"

  /** Generic in the input shape: the SFC's own `generic` is not in scope here. */
  interface Props<TInput extends FormObject> extends FormRootProps<TInput> {
    /** The only place the form's shape can be inferred from. For async values use `USchemaForm`. */
    initialValues?: TInput | (() => TInput)
  }

  type FormApi<TInput extends FormObject> = FormReturns<TInput>

  type Values<TInput extends FormObject> = FormValues<TInput>

  interface SlotProps<TInput extends FormObject> {
    form: FormApi<TInput>
    values: Values<TInput>
    blurredFields: ReadonlySet<string>
    touchedFields: ReadonlySet<string>
    dirtyFields: ReadonlySet<string>
  }

  interface Slots<TInput extends FormObject> {
    default(props: SlotProps<TInput>): unknown
  }

  interface Emits<TInput extends FormObject> {
    submit: [data: ConsumableData<TInput>]
    error: [issues: IssueCollection[]]
  }

  interface Expose<TInput extends FormObject> extends FormApi<TInput>, FormRootState {}
</script>

<script lang="ts" setup generic="TInput extends FormObject">
  const {
    as = "form",
    showErrorsOn = "blur",
    validateOnInputDelay = 300,
    disabled = false,
    id,
    initialValues,
    initialTouched,
    initialDirty,
  } = defineProps<Props<TInput>>()

  const emit = defineEmits<Emits<TInput>>()

  defineSlots<Slots<TInput>>()

  // Not useForm: a generic component cannot satisfy its overloads. See useGenericForm.
  const form = useGenericForm<FormApi<TInput>>({
    id,
    initialValues,
    initialTouched,
    initialDirty,
    // Destructured props stay reactive in Vue 3.5, so this getter still tracks.
    disabled: () => disabled,
  })

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    showErrorsOn: () => showErrorsOn,
    validateOnInputDelay: () => validateOnInputDelay,
    disabled: () => disabled,
  })

  // Without novalidate the browser's constraint bubbles swallow the submit event.
  const novalidate = computed(() => (as === "form" ? true : undefined))

  const onSubmit = useFormSubmit(form, {
    onSubmit: (data) => emit("submit", data),
    onError: (issues) => emit("error", issues),
  })

  // Explicit type argument: inference inlines type-fest internals the emitter cannot name.
  defineExpose<Expose<TInput>>({ ...form, blurredFields, touchedFields, dirtyFields })
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
