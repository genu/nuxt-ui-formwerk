<template>
  <div>
    <div data-testid="basic">custom-prefix</div>

    <!-- Test: Nuxt UI's own Form keeps the custom prefix and is not shadowed -->
    <NForm data-testid="nuxtui-form" :state="{ plain: '' }">
      <NuxtUiFormField data-testid="nuxtui-nested-field" name="plain" label="Plain">
        <NInput data-testid="plain-input" />
      </NuxtUiFormField>
    </NForm>

    <!-- Test: Original Nuxt UI FormField accessible with NuxtUi prefix -->
    <NuxtUiFormField data-testid="nuxtui-form-field" name="test" label="Test Field">
      <NInput data-testid="test-input" />
    </NuxtUiFormField>

    <!-- Test: our components use the custom N prefix -->
    <NSchemaForm data-testid="schema-form" :schema="schema">
      <template #default>
        <NFormField data-testid="form-field" name="email" label="Email">
          <template #default="{ model }">
            <NInput v-bind="model" data-testid="schema-email-input" />
          </template>
        </NFormField>
      </template>
    </NSchemaForm>

    <NFormRoot :form="adopted" data-testid="form-root">
      <template #default>
        <span>adopted</span>
      </template>
    </NFormRoot>

    <NSchemalessForm data-testid="schemaless-form" :initial-values="{ nickname: '' }">
      <template #default>
        <span>schemaless</span>
      </template>
    </NSchemalessForm>
  </div>
</template>

<script setup>
  import { z } from "zod"
  import { useForm } from "@formwerk/core"

  const schema = z.object({
    email: z.string(),
  })

  const adopted = useForm({ initialValues: { email: "" } })
</script>
