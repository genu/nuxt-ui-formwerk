<script setup lang="ts">
  import { z } from "zod"

  /**
   * Reads a property off the `value` slot prop, which is what used to crash:
   * `Field.vue` invoked the default slot during setup to guess `controlType`,
   * and could only pass `{ model: {} }` — so `value` was undefined at that call.
   */
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
