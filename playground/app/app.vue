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
      contacts: z
        .array(
          z.object({
            name: z.string().min(1, "Contact name is required"),
            email: z.string().email("Invalid contact email"),
          }),
        )
        .min(1, "At least one contact is required")
        .max(5, "Maximum 5 contacts allowed"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })

  const { values, ...form } = useForm({ id: "My Form", schema })

  const isSubmitting = ref(false)

  const onSubmit = form.handleSubmit(async (data) => {
    isSubmitting.value = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    isSubmitting.value = false
    console.log("Form submitted:", data.toJSON())
  })

  const resetForm = () => {
    form.reset()
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
          <UForm #="{ blurredFields, dirtyFields, touchedFields }" class="flex flex-col gap-4">
            <div class="flex space-x-4">
              <UFormField name="name" #="{ model }" label="Name" class="flex-1">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="email" label="Email" #="{ model }" class="flex-1">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Accept Terms" name="acceptTerms" #="{ model }">
              <UCheckbox v-bind="model" label="I accept the terms and conditions" />
            </UFormField>
            <UFormField label="Newsletter Subscription" name="newsletter" #="{ model }">
              <USwitch v-bind="model" label="I accept the terms and conditions" />
            </UFormField>

            <UFormGroup name="address" class="flex space-x-4">
              <UFormField name="street" label="Street" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="city" label="City" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="zipCode" label="Zip Code" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
            </UFormGroup>

            <div class="mt-4">
              <h3 class="text-lg font-medium mb-2">Contacts</h3>
              <UFormRepeater
                name="contacts"
                :min="1"
                :max="5"
                :ui="{ root: 'flex flex-col gap-3', item: 'p-4 border rounded-lg' }"
              >
                <template #default="{ index, items, isFirst, isLast, repeater }">
                  <div class="flex gap-4 items-end">
                    <UFormField name="name" label="Name" class="flex-1" #="{ model }">
                      <UInput v-bind="model" placeholder="Contact name" />
                    </UFormField>
                    <UFormField name="email" label="Email" class="flex-1" #="{ model }">
                      <UInput v-bind="model" placeholder="Contact email" />
                    </UFormField>
                    <div class="flex gap-1">
                      <UButton
                        icon="i-lucide-arrow-up"
                        variant="ghost"
                        size="sm"
                        :disabled="isFirst"
                        @click="repeater.move(index, index - 1)" />
                      <UButton
                        icon="i-lucide-arrow-down"
                        variant="ghost"
                        size="sm"
                        :disabled="isLast"
                        @click="repeater.move(index, index + 1)" />
                      <UButton
                        icon="i-lucide-trash"
                        color="error"
                        variant="ghost"
                        size="sm"
                        :disabled="items.length <= 1"
                        @click="repeater.remove(index)" />
                    </div>
                  </div>
                </template>
                <template #trailing="{ items, repeater }">
                  <UButton
                    icon="i-lucide-plus"
                    variant="outline"
                    :disabled="items.length >= 5"
                    @click="repeater.add()"
                  >
                    Add Contact
                  </UButton>
                </template>
              </UFormRepeater>
            </div>
            <USeparator class="my-5" />
            <pre>values: {{ values }}</pre>
            <USeparator />
            <pre>Blurried:{{ blurredFields }}</pre>
            <pre>Dirtied: {{ dirtyFields }}</pre>
            <pre>Touched: {{ touchedFields }}</pre>
            <UButton label="Submit" @click="onSubmit" />
            <UButton label="Reset" variant="ghost" @click="resetForm" />
          </UForm>
        </UCard>
      </div>
    </UContainer>
  </UApp>
</template>
