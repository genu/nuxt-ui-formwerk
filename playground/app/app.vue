<script setup lang="ts">
  import { z } from "zod"
  import { useForm } from "@formwerk/core"

  const schema = z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: "You must accept the terms and conditions",
      }),
      newsletter: z.boolean().default(false),
      address: z.object({
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        zipCode: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })

  const { values, ...form } = useForm({ id: "My Form", schema })

  const submittedData = ref<any>(null)
  const isSubmitting = ref(false)

  const onSubmit = form.handleSubmit(async (data: any) => {
    isSubmitting.value = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    submittedData.value = data
    isSubmitting.value = false
    console.log("Form submitted:", data)
  })

  const resetForm = () => {
    form.reset()
    submittedData.value = null
  }
</script>

<template>
  <UApp>
    <UContainer class="py-12">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2">Nuxt UI Formwerk Playground</h1>
          <p class="text-gray-600 dark:text-gray-400">A comprehensive example showcasing formwerk integration with Nuxt UI</p>
        </div>

        <UCard>
          <FormwerkForm #="{ blurredFields, dirtyFields, touchedFields }" class="flex flex-col gap-4">
            <div class="flex space-x-4">
              <FormwerkField name="name" #="{ model }" label="Name" class="flex-1">
                <UInput v-bind="model" class="w-full" />
              </FormwerkField>
              <FormwerkField name="email" label="Email" #="{ model }" class="flex-1">
                <UInput v-bind="model" class="w-full" />
              </FormwerkField>
            </div>

            <FormwerkField label="Accept Terms" name="acceptTerms" #="{ model }">
              <UCheckbox v-bind="model" label="I accept the terms and conditions" />
            </FormwerkField>
            <FormwerkField label="Newsletter Subscription" name="newsletter" #="{ model }">
              <USwitch v-bind="model" label="I accept the terms and conditions" />
            </FormwerkField>

            <FormwerkGroup name="address" class="flex space-x-4">
              <FormwerkField name="street" label="Street" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </FormwerkField>
              <FormwerkField name="city" label="City" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </FormwerkField>
              <FormwerkField name="zipCode" label="Zip Code" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </FormwerkField>
            </FormwerkGroup>

            <USeparator class="my-5" />
            <pre>values: {{ values }}</pre>
            <USeparator />
            <pre>Blurried:{{ blurredFields }}</pre>
            <pre>Dirtied: {{ dirtyFields }}</pre>
            <pre>Touched: {{ touchedFields }}</pre>
            <UButton label="Submit" @click="onSubmit" />
          </FormwerkForm>
        </UCard>
      </div>
    </UContainer>
  </UApp>
</template>
