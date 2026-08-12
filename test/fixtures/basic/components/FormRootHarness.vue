<script lang="ts">
  import { z } from "zod"
  import { ref, watch } from "vue"
  import { useForm } from "@formwerk/core"

  export interface Props {
    disabled?: boolean
  }
</script>

<script setup lang="ts">
  /**
   * Harness for `UFormRoot`, which exists for exactly the case shown here:
   * the form is needed during `setup`, before any template ref would resolve.
   */
  const schema = z.object({ email: z.string().min(3, "email too short") })

  const { disabled = false } = defineProps<Props>()

  const form = useForm({ schema, initialValues: { email: "" }, disabled: () => disabled })
  const submitted = ref<string>("none")

  const watched = ref("none")
  watch(
    () => form.values.email,
    (value) => (watched.value = value ?? ""),
  )
</script>

<template>
  <div>
    <UFormRoot :form="form" data-testid="form" @submit="(data) => (submitted = JSON.stringify(data.toObject()))">
      <UFormField name="email" label="Email">
        <template #default="{ model }">
          <UInput v-bind="model" data-testid="email" />
        </template>
      </UFormField>
    </UFormRoot>
    <span data-testid="watched">{{ watched }}</span>
    <span data-testid="submitted">{{ submitted }}</span>
  </div>
</template>
