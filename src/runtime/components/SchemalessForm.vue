<script lang="ts">
  import { useForm, type ConsumableData, type FormObject, type FormReturns, type IssueCollection } from "@formwerk/core"
  import { computed } from "vue"
  import { useFormRoot, type FormRootState } from "../composables/useFormRoot"
  import type { FormRootProps, FormValues } from "../types/form"

  /**
   * Props of `USchemalessForm`.
   *
   * Generic in the input shape so it can be declared here — see SchemaForm.vue,
   * the SFC's own `generic` parameter is not in scope in this block.
   *
   * Not exported, and neither is anything else in this block — see SchemaForm.vue,
   * `../types/index` star-exports every component and these names would collide.
   */
  interface Props<TInput extends FormObject> extends FormRootProps<TInput> {
    /**
     * Initial values. This is the only place the form's shape can be
     * inferred from, so it must be a plain object or a sync getter — an
     * async getter is a compile error. Declare the shape with `type`,
     * not `interface`. For async initial values use USchemaForm, or
     * UForm with your own useForm<T>() call.
     */
    initialValues?: TInput | (() => TInput)
  }

  /** The formwerk form API `USchemalessForm` builds, exposes and hands to its default slot. */
  type FormApi<TInput extends FormObject> = FormReturns<TInput>

  /** The values bag `USchemalessForm` hands to its default slot: `PartialDeep<TInput>`, without importing type-fest. */
  type Values<TInput extends FormObject> = FormValues<TInput>

  /** Default slot props of `USchemalessForm`. */
  interface SlotProps<TInput extends FormObject> {
    form: FormApi<TInput>
    values: Values<TInput>
    blurredFields: ReadonlySet<string>
    touchedFields: ReadonlySet<string>
    dirtyFields: ReadonlySet<string>
  }

  /** Slots of `USchemalessForm`. */
  interface Slots<TInput extends FormObject> {
    default(props: SlotProps<TInput>): unknown
  }

  /** Events of `USchemalessForm`. */
  interface Emits<TInput extends FormObject> {
    submit: [data: ConsumableData<TInput>]
    error: [issues: IssueCollection[]]
  }

  /**
   * What `USchemalessForm` exposes on a template ref.
   *
   * See SchemaForm.vue — annotated so the declaration emitter never inlines
   * type-fest internals.
   */
  type Expose<TInput extends FormObject> = FormApi<TInput> & FormRootState
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

  // See SchemaForm.vue — the generic cannot satisfy useForm's overload
  // constraints from inside the component. The public surface stays typed.
  const form = useForm({
    id,
    initialValues,
    initialTouched,
    initialDirty,
    // See SchemaForm.vue — destructured props stay reactive in Vue 3.5.
    disabled: () => disabled,
  } as never) as unknown as FormApi<TInput>

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
    await form.handleSubmit((data) => emit("submit", data))(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  // Annotated rather than inferred — see Expose.
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
