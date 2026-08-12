<script lang="ts">
  import { useTemplateRef } from "vue"

  interface FormExpose {
    context: { setFieldSubmitErrors: (path: string, message: string) => void }
  }
</script>

<script setup lang="ts">
  /**
   * `setFieldSubmitErrors` writes to the submit-error bag, which `Field.vue` shows
   * ungated. Template ref rather than the `form` slot prop, because slot scope does
   * not reach the component's own `@submit`.
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
