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

    <!--
      Test: two form roots that own their own form stay isolated inside this
      single component. Both use the field name "nickname" deliberately: if the
      second useForm() overwrote the first, both inputs would render the same
      value.
    -->
    <UFormWithValues data-testid="form-a" :initial-values="{ nickname: 'alpha' }">
      <UFormField data-testid="field-a" name="nickname" label="Nickname A">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="input-a" />
        </template>
      </UFormField>
    </UFormWithValues>

    <UFormWithValues data-testid="form-b" :initial-values="{ nickname: 'beta' }">
      <UFormField data-testid="field-b" name="nickname" label="Nickname B">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="input-b" />
        </template>
      </UFormField>
    </UFormWithValues>

    <!-- Test: the schema-driven root renders and seeds its own values -->
    <UFormWithSchema data-testid="form-schema" :schema="passthroughSchema" :initial-values="{ email: 'gamma' }">
      <UFormField data-testid="field-schema" name="email" label="Schema Email">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="input-schema" />
        </template>
      </UFormField>
    </UFormWithSchema>
  </div>
</template>

<script setup>
import { useForm } from "@formwerk/core"

const { handleSubmit } = useForm()
const onSubmit = handleSubmit(() => {
  // Handle form submit
})

// A minimal Standard Schema, so the fixture needs no schema library.
const passthroughSchema = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (value) => ({ value }),
  },
}
</script>
