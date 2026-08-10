<script setup lang="ts">
  /**
   * Consumer probe for the built package.
   *
   * `nuxt-module-build` exits 0 even when the declaration emitter fails, and
   * `vue-sfc-transformer` then writes zero-byte `.d.ts` files. That build looks
   * green in CI and hands consumers `TS2306: not a module`.
   *
   * This file is what a consumer's own `vue-tsc` run does: import the components
   * from `dist/` and use their generics. A broken declaration fails here for the
   * same reason it fails for them — `vue-tsc` resolves `./X.vue` to the emitted
   * `X.d.vue.ts`, and a zero-byte one is `TS2306: not a module`.
   *
   * Run it with `pnpm verify:dist`, after `pnpm prepack`. It is excluded from the
   * root type check, because `dist/` is absent or stubbed for everything else.
   */
  import { z } from "zod"
  import SchemaForm from "../../dist/runtime/components/SchemaForm.vue"
  import SchemalessForm from "../../dist/runtime/components/SchemalessForm.vue"

  const schema = z.object({
    email: z.string(),
    age: z.number(),
  })

  const save = async (email: string) => email
</script>

<template>
  <div>
    <!-- The schema drives the slot, the exposed form, and the submit payload. -->
    <SchemaForm :schema="schema" #="{ values, form }" @submit="(data) => save(data.toObject().email)">
      {{ values.email?.toUpperCase() }}
      {{ form.isSubmitting }}
      {{ form.setValue("email", "a@b.c") }}

      <!-- Guards against the emitted declaration degrading to `any` -->
      <!-- @vue-expect-error `nope` is not on the schema -->
      {{ values.nope }}
    </SchemaForm>

    <!-- initialValues drives the slot -->
    <SchemalessForm :initial-values="{ email: '', age: 0 }" #="{ values }">
      {{ values.email?.toUpperCase() }}

      <!-- @vue-expect-error `nope` was not in initialValues -->
      {{ values.nope }}
    </SchemalessForm>
  </div>
</template>
