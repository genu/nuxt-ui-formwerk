<script lang="ts">
  import { ref } from "vue"
  import type { ConsumableData } from "@formwerk/core"

  export interface Props {
    disabled?: boolean
  }
</script>

<script setup lang="ts">
  /**
   * Harness for form-level `disabled`.
   *
   * `USchemalessForm` passes `disabled` straight to `useForm`, which provides
   * formwerk's disabled context for its fields to inherit — so this covers the
   * whole chain without the module wiring anything itself.
   *
   * Both signals are rendered rather than exposed, so assertions read the DOM
   * instead of reaching into `vm`.
   */
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
