<template>
  <div>
    <div data-testid="basic">custom-prefix</div>

    <!-- Test: Components use custom N prefix -->
    <form @submit.prevent="onSubmit">
      <NForm data-testid="form" :validate-on="'blur'">
        <NFormField data-testid="form-field" name="email" label="Email">
          <template #default="{ model }">
            <NInput v-bind="model" data-testid="email-input" />
          </template>
        </NFormField>
      </NForm>
    </form>

    <!-- Test: Original Nuxt UI components accessible with NuxtUi prefix -->
    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <NInput data-testid="test-input" />
    </NuxtUiFormField>
  </div>
</template>

<script setup>
import { useForm } from "@formwerk/core"

const { handleSubmit } = useForm()
const onSubmit = handleSubmit(() => {
  // Handle form submit
})
</script>
