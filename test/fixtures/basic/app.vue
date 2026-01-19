<template>
  <div>
    <div data-testid="basic">basic</div>

    <!-- Test: UForm and UFormField render without recursion -->
    <form @submit.prevent="onSubmit">
      <UForm data-testid="form" :validate-on="'blur'">
        <UFormField data-testid="form-field" name="email" label="Email">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="email-input" />
          </template>
        </UFormField>

        <UFormField data-testid="form-field-required" name="username" label="Username" required>
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="username-input" />
          </template>
        </UFormField>
      </UForm>
    </form>

    <!-- Test: Original Nuxt UI components are accessible with NuxtUi prefix -->
    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <UInput data-testid="test-input" />
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
