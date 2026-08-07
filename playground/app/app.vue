<script setup lang="ts">
  import { z } from "zod"
  import { useForm, type ConsumableData } from "@formwerk/core"

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

  /**
   * Two independent forms in this same component.
   *
   * Calling useForm() twice here would not work: each call provides on this
   * component instance, so the second overwrites the first and every field in
   * both forms would bind to the last one. UFormWithSchema creates its form in
   * its own instance, so the two stay isolated.
   */
  const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })

  const signupSchema = z.object({
    company: z.string().min(2, "Company must be at least 2 characters"),
    seats: z.coerce.number().min(1, "At least one seat is required"),
  })

  const loginResult = ref<unknown>(null)
  const signupResult = ref<unknown>(null)
  const profileResult = ref<unknown>(null)

  const onLogin = (payload: ConsumableData<z.output<typeof loginSchema>>) => {
    // payload.toObject() is typed as { email: string; password: string }
    loginResult.value = payload.toObject()
  }

  const onSignup = (payload: ConsumableData<z.output<typeof signupSchema>>) => {
    signupResult.value = payload.toObject()
  }

  /** No schema: the initial values object is what gives the form its type. */
  const profileDefaults = { nickname: "", bio: "" }
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

        <UCard class="mt-8">
          <template #header>
            <h2 class="text-xl font-semibold">Two forms, one component</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Both forms live in this single component. Each
              <code>UFormWithSchema</code> calls useForm() in its own instance, so their values, validation and
              dirty/touched state stay completely independent.
            </p>
          </template>

          <div class="grid md:grid-cols-2 gap-8">
            <UFormWithSchema
              :schema="loginSchema"
              #="{ values, submit, isSubmitting, isValid, dirtyFields }"
              class="flex flex-col gap-4"
              @submit="onLogin"
            >
              <h3 class="font-medium">Log in</h3>
              <UFormField name="email" label="Email" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="password" label="Password" #="{ model }">
                <UInput v-bind="model" type="password" class="w-full" />
              </UFormField>
              <pre class="text-xs">{{ values }}</pre>
              <pre class="text-xs">dirty: {{ [...dirtyFields] }}</pre>
              <UButton label="Log in" :loading="isSubmitting" :disabled="!isValid" @click="submit" />
            </UFormWithSchema>

            <UFormWithSchema
              :schema="signupSchema"
              #="{ values, submit, isSubmitting, isValid, dirtyFields }"
              class="flex flex-col gap-4"
              @submit="onSignup"
            >
              <h3 class="font-medium">Sign up</h3>
              <UFormField name="company" label="Company" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="seats" label="Seats" #="{ model }">
                <UInput v-bind="model" type="number" class="w-full" />
              </UFormField>
              <pre class="text-xs">{{ values }}</pre>
              <pre class="text-xs">dirty: {{ [...dirtyFields] }}</pre>
              <UButton label="Sign up" :loading="isSubmitting" :disabled="!isValid" @click="submit" />
            </UFormWithSchema>
          </div>

          <template #footer>
            <pre class="text-xs">login submitted: {{ loginResult }}</pre>
            <pre class="text-xs">signup submitted: {{ signupResult }}</pre>
          </template>
        </UCard>

        <UCard class="mt-8">
          <template #header>
            <h2 class="text-xl font-semibold">No schema</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <code>UFormWithValues</code> takes its type from the initial values object instead of a schema.
            </p>
          </template>

          <UFormWithValues
            :initial-values="profileDefaults"
            #="{ values, submit, reset }"
            class="flex flex-col gap-4"
            @submit="profileResult = $event.toObject()"
          >
            <UFormField name="nickname" label="Nickname" #="{ model }">
              <UInput v-bind="model" class="w-full" />
            </UFormField>
            <UFormField name="bio" label="Bio" #="{ model }">
              <UTextarea v-bind="model" class="w-full" />
            </UFormField>
            <pre class="text-xs">{{ values }}</pre>
            <div class="flex gap-2">
              <UButton label="Save" @click="submit" />
              <UButton label="Reset" variant="ghost" @click="reset" />
            </div>
          </UFormWithValues>

          <template #footer>
            <pre class="text-xs">profile submitted: {{ profileResult }}</pre>
          </template>
        </UCard>
      </div>
    </UContainer>
  </UApp>
</template>
