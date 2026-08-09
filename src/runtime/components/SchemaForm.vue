<script lang="ts">
  import {
    useForm,
    type ConsumableData,
    type FormReturns,
    type GenericFormSchema,
    type IssueCollection,
    type MaybeAsync,
    type MaybeGetter,
  } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues, SchemaInput, SchemaOutput } from "../types/form"
</script>

<script lang="ts" setup generic="TSchema extends GenericFormSchema">
  type TInput = SchemaInput<TSchema>
  type TOutput = SchemaOutput<TSchema>
  type FormApi = FormReturns<TInput, TOutput>
  /** `PartialDeep<TInput>`, without importing type-fest. */
  type Values = FormValues<TInput>

  const props = withDefaults(
    defineProps<
      FormRootProps<TInput> & {
        /** Standard Schema (zod, valibot, …). Drives all type inference. Read once at setup — use `:key` to swap it. */
        schema: TSchema
        initialValues?: MaybeGetter<MaybeAsync<Values>>
      }
    >(),
    { as: "form", validateOn: "blur", disabled: false },
  )

  const emit = defineEmits<{
    submit: [data: ConsumableData<TOutput>]
    error: [issues: IssueCollection[]]
  }>()

  defineSlots<{
    default(props: {
      form: FormApi
      values: Values
      blurredFields: ReadonlySet<string>
      touchedFields: ReadonlySet<string>
      dirtyFields: ReadonlySet<string>
    }): unknown
  }>()

  // The generic Values type cannot be proven to satisfy useForm's own overload
  // constraints from inside the component, so the argument is cast here. The
  // public surface — props, slots, emits, expose — stays fully typed.
  const form = useForm({
    id: props.id,
    schema: props.schema,
    initialValues: props.initialValues,
    initialTouched: props.initialTouched,
    initialDirty: props.initialDirty,
    disabled: () => props.disabled,
  } as never) as unknown as FormApi

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    validateOn: () => props.validateOn,
    disabled: () => props.disabled,
  })

  // Native constraint validation would fire before submit and swallow the
  // event, so @submit/@error would never emit. formwerk's own formProps sets
  // novalidate for the same reason. Undefined (not false) keeps the attribute
  // off non-form elements entirely.
  const novalidate = computed(() => (props.as === "form" ? true : undefined))

  // handleSubmit only runs its callback on success and offers no failure hook,
  // so `error` is derived afterwards. It also calls preventDefault itself.
  //
  // Vue discards whatever an emit listener returns, so `isSubmitting` covers
  // validation only. Async submit work that needs a loading state should go
  // through `form.handleSubmit` (slot prop or template ref) instead.
  const onSubmit = async (event?: Event) => {
    await form.handleSubmit((data) => emit("submit", data))(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  // Annotated rather than inferred: spreading `form` structurally would inline
  // type-fest internals the emitter cannot name. See FormValues in ../types/form.
  defineExpose<FormApi & FormRootState>({ ...form, blurredFields, touchedFields, dirtyFields })
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
