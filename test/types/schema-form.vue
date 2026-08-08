<script setup lang="ts">
  import { useTemplateRef } from "vue"
  import { z } from "zod"
  import SchemaForm from "../../src/runtime/components/SchemaForm.vue"

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
    formRef.value?.values.nope
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
