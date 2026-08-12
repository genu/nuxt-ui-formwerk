<script lang="ts">
  import type { ConsumableData, FormReturns, GenericFormSchema, IssueCollection, MaybeAsync, MaybeGetter } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, useFormSubmit, useGenericForm, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues, SchemaInput, SchemaOutput } from "../types/form"

  /** Generic in the schema rather than in the input shape, so it can be written out here — the SFC's own `generic` parameter is not in scope in this block. */
  interface Props<TSchema extends GenericFormSchema> extends FormRootProps<SchemaInput<TSchema>> {
    /** Read once at setup — use `:key` to swap it. */
    schema: TSchema
    initialValues?: MaybeGetter<MaybeAsync<FormValues<SchemaInput<TSchema>>>>
  }

  type FormApi<TSchema extends GenericFormSchema> = FormReturns<SchemaInput<TSchema>, SchemaOutput<TSchema>>

  type Values<TSchema extends GenericFormSchema> = FormValues<SchemaInput<TSchema>>

  interface SlotProps<TSchema extends GenericFormSchema> {
    form: FormApi<TSchema>
    values: Values<TSchema>
    blurredFields: ReadonlySet<string>
    touchedFields: ReadonlySet<string>
    dirtyFields: ReadonlySet<string>
  }

  interface Slots<TSchema extends GenericFormSchema> {
    default(props: SlotProps<TSchema>): unknown
  }

  interface Emits<TSchema extends GenericFormSchema> {
    submit: [data: ConsumableData<SchemaOutput<TSchema>>]
    error: [issues: IssueCollection[]]
  }

  interface Expose<TSchema extends GenericFormSchema> extends FormApi<TSchema>, FormRootState {}
</script>

<script lang="ts" setup generic="TSchema extends GenericFormSchema">
  const {
    as = "form",
    showErrorsOn = "blur",
    validateOnInputDelay = 300,
    disabled = false,
    id,
    schema,
    initialValues,
    initialTouched,
    initialDirty,
  } = defineProps<Props<TSchema>>()

  const emit = defineEmits<Emits<TSchema>>()

  defineSlots<Slots<TSchema>>()

  // useGenericForm, not useForm — a generic component cannot satisfy useForm's
  // overload constraints. See useGenericForm for why, and why the assertion it
  // holds is unavoidable. The public surface stays fully typed either way.
  const form = useGenericForm<FormApi<TSchema>>({
    id,
    schema,
    initialValues,
    initialTouched,
    initialDirty,
    // Destructured props stay reactive in Vue 3.5 — the compiler rewrites each
    // reference back to `__props.x`, so these getters still track changes.
    disabled: () => disabled,
  })

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    showErrorsOn: () => showErrorsOn,
    validateOnInputDelay: () => validateOnInputDelay,
    disabled: () => disabled,
  })

  // Native constraint validation would fire before submit and swallow the
  // event, so @submit/@error would never emit. formwerk's own formProps sets
  // novalidate for the same reason. Undefined (not false) keeps the attribute
  // off non-form elements entirely.
  const novalidate = computed(() => (as === "form" ? true : undefined))

  const onSubmit = useFormSubmit(form, {
    onSubmit: (data) => emit("submit", data),
    onError: (issues) => emit("error", issues),
  })

  // Explicit type argument, not inferred: inference would inline type-fest internals the declaration emitter cannot name.
  defineExpose<Expose<TSchema>>({ ...form, blurredFields, touchedFields, dirtyFields })
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
