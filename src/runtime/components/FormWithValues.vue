<script lang="ts">
  import { useForm, type ConsumableData, type FormObject, type NoSchemaFormProps, type Path } from "@formwerk/core"
  import { useFormwerkBridge } from "../composables/useFormwerkBridge"
  import type { FormwerkInputEvents, OwnedFormSlotProps } from "../types/form"

  export interface FormWithValuesProps<TInput extends FormObject> {
    /**
     * The form's initial values, and the source of its type.
     *
     * Formwerk accepts a partial here, but this component asks for the complete
     * shape: with no schema to infer from, TypeScript cannot recover `TInput`
     * out of a `PartialDeep<TInput>`, and Vue templates have no syntax for
     * passing an explicit type argument. A full object *is* the declaration.
     *
     * Read once, at setup — see `UFormWithSchema` for the async caveat.
     */
    initialValues: TInput
    initialTouched?: NoSchemaFormProps<TInput>["initialTouched"]
    initialDirty?: NoSchemaFormProps<TInput>["initialDirty"]
    /** Defaults to a generated id. Must be unique — the event buses key off it. */
    id?: string
    disabled?: boolean
    disableHtmlValidation?: boolean
    scrollToInvalidFieldOnSubmit?: NoSchemaFormProps<TInput>["scrollToInvalidFieldOnSubmit"]
    /**
     * When errors become visible. Formwerk validates continuously, so this only
     * gates display, unlike Nuxt UI's `validateOn` which gates validation.
     */
    validateOn?: FormwerkInputEvents
  }

  export type FormWithValuesSlots<TInput extends FormObject> = {
    default(props: OwnedFormSlotProps<TInput, TInput>): any
  }
</script>

<script lang="ts" setup generic="TInput extends FormObject">
  const {
    initialValues,
    initialTouched,
    initialDirty,
    id,
    disabled = false,
    disableHtmlValidation,
    scrollToInvalidFieldOnSubmit,
    validateOn = "blur",
  } = defineProps<FormWithValuesProps<TInput>>()

  const emit = defineEmits<{
    submit: [payload: ConsumableData<TInput>]
  }>()

  defineSlots<FormWithValuesSlots<TInput>>()

  const form = useForm<TInput>({
    // Safe by construction: `initialValues` is the complete shape, which always
    // satisfies the `PartialDeep<TInput>` formwerk asks for. TypeScript cannot
    // verify that while `TInput` is still an unresolved type parameter.
    initialValues: (() => initialValues) as NoSchemaFormProps<TInput>["initialValues"],
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

  const submit = form.handleSubmit((payload) => {
    emit("submit", payload as ConsumableData<TInput>)
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
      :blurred-fields="blurredFields as ReadonlySet<Path<TInput>>"
      :touched-fields="touchedFields as ReadonlySet<Path<TInput>>"
      :dirty-fields="dirtyFields as ReadonlySet<Path<TInput>>" />
  </form>
</template>
