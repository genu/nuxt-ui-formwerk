<script lang="ts">
  import type { ConsumableData, FormObject, FormReturns, IssueCollection } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, useGenericForm, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues } from "../types/form"

  /** Generic in the input shape so it can be declared here — the SFC's own `generic` parameter is not in scope in this block. */
  interface Props<TInput extends FormObject> extends FormRootProps<TInput> {
    /** The only place the form's shape can be inferred from, so declare it with `type`, not `interface`. For async initial values use `USchemaForm`. */
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
    validateOn = "blur",
    disabled = false,
    id,
    initialValues,
    initialTouched,
    initialDirty,
  } = defineProps<Props<TInput>>()

  const emit = defineEmits<Emits<TInput>>()

  defineSlots<Slots<TInput>>()

  // useGenericForm, not useForm — see useGenericForm for why a generic component
  // cannot satisfy useForm's overload constraints.
  const form = useGenericForm<FormApi<TInput>>({
    id,
    initialValues,
    initialTouched,
    initialDirty,
    // See SchemaForm.vue — destructured props stay reactive in Vue 3.5.
    disabled: () => disabled,
  })

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    validateOn: () => validateOn,
    disabled: () => disabled,
  })

  // See SchemaForm.vue — native constraint validation would swallow the submit
  // event before formwerk ever sees it.
  const novalidate = computed(() => (as === "form" ? true : undefined))

  // See SchemaForm.vue — handleSubmit has no failure hook, so `error` is derived
  // afterwards from getSubmitErrors().
  const onSubmit = async (event?: Event) => {
    // See SchemaForm.vue — getSubmitErrors() is read after an await, so a
    // re-entrant submit would cross the wires. preventDefault still runs, or
    // the ignored submit would navigate the page.
    if (form.isSubmitting.value) {
      event?.preventDefault()
      return
    }

    await form.handleSubmit((data) => emit("submit", data))(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  // See SchemaForm.vue — explicit type argument keeps type-fest internals out of the emitted declarations.
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
