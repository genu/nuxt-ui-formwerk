<script setup lang="ts">
  import { z } from "zod"

  /** Reading a property off `value` used to crash: the slot ran at setup, before it existed. */
  const schema = z.object({ email: z.string() })
</script>

<template>
  <USchemaForm :schema="schema" :initial-values="{ email: 'hello' }">
    <UFormField name="email" label="Email" #="{ model, value, setValue }">
      <UInput v-bind="model" data-testid="email" />
      <span data-testid="len">{{ value.length }}</span>
      <button type="button" data-testid="set" @click="setValue('bye')">set</button>
    </UFormField>
  </USchemaForm>
</template>
