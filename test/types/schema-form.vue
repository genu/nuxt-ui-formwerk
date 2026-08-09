<script setup lang="ts">
  import { useTemplateRef } from "vue"
  import { z } from "zod"
  import type { ConsumableData } from "@formwerk/core"
  import SchemaForm from "../../src/runtime/components/SchemaForm.vue"
  import type { FormSubmitContext } from "../../src/runtime/types/form"

  const schema = z.object({
    email: z.string(),
    age: z.number(),
  })

  // Plain useTemplateRef must preserve the generic. Never use ComponentExposed here.
  const formRef = useTemplateRef("form")

  function exposedApi() {
    formRef.value?.values.email?.toUpperCase()
    formRef.value?.reset()
    // @ts-expect-error `nope` is not on the schema
    void formRef.value?.values.nope
  }

  const save = async (email: string) => email

  // Pins the two-argument submit signature: schema-typed data, plus the
  // FormSubmitContext that keeps isSubmitting true across async work.
  function onSubmit(data: ConsumableData<z.infer<typeof schema>>, { waitUntil }: FormSubmitContext) {
    waitUntil(save(data.toObject().email))
  }
</script>

<template>
  <div @click="exposedApi">
    <SchemaForm ref="form" :schema="schema" #="{ values, form, blurredFields }">
      {{ values.email?.toUpperCase() }}
      {{ form.isSubmitting }}
      {{ blurredFields.size }}
      {{ form.setValue("email", "a@b.c") }}

      <!-- @vue-expect-error `nope` is not on the schema -->
      {{ values.nope }}
      <!-- @vue-expect-error setValue paths are checked against the schema -->
      {{ form.setValue("nope", 1) }}
    </SchemaForm>

    <!-- Valid partial initialValues are accepted -->
    <SchemaForm :schema="schema" :initial-values="{ email: 'a@b.c' }" #="{ values }">{{ values }}</SchemaForm>

    <!-- A declared handler matches the emitted (data, context) pair -->
    <SchemaForm :schema="schema" #="{ values }" @submit="onSubmit">{{ values }}</SchemaForm>

    <!-- Inline: both arguments infer, and data stays schema-typed -->
    <SchemaForm :schema="schema" #="{ values }" @submit="(data, ctx) => ctx.waitUntil(save(data.toObject().email))">
      {{ values }}
    </SchemaForm>

    <!--
      REGRESSION GUARD for the submit payload's own typing. If `submit` ever
      stops carrying the schema's output type this stops erroring.
    -->
    <!-- @vue-expect-error `nope` is not on the schema output -->
    <SchemaForm :schema="schema" #="{ values }" @submit="(data) => save(data.toObject().nope)">{{ values }}</SchemaForm>

    <!--
      REGRESSION GUARD. This is why USchemaForm and USchemalessForm are two
      components rather than one with an optional schema prop: in a single
      component TS infers the schema and initialValues generics independently
      and never cross-checks them, so this mistake passes silently.
    -->
    <!-- @vue-expect-error `bogus` is not on the schema -->
    <SchemaForm :schema="schema" :initial-values="{ bogus: 1 }" #="{ values }">{{ values }}</SchemaForm>
  </div>
</template>
