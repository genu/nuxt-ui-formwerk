<script setup lang="ts">
import { z } from "zod";
import { useForm } from "@formwerk/core";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      zipCode: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const form = useForm({ schema });

const submittedData = ref<any>(null);
const isSubmitting = ref(false);

const onSubmit = form.handleSubmit(async (data: any) => {
  isSubmitting.value = true;
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  submittedData.value = data;
  isSubmitting.value = false;
  console.log("Form submitted:", data);
});

const resetForm = () => {
  form.reset();
  submittedData.value = null;
};
</script>

<template>
  <UApp>
    <UContainer class="py-12">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2">Nuxt UI Formwerk Playground</h1>
          <p class="text-gray-600 dark:text-gray-400">
            A comprehensive example showcasing formwerk integration with Nuxt UI
          </p>
        </div>

        <UCard>
          <FormwerkForm
            validate-on="blur"
            #="{ blurredFields, touchedFields, dirtyFields }"
          >
            <div class="space-y-6">
              <!-- Form Stats -->
              <div
                class="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Touched
                  </div>
                  <div class="text-2xl font-bold">{{ touchedFields.size }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Blurred
                  </div>
                  <div class="text-2xl font-bold">{{ blurredFields.size }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Dirty
                  </div>
                  <div class="text-2xl font-bold">{{ dirtyFields.size }}</div>
                </div>
              </div>

              <!-- Basic Fields -->
              <div class="space-y-4">
                <h2 class="text-xl font-semibold">Basic Information</h2>

                <FormwerkField name="name" label="Name" required #="{ model }">
                  <UInput v-bind="model" placeholder="John Doe" />
                </FormwerkField>

                <FormwerkField
                  name="email"
                  label="Email"
                  required
                  #="{ model }"
                >
                  <UInput
                    v-bind="model"
                    type="email"
                    placeholder="john@example.com"
                  />
                </FormwerkField>

                <FormwerkField
                  name="password"
                  label="Password"
                  required
                  #="{ model }"
                >
                  <UInput
                    v-bind="model"
                    type="password"
                    placeholder="Enter your password"
                  />
                </FormwerkField>

                <FormwerkField
                  name="confirmPassword"
                  label="Confirm Password"
                  required
                  #="{ model }"
                >
                  <UInput
                    v-bind="model"
                    type="password"
                    placeholder="Confirm your password"
                  />
                </FormwerkField>
              </div>

              <!-- Grouped Fields -->
              <div class="space-y-4">
                <h2 class="text-xl font-semibold">Address</h2>

                <FormwerkGroup name="address">
                  <div class="space-y-4">
                    <FormwerkField
                      name="street"
                      label="Street"
                      required
                      #="{ model }"
                    >
                      <UInput v-bind="model" placeholder="123 Main St" />
                    </FormwerkField>

                    <div class="grid grid-cols-2 gap-4">
                      <FormwerkField
                        name="city"
                        label="City"
                        required
                        #="{ model }"
                      >
                        <UInput v-bind="model" placeholder="New York" />
                      </FormwerkField>

                      <FormwerkField
                        name="zipCode"
                        label="Zip Code"
                        required
                        #="{ model }"
                      >
                        <UInput v-bind="model" placeholder="12345" />
                      </FormwerkField>
                    </div>
                  </div>
                </FormwerkGroup>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <UButton
                  type="submit"
                  @click="onSubmit"
                  :loading="isSubmitting"
                  :disabled="!form.isValid()"
                >
                  Submit
                </UButton>
                <UButton
                  variant="outline"
                  @click="resetForm"
                  :disabled="isSubmitting"
                >
                  Reset
                </UButton>
              </div>

              <!-- Debug Info -->
              <UCard v-if="import.meta.dev" class="mt-6">
                <template #header>
                  <h3 class="font-semibold">Debug Info</h3>
                </template>
                <div class="space-y-2 text-sm">
                  <div>
                    <span class="font-medium">Form Valid:</span>
                    {{ form.isValid() }}
                  </div>
                  <div>
                    <span class="font-medium">Touched Fields:</span>
                    {{ Array.from(touchedFields).join(", ") || "None" }}
                  </div>
                  <div>
                    <span class="font-medium">Blurred Fields:</span>
                    {{ Array.from(blurredFields).join(", ") || "None" }}
                  </div>
                  <div>
                    <span class="font-medium">Dirty Fields:</span>
                    {{ Array.from(dirtyFields).join(", ") || "None" }}
                  </div>
                  <div>
                    <span class="font-medium">Form Values:</span>
                    <pre
                      class="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto"
                      >{{ JSON.stringify(form.values, null, 2) }}</pre
                    >
                  </div>
                </div>
              </UCard>
            </div>
          </FormwerkForm>
        </UCard>

        <!-- Submission Result -->
        <UCard v-if="submittedData" class="mt-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-green-500" />
              <h3 class="font-semibold">Form Submitted Successfully!</h3>
            </div>
          </template>
          <pre class="text-sm overflow-x-auto">{{
            JSON.stringify(submittedData, null, 2)
          }}</pre>
        </UCard>
      </div>
    </UContainer>
  </UApp>
</template>
