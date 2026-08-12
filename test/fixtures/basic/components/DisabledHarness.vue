<script lang="ts">
  import { ref } from "vue"
  import type { ConsumableData } from "@formwerk/core"

  export interface Props {
    disabled?: boolean
  }
</script>

<script setup lang="ts">
  /** State is rendered rather than exposed, so assertions read the DOM, not `vm`. */
  const { disabled = false } = defineProps<Props>()

  const submitted = ref<Record<string, unknown> | undefined>()

  const onSubmit = (data: ConsumableData<{ email: string }>) => {
    submitted.value = data.toObject()
  }
</script>

<template>
  <div>
    <USchemalessForm data-testid="form" :disabled="disabled" :initial-values="{ email: 'a@b.c' }" @submit="onSubmit">
      <template #default="{ form }">
        <UFormField name="email" label="Email">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="email-input" />
          </template>
        </UFormField>
        <!-- What formwerk itself believes about the path. -->
        <span data-testid="is-path-disabled">{{ form.context.isPathDisabled("email") }}</span>
      </template>
    </USchemalessForm>
    <!-- The consequence: disabled paths are stripped from the submitted data. -->
    <span data-testid="submitted">{{ submitted === undefined ? "none" : JSON.stringify(submitted) }}</span>
  </div>
</template>
