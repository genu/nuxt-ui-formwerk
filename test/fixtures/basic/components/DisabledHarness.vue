<script lang="ts">
  import { useForm } from "@formwerk/core"
  import { ref } from "vue"

  export interface Props {
    disabled?: boolean
  }
</script>

<script setup lang="ts">
  /**
   * Harness for the form-level `disabled` wiring.
   *
   * `UForm` is the root under test because the consumer owns the `useForm()`
   * call here, so `disabled` has to travel prop -> useFormRoot -> Field's
   * useFormField init to reach formwerk. The self-contained roots pass
   * `disabled` straight to `useForm` and never used that path.
   *
   * Both signals are rendered rather than exposed, so the assertions read the
   * DOM instead of reaching into `vm`.
   */
  const { disabled = false } = defineProps<Props>()

  const form = useForm({ initialValues: { email: "a@b.c" } })
  const submitted = ref<Record<string, unknown> | undefined>()

  const onSubmit = form.handleSubmit((data) => {
    submitted.value = data.toObject()
  })
</script>

<template>
  <form @submit="onSubmit">
    <UForm :disabled="disabled">
      <UFormField name="email" label="Email">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="email-input" />
        </template>
      </UFormField>
    </UForm>
    <!-- What formwerk itself believes about the path. -->
    <span data-testid="is-path-disabled">{{ form.context.isPathDisabled("email") }}</span>
    <!-- The consequence: disabled paths are stripped from the submitted data. -->
    <span data-testid="submitted">{{ submitted === undefined ? "none" : JSON.stringify(submitted) }}</span>
    <button type="submit" data-testid="submit">Submit</button>
  </form>
</template>
