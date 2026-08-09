<script setup lang="ts">
  import { useTemplateRef } from "vue"
  import SchemalessForm from "../../src/runtime/components/SchemalessForm.vue"

  // Must be `type`, not `interface`. FormObject is Record<string, unknown> and
  // TypeScript gives interfaces no implicit index signature.
  type Contact = {
    email: string
    age: number
  }

  // Same shape declared as an interface. Pinned as a known limitation below.
  interface InterfaceContact {
    email: string
    age: number
  }

  const typedInitial: Contact = { email: "", age: 0 }
  const interfaceInitial: InterfaceContact = { email: "", age: 0 }
  const getDefaults = () => ({ email: "", age: 0 })
  const fetchDefaults = async (): Promise<Contact> => ({ email: "", age: 0 })

  const formRef = useTemplateRef("form")

  function exposedApi() {
    formRef.value?.values.email?.toUpperCase()
    // @ts-expect-error `nope` was not in initialValues
    void formRef.value?.values.nope
  }

  const save = async (email: string) => email
</script>

<template>
  <div @click="exposedApi">
    <!-- Object literal infers the shape -->
    <SchemalessForm ref="form" :initial-values="{ email: '', age: 0 }" #="{ values, form }">
      {{ values.email?.toUpperCase() }}
      {{ form.isSubmitting }}
      <!-- @vue-expect-error `nope` was not in initialValues -->
      {{ values.nope }}
    </SchemalessForm>

    <!-- A const annotated with a `type` alias infers the shape -->
    <SchemalessForm :initial-values="typedInitial" #="{ values }">
      {{ values.email?.toUpperCase() }}
      <!-- @vue-expect-error `nope` is not on Contact -->
      {{ values.nope }}
    </SchemalessForm>

    <!-- submit hands over the data, carrying the inferred shape -->
    <SchemalessForm :initial-values="typedInitial" #="{ values }" @submit="(data) => save(data.toObject().email)">
      {{ values }}
    </SchemalessForm>

    <!-- A sync getter infers the shape -->
    <SchemalessForm :initial-values="getDefaults" #="{ values }">
      {{ values.email?.toUpperCase() }}
      <!-- @vue-expect-error `nope` was not in initialValues -->
      {{ values.nope }}
    </SchemalessForm>

    <!--
      PINNED LIMITATION: an interface is rejected, because FormObject is
      Record<string, unknown> and interfaces get no implicit index signature.
      If this ever starts working, delete the directive and the README gotcha.
    -->
    <!-- @vue-expect-error interfaces are not assignable to Record<string, unknown> -->
    <SchemalessForm :initial-values="interfaceInitial" #="{ values }">{{ values }}</SchemalessForm>

    <!--
      PINNED LIMITATION: async initialValues. Because the prop is typed
      `TInput | (() => TInput)`, an async getter is rejected outright rather
      than silently inferring an empty type — TInput would have to be
      Promise<Contact>, which is not a FormObject. Use USchemaForm, or UForm
      with your own useForm<T>() call.
    -->
    <!-- @vue-expect-error async initialValues is not supported here -->
    <SchemalessForm :initial-values="fetchDefaults" #="{ values }">{{ values }}</SchemalessForm>
  </div>
</template>
