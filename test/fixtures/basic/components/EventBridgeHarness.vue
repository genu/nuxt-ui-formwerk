<script lang="ts">
  import { z } from "zod"
  import type { ErrorVisibility } from "../../../../src/runtime/types/form"

  export interface Props {
    showErrorsOn?: ErrorVisibility
  }
</script>

<script setup lang="ts">
  /**
   * The three sets are the only visible output of the bridge, so they carry the
   * assertions. `validate-on-input-delay="0"` skips Nuxt UI's 300ms input debounce.
   */
  const { showErrorsOn = "blur" } = defineProps<Props>()

  const schema = z.object({
    email: z.string().min(3, "email too short"),
    other: z.string().min(3, "other too short"),
  })
</script>

<template>
  <USchemaForm
    data-testid="form"
    :schema="schema"
    :show-errors-on="showErrorsOn"
    :validate-on-input-delay="0"
    :initial-values="{ email: '', other: '' }"
    #="{ blurredFields, touchedFields, dirtyFields }">
    <UFormField name="email" label="Email">
      <template #default="{ model }">
        <UInput v-bind="model" data-testid="email" />
      </template>
    </UFormField>
    <UFormField name="other" label="Other">
      <template #default="{ model }">
        <UInput v-bind="model" data-testid="other" />
      </template>
    </UFormField>
    <span data-testid="blurred">{{ [...blurredFields].join(",") }}</span>
    <span data-testid="touched">{{ [...touchedFields].join(",") }}</span>
    <span data-testid="dirty">{{ [...dirtyFields].join(",") }}</span>
  </USchemaForm>
</template>
