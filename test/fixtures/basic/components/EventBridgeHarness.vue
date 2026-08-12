<script lang="ts">
  import { z } from "zod"
  import type { ErrorVisibility } from "../../../../src/runtime/types/form"

  export interface Props {
    showErrorsOn?: ErrorVisibility
  }
</script>

<script setup lang="ts">
  /**
   * Harness for the Nuxt UI <-> formwerk event bridge.
   *
   * Nuxt UI inputs emit blur/change/input/focus on their own bus; `Field.vue`
   * translates those into formwerk's setBlurred/setTouched, then re-emits
   * formwerk's state changes on a second bus that the root accumulates into
   * these three sets. None of that is visible in markup, so it is asserted
   * through what the sets and the rendered error message say.
   *
   * `validate-on-input-delay="0"` because Nuxt UI debounces its `input` event
   * by 300ms, which would otherwise have to be waited out on every keystroke.
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
