<template>
  <div>
    <div data-testid="basic">basic</div>

    <!-- Test: Nuxt UI's own Form is no longer shadowed, so it still renders a <form> -->
    <UForm data-testid="nuxtui-form" :state="{ plain: '' }">
      <NuxtUiFormField data-testid="nuxtui-nested-field" name="plain" label="Plain">
        <UInput data-testid="plain-input" />
      </NuxtUiFormField>
    </UForm>

    <!-- Test: Original Nuxt UI FormField is accessible with the NuxtUi prefix -->
    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <UInput data-testid="test-input" />
    </NuxtUiFormField>

    <!-- Test: USchemaForm owns its own useForm() call, and UFormField renders without recursion -->
    <USchemaForm data-testid="schema-form" :schema="schema">
      <template #default="{ values }">
        <UFormField data-testid="form-field" name="email" label="Schema Email">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="schema-email-input" />
          </template>
        </UFormField>

        <UFormField data-testid="form-field-required" name="username" label="Username" required>
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="username-input" />
          </template>
        </UFormField>

        <span data-testid="schema-values">{{ values }}</span>
      </template>
    </USchemaForm>

    <!-- Test: USchemalessForm needs no schema -->
    <USchemalessForm data-testid="schemaless-form" :initial-values="{ nickname: '' }">
      <template #default>
        <UFormField name="nickname" label="Nickname">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="nickname-input" />
          </template>
        </UFormField>
      </template>
    </USchemalessForm>

    <!-- Test: as prop escapes the nested-form restriction -->
    <USchemaForm data-testid="as-div-form" as="div" :schema="schema">
      <template #default>
        <span>as-div</span>
      </template>
    </USchemaForm>

    <!-- Test: two forms in one component -->
    <USchemaForm data-testid="multi-form-a" :schema="schema">
      <template #default>
        <span>a</span>
      </template>
    </USchemaForm>
    <USchemaForm data-testid="multi-form-b" :schema="schema">
      <template #default>
        <span>b</span>
      </template>
    </USchemaForm>
  </div>
</template>

<script setup>
  import { z } from "zod"

  const schema = z.object({
    email: z.string(),
  })
</script>
