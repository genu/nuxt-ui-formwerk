<script lang="ts">
  import { useTemplateRef } from "vue"

  interface FormExpose {
    context: { setFieldSubmitErrors: (path: string, message: string) => void }
  }
</script>

<script setup lang="ts">
  /**
   * Harness for server-side errors.
   *
   * `setFieldSubmitErrors` writes to formwerk's submit-error bag, which is
   * separate from the one schema validation and `form.setErrors` share. That
   * separation is what lets `Field.vue` show it without the visibility gate:
   * the field here is never touched, blurred or dirtied.
   *
   * Reached through a template ref rather than the `form` slot prop, because
   * slot scope does not extend to the component's own `@submit` attribute.
   */
  const formRef = useTemplateRef<FormExpose>("form")

  const onSubmit = () => {
    formRef.value?.context.setFieldSubmitErrors("email", "already taken")
  }
</script>

<template>
  <USchemalessForm ref="form" data-testid="form" :initial-values="{ email: 'a@b.c' }" @submit="onSubmit">
    <UFormField name="email" label="Email">
      <template #default="{ model }">
        <UInput v-bind="model" data-testid="email-input" />
      </template>
    </UFormField>
  </USchemalessForm>
</template>
