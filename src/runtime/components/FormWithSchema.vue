<script lang="ts">
  import { useForm, type ConsumableData, type GenericFormSchema, type Path, type SchemaFormProps } from "@formwerk/core"
  import { useFormwerkBridge } from "../composables/useFormwerkBridge"
  import type { FormwerkInputEvents, InferSchemaInput, InferSchemaOutput, OwnedFormSlotProps } from "../types/form"

  export interface FormWithSchemaProps<TSchema extends GenericFormSchema> {
    /** The validation schema. Any Standard Schema library works (Zod, Valibot, Arktype...). */
    schema: TSchema
    /**
     * Read once, at setup. A getter is not re-invoked and a ref that resolves
     * later is ignored — pass a promise, or `:key` the component, when the
     * values arrive asynchronously.
     */
    initialValues?: SchemaFormProps<TSchema>["initialValues"]
    initialTouched?: SchemaFormProps<TSchema>["initialTouched"]
    initialDirty?: SchemaFormProps<TSchema>["initialDirty"]
    /** Defaults to a generated id. Must be unique — the event buses key off it. */
    id?: string
    disabled?: boolean
    disableHtmlValidation?: boolean
    scrollToInvalidFieldOnSubmit?: SchemaFormProps<TSchema>["scrollToInvalidFieldOnSubmit"]
    /**
     * When errors become visible. Formwerk validates continuously, so this only
     * gates display, unlike Nuxt UI's `validateOn` which gates validation.
     */
    validateOn?: FormwerkInputEvents
  }

  export type FormWithSchemaSlots<TSchema extends GenericFormSchema> = {
    default(props: OwnedFormSlotProps<InferSchemaInput<TSchema>, InferSchemaOutput<TSchema>>): any
  }
</script>

<script lang="ts" setup generic="TSchema extends GenericFormSchema">
  const {
    schema,
    initialValues,
    initialTouched,
    initialDirty,
    id,
    disabled = false,
    disableHtmlValidation,
    scrollToInvalidFieldOnSubmit,
    validateOn = "blur",
  } = defineProps<FormWithSchemaProps<TSchema>>()

  const emit = defineEmits<{
    submit: [payload: ConsumableData<InferSchemaOutput<TSchema>>]
  }>()

  defineSlots<FormWithSchemaSlots<TSchema>>()

  const form = useForm({
    schema,
    initialValues,
    initialTouched,
    initialDirty,
    id,
    disabled: () => disabled,
    disableHtmlValidation,
    scrollToInvalidFieldOnSubmit,
  })

  const { dirtyFields, touchedFields, blurredFields } = useFormwerkBridge({
    id: form.context.id,
    validateOn: () => validateOn,
    disabled: () => disabled,
    isSubmitAttempted: () => form.isSubmitAttempted.value,
  })

  /**
   * Bound once so the template can call it directly. Formwerk's own
   * `formProps.onSubmit` performs a native browser submission, which is not
   * what a Nuxt UI user expects, so we wire our own handler instead.
   */
  const submit = form.handleSubmit((payload) => {
    emit("submit", payload)
  })

  const reset = () => form.reset()

  defineExpose({ form, submit, reset })
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <slot
      :values="form.values"
      :submit="submit"
      :reset="reset"
      :is-submitting="form.isSubmitting.value"
      :is-valid="form.isValid()"
      :blurred-fields="blurredFields as ReadonlySet<Path<InferSchemaInput<TSchema>>>"
      :touched-fields="touchedFields as ReadonlySet<Path<InferSchemaInput<TSchema>>>"
      :dirty-fields="dirtyFields as ReadonlySet<Path<InferSchemaInput<TSchema>>>" />
  </form>
</template>
