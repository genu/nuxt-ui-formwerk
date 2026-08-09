<script lang="ts">
  import { useForm, type ConsumableData, type FormObject, type FormReturns, type IssueCollection } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues, FormSubmitContext } from "../types/form"
</script>

<script lang="ts" setup generic="TInput extends FormObject">
  type FormApi = FormReturns<TInput>
  /** `PartialDeep<TInput>`, without importing type-fest. */
  type Values = FormValues<TInput>

  const props = withDefaults(
    defineProps<
      FormRootProps<TInput> & {
        /**
         * Initial values. This is the only place the form's shape can be
         * inferred from, so it must be a plain object or a sync getter — an
         * async getter is a compile error. Declare the shape with `type`,
         * not `interface`. For async initial values use USchemaForm, or
         * UForm with your own useForm<T>() call.
         */
        initialValues?: TInput | (() => TInput)
      }
    >(),
    { as: "form", validateOn: "blur", disabled: false },
  )

  const emit = defineEmits<{
    submit: [data: ConsumableData<TInput>, context: FormSubmitContext]
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

  // See SchemaForm.vue — the generic cannot satisfy useForm's overload
  // constraints from inside the component. The public surface stays typed.
  const form = useForm({
    id: props.id,
    initialValues: props.initialValues,
    initialTouched: props.initialTouched,
    initialDirty: props.initialDirty,
    disabled: () => props.disabled,
  } as never) as unknown as FormApi

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    validateOn: () => props.validateOn,
    disabled: () => props.disabled,
  })

  // See SchemaForm.vue — native constraint validation would swallow the submit
  // event before formwerk ever sees it.
  const novalidate = computed(() => (props.as === "form" ? true : undefined))

  // See SchemaForm.vue for why the submit callback awaits an opt-in promise.
  const onSubmit = async (event?: Event) => {
    await form.handleSubmit(async (data) => {
      const pending: Promise<unknown>[] = []

      emit("submit", data, { waitUntil: (work) => void pending.push(work) })

      await Promise.all(pending)
    })(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  // See SchemaForm.vue — annotated so the emitter never inlines type-fest internals.
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
