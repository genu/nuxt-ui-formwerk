# USchemaForm / USchemalessForm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two form components that call `useForm()` themselves, so one Vue component can host multiple independent formwerk forms.

**Architecture:** `useForm()` provides on the calling component instance, so two calls in one `<script setup>` clobber each other. Moving the call inside a component gives each instance its own provides scope. The five root behaviours currently inlined in `Form.vue` (two event buses, four provides, three reactive Sets, the bus listener) are extracted into a `useFormRoot` composable that all three roots share. `Field.vue`, `Group.vue` and `Repeater.vue` are untouched — they locate the form by injection.

**Tech Stack:** Nuxt module (`@nuxt/kit`), Vue 3.5 SFCs with `generic` attribute, `@formwerk/core` 0.14.4, `@nuxt/ui` 4.x, `@vueuse/core`, Vitest + `@nuxt/test-utils` for SSR, `vue-tsc` for type tests.

**Spec:** `docs/superpowers/specs/2026-08-08-schema-form-components-design.md`

## Global Constraints

- Component names are prefix-derived: `${prefix}SchemaForm` / `${prefix}SchemalessForm`, prefix from Nuxt UI config, default `U`.
- `as` prop defaults to `"form"`. `validateOn` defaults to `"blur"`. `disabled` defaults to `false`.
- Do **not** expose `scrollToInvalidFieldOnSubmit` — it provably no-ops (spec limitation 4).
- Expose every other `_FormProps` option. These components own the `useForm()` call, so props are the entire API and omissions are unreachable.
- Never import `@standard-schema/spec` or `type-fest` directly — neither is a declared dependency. Derive types from `@formwerk/core`'s own exports (`StandardSchema`, `FormReturns`, `MaybeGetter`, `MaybeAsync`).
- Pin exact versions in `package.json` (no `^`/`~`).
- Conventional Commits. Never add `Co-Authored-By` lines.
- Run `pnpm install` first — this workspace has no `node_modules`.
- Formatting is Prettier (`pnpm format`), linting is ESLint (`pnpm lint`). Run both before each commit.
- Do **not** hand-edit the version or CHANGELOG. Releases are automated by release-please from commit types; the `feat:` commits in Tasks 2, 3 and 5 produce the additive minor bump the spec calls for.

## Verified Facts (do not re-derive)

These were established experimentally against Vue 3.5.26 / vue-tsc 3.2.2. Trust them:

- `ReturnType<typeof useForm<TSchema>>` resolves to the **first** overload and fails. Use `FormReturns<TInput, TOutput>` with types inferred from `StandardSchema` instead.
- `FormApi["values"]` gives `PartialDeep<TInput>` without importing `type-fest`.
- The `useForm(...)` call inside a generic SFC cannot be proven to satisfy its own overload constraints; cast the argument `as never` and the result `as unknown as FormApi`. The public surface stays fully typed.
- A generic-instantiated imported interface (`FormRootProps<TInput>`) **does** resolve into correct runtime props.
- `@vue-expect-error` works in templates both ways: it suppresses a real error, and reports `TS2578: Unused '@ts-expect-error' directive` over valid code.
- Plain `useTemplateRef` preserves full generic typing. `ComponentExposed` from `vue-component-type-helpers` does **not** — never use it here.

---

## File Structure

| File                                                                | Responsibility                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/runtime/composables/useFormRoot.ts`                            | **Create.** Buses, provides, the three reactive Sets. Shared by all three roots.  |
| `src/runtime/types/form.ts`                                         | **Modify.** Add `SchemaInput`/`SchemaOutput` helpers and `FormRootProps<TInput>`. |
| `src/runtime/components/Form.vue`                                   | **Modify.** Delegate to `useFormRoot`. No behaviour change.                       |
| `src/runtime/components/SchemaForm.vue`                             | **Create.** Generic over `TSchema`.                                               |
| `src/runtime/components/SchemalessForm.vue`                         | **Create.** Generic over `TInput`.                                                |
| `src/runtime/types/index.ts`                                        | **Modify.** Export the two new components.                                        |
| `src/module.ts`                                                     | **Modify.** Two `addComponent` calls.                                             |
| `test/types/tsconfig.json`                                          | **Create.** Self-contained config for type tests.                                 |
| `test/types/schema-form.vue`                                        | **Create.** Type assertions for `USchemaForm`.                                    |
| `test/types/schemaless-form.vue`                                    | **Create.** Type assertions for `USchemalessForm`.                                |
| `tsconfig.json`                                                     | **Modify.** Exclude `test/types` from the root run.                               |
| `package.json`                                                      | **Modify.** Add pinned `zod` devDep; extend `test:types`.                         |
| `test/fixtures/basic/app.vue`, `test/basic.test.ts`                 | **Modify.** SSR coverage.                                                         |
| `test/fixtures/custom-prefix/app.vue`, `test/custom-prefix.test.ts` | **Modify.** Prefix coverage.                                                      |
| `playground/app/app.vue`                                            | **Modify.** Multi-form demo — the only verification of the core feature.          |
| `README.md`                                                         | **Modify.** Docs + the four gotchas.                                              |

---

### Task 1: Extract `useFormRoot` and refactor `Form.vue`

Pure refactor. `Form.vue` must behave identically; the existing SSR suite is the proof.

**Files:**

- Create: `src/runtime/composables/useFormRoot.ts`
- Modify: `src/runtime/components/Form.vue`

**Interfaces:**

- Consumes: nothing.
- Produces: `useFormRoot(form: FormReturns<any, any>, options: UseFormRootOptions): { blurredFields: Set<string>; touchedFields: Set<string>; dirtyFields: Set<string> }` where `UseFormRootOptions = { validateOn: MaybeRefOrGetter<FormwerkInputEvents>; disabled: MaybeRefOrGetter<boolean> }`. Tasks 2 and 3 both call this.

- [ ] **Step 1: Install dependencies**

Run: `pnpm install`
Expected: completes without error.

- [ ] **Step 2: Run the existing suite to establish a green baseline**

Run: `pnpm test`
Expected: PASS. If it does not pass before you change anything, stop and report — you cannot use it as a refactor guard otherwise.

- [ ] **Step 3: Create the composable**

Create `src/runtime/composables/useFormRoot.ts`:

```ts
import { computed, provide, reactive, toValue, type MaybeRefOrGetter } from "vue"
import { useEventBus } from "@vueuse/core"
import type { FormReturns } from "@formwerk/core"
import { formBusInjectionKey, formOptionsInjectionKey } from "@nuxt/ui/composables/useFormField"
import { formwerkOptionsInjectionKey, formwerkBusInjectionKey, type FormwerkInputEvent, type FormwerkInputEvents } from "../types/form"

export interface UseFormRootOptions {
  validateOn: MaybeRefOrGetter<FormwerkInputEvents>
  disabled: MaybeRefOrGetter<boolean>
}

export interface FormRootState {
  blurredFields: Set<string>
  touchedFields: Set<string>
  dirtyFields: Set<string>
}

/**
 * Wires a formwerk form into Nuxt UI's form system.
 *
 * Creates the two event buses, provides the four injection keys that Field,
 * Group and Repeater rely on, and tracks per-field interaction state.
 *
 * Callers own the `useForm()` / `useFormContext()` call and pass the result in,
 * which is what lets a single component host several independent forms.
 */
export function useFormRoot(form: FormReturns<any, any>, options: UseFormRootOptions): FormRootState {
  const { context, isSubmitAttempted } = form

  const formwerkBus = useEventBus<FormwerkInputEvents, FormwerkInputEvent>(`formwerk-form-${context.id}`)
  const nuxtUiFormBus = useEventBus<any>(`form-${context.id}`)

  const dirtyFields: Set<string> = reactive(new Set<string>())
  const touchedFields: Set<string> = reactive(new Set<string>())
  const blurredFields: Set<string> = reactive(new Set<string>())

  provide(formwerkBusInjectionKey, formwerkBus)
  provide(formBusInjectionKey, nuxtUiFormBus)
  provide(
    formwerkOptionsInjectionKey,
    computed(() => ({
      validateOn: toValue(options.validateOn),
      isSubmitAttempted: isSubmitAttempted.value,
    })),
  )
  provide(
    formOptionsInjectionKey,
    computed(() => ({
      disabled: toValue(options.disabled),
    })),
  )

  const toggleState = (set: Set<string>, payload?: FormwerkInputEvent) => {
    if (!payload) return

    const { name, payload: isSet } = payload

    if (isSet) {
      set.add(name)
    } else {
      set.delete(name)
    }
  }

  formwerkBus.on(async (event, payload) => {
    switch (event) {
      case "touched":
        toggleState(touchedFields, payload)
        break
      case "blur":
        toggleState(blurredFields, payload)
        break
      case "dirty":
        toggleState(dirtyFields, payload)
        break
    }
  })

  return { blurredFields, touchedFields, dirtyFields }
}
```

- [ ] **Step 4: Rewrite `Form.vue` to delegate**

Replace the entire contents of `src/runtime/components/Form.vue`:

```vue
<script lang="ts">
  import { useFormContext } from "@formwerk/core"
  import { useFormRoot } from "../composables/useFormRoot"
  import type { FormwerkInputEvents } from "../types/form"

  export interface Props {
    validateOn?: FormwerkInputEvents
    disabled?: boolean
  }
</script>

<script lang="ts" setup>
  export interface FormSlots {
    default(props: { blurredFields: ReadonlySet<any>; touchedFields: ReadonlySet<any>; dirtyFields: ReadonlySet<any> }): any
  }

  const formContext = useFormContext()

  if (!formContext) {
    throw new Error("FormwerkForm must be used within a component that has called useForm()")
  }

  const { validateOn = "blur", disabled = false } = defineProps<Props>()

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(formContext, {
    validateOn: () => validateOn,
    disabled: () => disabled,
  })
</script>

<template>
  <div>
    <slot :blurred-fields="blurredFields" :touched-fields="touchedFields" :dirty-fields="dirtyFields" />
  </div>
</template>
```

- [ ] **Step 5: Verify nothing changed**

Run: `pnpm lint && pnpm test && pnpm test:types`
Expected: all PASS, same results as Step 2. This is a refactor — any test that flips is a real regression.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add src/runtime/composables/useFormRoot.ts src/runtime/components/Form.vue
git commit -m "refactor(form): extract form root wiring into useFormRoot"
```

---

### Task 2: `USchemaForm`

**Files:**

- Modify: `src/runtime/types/form.ts`
- Create: `src/runtime/components/SchemaForm.vue`
- Modify: `src/runtime/types/index.ts`, `src/module.ts`, `package.json`, `tsconfig.json`
- Test: `test/types/tsconfig.json`, `test/types/schema-form.vue`

**Interfaces:**

- Consumes: `useFormRoot` from Task 1.
- Produces: `SchemaInput<TSchema>`, `SchemaOutput<TSchema>`, `FormRootProps<TInput>` from `src/runtime/types/form.ts` — Task 3 imports all three. `test/types/tsconfig.json` — Task 3 adds a file alongside it.

- [ ] **Step 1: Add pinned `zod` devDependency and extend the type-check script**

In `package.json`, add to `devDependencies` (keep alphabetical order):

```json
"zod": "4.4.3"
```

Change the `test:types` script to:

```json
"test:types": "vue-tsc --noEmit && vue-tsc --noEmit -p test/types/tsconfig.json && cd playground && vue-tsc --noEmit"
```

Then run: `pnpm install`

- [ ] **Step 2: Exclude `test/types` from the root type-check**

The type tests need their own compiler settings, so the root run must not also check them. In `tsconfig.json`:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "exclude": ["dist", "node_modules", "playground", "test/types"]
}
```

- [ ] **Step 3: Create the type-test config**

Create `test/types/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "skipLibCheck": true,
    "types": []
  },
  "include": ["**/*.ts", "**/*.vue"]
}
```

- [ ] **Step 4: Write the failing type test**

Create `test/types/schema-form.vue`. Every `@vue-expect-error` is a two-way assertion: it fails if the error disappears _and_ if it was never there.

```vue
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
```

- [ ] **Step 5: Run it to verify it fails**

Run: `pnpm exec vue-tsc --noEmit -p test/types/tsconfig.json`
Expected: FAIL — cannot find module `SchemaForm.vue`.

- [ ] **Step 6: Add the shared types**

Append to `src/runtime/types/form.ts`. The file already has `import type { InjectionKey, ComputedRef } from "vue"` at the top — merge `Component` into that existing import rather than adding a second one, or ESLint will flag the duplicate:

```ts
// merged into the existing vue import at the top of the file:
//   import type { InjectionKey, ComputedRef, Component } from "vue"
import type { StandardSchema, FormObject, TouchedSchema, DirtySchema } from "@formwerk/core"

/**
 * The input type a Standard Schema validates.
 *
 * Derived from formwerk's own `StandardSchema` export so this package does not
 * take a direct dependency on `@standard-schema/spec`.
 */
export type SchemaInput<TSchema> =
  TSchema extends StandardSchema<infer TInput, unknown> ? (TInput extends FormObject ? TInput : FormObject) : FormObject

/** The output type a Standard Schema produces after validation. */
export type SchemaOutput<TSchema> =
  TSchema extends StandardSchema<never, infer TOutput> ? (TOutput extends FormObject ? TOutput : FormObject) : FormObject

/**
 * Props common to every self-contained form root.
 *
 * This is formwerk's `_FormProps` minus `scrollToInvalidFieldOnSubmit` (which
 * cannot work — see the design spec), plus `as` and `validateOn`.
 */
export interface FormRootProps<TInput extends FormObject> {
  /** Element or component to render as. Set to a non-form element to avoid invalid nested `<form>` markup. */
  as?: string | Component
  /** Form identifier. Auto-generated when omitted. */
  id?: string
  /** When field errors become visible. */
  validateOn?: FormwerkInputEvents
  /** Disables every field, and strips disabled paths out of the submitted data. */
  disabled?: boolean
  /** Turns off native HTML5 validation for this form. */
  disableHtmlValidation?: boolean
  /** Marks fields as touched on mount. */
  initialTouched?: TouchedSchema<TInput>
  /** Marks fields as dirty on mount. */
  initialDirty?: DirtySchema<TInput>
}
```

- [ ] **Step 7: Create the component**

Create `src/runtime/components/SchemaForm.vue`:

```vue
<script lang="ts">
  import {
    useForm,
    type ConsumableData,
    type FormReturns,
    type GenericFormSchema,
    type IssueCollection,
    type MaybeAsync,
    type MaybeGetter,
  } from "@formwerk/core"
  import { useFormRoot } from "../composables/useFormRoot"
  import type { FormRootProps, SchemaInput, SchemaOutput } from "../types/form"
</script>

<script lang="ts" setup generic="TSchema extends GenericFormSchema">
  type TInput = SchemaInput<TSchema>
  type TOutput = SchemaOutput<TSchema>
  type FormApi = FormReturns<TInput, TOutput>
  /** `PartialDeep<TInput>`, without importing type-fest. */
  type Values = FormApi["values"]

  const props = withDefaults(
    defineProps<
      FormRootProps<TInput> & {
        /** Standard Schema (zod, valibot, …). Drives all type inference. Read once at setup — use `:key` to swap it. */
        schema: TSchema
        initialValues?: MaybeGetter<MaybeAsync<Values>>
      }
    >(),
    { as: "form", validateOn: "blur", disabled: false },
  )

  const emit = defineEmits<{
    submit: [data: ConsumableData<TOutput>]
    error: [issues: IssueCollection[]]
  }>()

  defineSlots<{
    default(props: {
      form: FormApi
      values: Values
      blurredFields: ReadonlySet<string>
      touchedFields: ReadonlySet<string>
      dirtyFields: ReadonlySet<string>
    }): unknown
  }>()

  // The generic Values type cannot be proven to satisfy useForm's own overload
  // constraints from inside the component, so the argument is cast here. The
  // public surface — props, slots, emits, expose — stays fully typed.
  const form = useForm({
    id: props.id,
    schema: props.schema,
    initialValues: props.initialValues,
    initialTouched: props.initialTouched,
    initialDirty: props.initialDirty,
    disableHtmlValidation: props.disableHtmlValidation,
    disabled: () => props.disabled,
  } as never) as unknown as FormApi

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    validateOn: () => props.validateOn,
    disabled: () => props.disabled,
  })

  // handleSubmit only runs its callback on success and offers no failure hook,
  // so `error` is derived afterwards. It also calls preventDefault itself.
  const onSubmit = async (event?: Event) => {
    await form.handleSubmit((data) => {
      emit("submit", data)
    })(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  defineExpose({ ...form, blurredFields, touchedFields, dirtyFields })
</script>

<template>
  <component :is="as" :id="form.formProps.id" @submit="onSubmit">
    <slot
      :form="form"
      :values="form.values"
      :blurred-fields="blurredFields"
      :touched-fields="touchedFields"
      :dirty-fields="dirtyFields" />
  </component>
</template>
```

- [ ] **Step 8: Register the component**

In `src/module.ts`, after the existing `${prefix}FormRepeater` registration:

```ts
addComponent({
  name: `${prefix}SchemaForm`,
  filePath: resolver.resolve("./runtime/components/SchemaForm.vue"),
})
```

In `src/runtime/types/index.ts`, add:

```ts
export * from "../components/SchemaForm.vue"
```

- [ ] **Step 9: Run the type test to verify it passes**

Run: `pnpm exec vue-tsc --noEmit -p test/types/tsconfig.json`
Expected: PASS, no output. Any `TS2578: Unused '@ts-expect-error' directive` means an assertion stopped being true — investigate, do not delete the directive.

- [ ] **Step 10: Verify nothing else broke**

Run: `pnpm lint && pnpm test && pnpm test:types`
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
pnpm format
git add package.json pnpm-lock.yaml tsconfig.json src/module.ts src/runtime/types/ src/runtime/components/SchemaForm.vue test/types/
git commit -m "feat(form): add USchemaForm with a self-contained form instance"
```

---

### Task 3: `USchemalessForm`

**Files:**

- Create: `src/runtime/components/SchemalessForm.vue`
- Modify: `src/runtime/types/index.ts`, `src/module.ts`
- Test: `test/types/schemaless-form.vue`

**Interfaces:**

- Consumes: `useFormRoot` (Task 1); `FormRootProps` (Task 2); `test/types/tsconfig.json` (Task 2).
- Produces: nothing later tasks depend on by name.

- [ ] **Step 1: Write the failing type test**

Create `test/types/schemaless-form.vue`:

```vue
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
    formRef.value?.values.nope
  }
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vue-tsc --noEmit -p test/types/tsconfig.json`
Expected: FAIL — cannot find module `SchemalessForm.vue`.

- [ ] **Step 3: Create the component**

Create `src/runtime/components/SchemalessForm.vue`. Note `initialValues` is the **only** inference site for `TInput`, which is why it is a plain object or sync getter — formwerk's `MaybeGetter<MaybeAsync<PartialDeep<T>>>` cannot be inferred through.

```vue
<script lang="ts">
  import { useForm, type ConsumableData, type FormObject, type FormReturns, type IssueCollection } from "@formwerk/core"
  import { useFormRoot } from "../composables/useFormRoot"
  import type { FormRootProps } from "../types/form"
</script>

<script lang="ts" setup generic="TInput extends FormObject">
  type FormApi = FormReturns<TInput>
  /** `PartialDeep<TInput>`, without importing type-fest. */
  type Values = FormApi["values"]

  const props = withDefaults(
    defineProps<
      FormRootProps<TInput> & {
        /**
         * Initial values. This is the only place the form's shape can be
         * inferred from, so it must be a plain object or a sync getter — an
         * async getter yields an empty type. Declare the shape with `type`,
         * not `interface`. For async initial values use USchemaForm, or
         * UForm with your own useForm<T>() call.
         */
        initialValues?: TInput | (() => TInput)
      }
    >(),
    { as: "form", validateOn: "blur", disabled: false },
  )

  const emit = defineEmits<{
    submit: [data: ConsumableData<TInput>]
    error: [issues: IssueCollection[]]
  }>()

  defineSlots<{
    default(props: {
      form: FormApi
      values: Values
      blurredFields: ReadonlySet<string>
      touchedFields: ReadonlySet<string>
      dirtyFields: ReadonlySet<string>
    }): unknown
  }>()

  // See SchemaForm.vue — the generic cannot satisfy useForm's overload
  // constraints from inside the component. The public surface stays typed.
  const form = useForm({
    id: props.id,
    initialValues: props.initialValues,
    initialTouched: props.initialTouched,
    initialDirty: props.initialDirty,
    disableHtmlValidation: props.disableHtmlValidation,
    disabled: () => props.disabled,
  } as never) as unknown as FormApi

  const { blurredFields, touchedFields, dirtyFields } = useFormRoot(form, {
    validateOn: () => props.validateOn,
    disabled: () => props.disabled,
  })

  const onSubmit = async (event?: Event) => {
    await form.handleSubmit((data) => {
      emit("submit", data)
    })(event)

    const issues = form.getSubmitErrors()

    if (issues.length) emit("error", issues)
  }

  defineExpose({ ...form, blurredFields, touchedFields, dirtyFields })
</script>

<template>
  <component :is="as" :id="form.formProps.id" @submit="onSubmit">
    <slot
      :form="form"
      :values="form.values"
      :blurred-fields="blurredFields"
      :touched-fields="touchedFields"
      :dirty-fields="dirtyFields" />
  </component>
</template>
```

- [ ] **Step 4: Register the component**

In `src/module.ts`, after the `${prefix}SchemaForm` registration:

```ts
addComponent({
  name: `${prefix}SchemalessForm`,
  filePath: resolver.resolve("./runtime/components/SchemalessForm.vue"),
})
```

In `src/runtime/types/index.ts`, add:

```ts
export * from "../components/SchemalessForm.vue"
```

- [ ] **Step 5: Run the type test to verify it passes**

Run: `pnpm exec vue-tsc --noEmit -p test/types/tsconfig.json`
Expected: PASS, no output.

- [ ] **Step 6: Verify nothing else broke**

Run: `pnpm lint && pnpm test && pnpm test:types`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add src/module.ts src/runtime/types/index.ts src/runtime/components/SchemalessForm.vue test/types/schemaless-form.vue
git commit -m "feat(form): add USchemalessForm for schema-free forms"
```

---

### Task 4: SSR coverage

Confirms both components register under the default and custom prefixes, and that they render a real `<form>`.

**Files:**

- Modify: `test/fixtures/basic/app.vue`, `test/basic.test.ts`
- Modify: `test/fixtures/custom-prefix/app.vue`, `test/custom-prefix.test.ts`

**Interfaces:**

- Consumes: `USchemaForm`, `USchemalessForm` (Tasks 2 and 3).
- Produces: nothing.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe("ssr - basic", …)` block in `test/basic.test.ts`:

```ts
// 5. Self-contained form roots
it("renders USchemaForm as a real form element", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="schema-form"')
  expect(html).toMatch(/<form[^>]*data-testid="schema-form"/)
})

it("gives USchemaForm an id so formwerk can address it", async () => {
  const html = await $fetch("/")
  expect(html).toMatch(/<form[^>]*data-testid="schema-form"[^>]*id="[^"]+"/)
})

it("renders USchemalessForm", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="schemaless-form"')
})

it("renders fields inside USchemaForm", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="schema-email-input"')
  expect(html).toContain("Schema Email")
})

it("honours the as prop to avoid nested form elements", async () => {
  const html = await $fetch("/")
  expect(html).toMatch(/<div[^>]*data-testid="as-div-form"/)
})

it("renders two independent forms in one component", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="multi-form-a"')
  expect(html).toContain('data-testid="multi-form-b"')
})
```

Append inside the `describe("ssr - custom prefix", …)` block in `test/custom-prefix.test.ts`:

```ts
it("registers NSchemaForm under the custom prefix", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="schema-form"')
})

it("registers NSchemalessForm under the custom prefix", async () => {
  const html = await $fetch("/")
  expect(html).toContain('data-testid="schemaless-form"')
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm test`
Expected: FAIL — the new `data-testid` values are absent.

- [ ] **Step 3: Extend the basic fixture**

In `test/fixtures/basic/app.vue`, add `import { z } from "zod"` to the `<script setup>` block and a schema:

```js
const schema = z.object({
  email: z.string(),
})
```

Then add this markup inside the root `<div>`, after the existing `NuxtUiFormField` block:

```vue
<!-- Test: USchemaForm owns its own useForm() call -->
<USchemaForm data-testid="schema-form" :schema="schema">
      <template #default="{ values }">
        <UFormField name="email" label="Schema Email">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="schema-email-input" />
          </template>
        </UFormField>
        <span data-testid="schema-values">{{ values }}</span>
      </template>
    </USchemaForm>

<!-- Test: USchemalessForm needs no schema -->
<USchemalessForm data-testid="schemaless-form" :initial-values="{ nickname: '' }">
      <template #default>
        <UFormField name="nickname" label="Nickname">
          <template #default="{ model }">
            <UInput v-bind="model" data-testid="nickname-input" />
          </template>
        </UFormField>
      </template>
    </USchemalessForm>

<!-- Test: as prop escapes the nested-form restriction -->
<USchemaForm data-testid="as-div-form" as="div" :schema="schema">
      <template #default>
        <span>as-div</span>
      </template>
    </USchemaForm>

<!-- Test: two forms in one component, which UForm cannot do -->
<USchemaForm data-testid="multi-form-a" :schema="schema">
      <template #default>
        <span>a</span>
      </template>
    </USchemaForm>
<USchemaForm data-testid="multi-form-b" :schema="schema">
      <template #default>
        <span>b</span>
      </template>
    </USchemaForm>
```

- [ ] **Step 4: Extend the custom-prefix fixture**

In `test/fixtures/custom-prefix/app.vue`, add this markup after the closing `</NuxtUiFormField>` on line 19, still inside the root `<div>` (note the `N` prefix, and that this fixture uses `NInput` not `UInput`):

```vue
<!-- Test: new roots also pick up the custom prefix -->
<NSchemaForm data-testid="schema-form" :schema="schema">
      <template #default>
        <NFormField name="email" label="Email">
          <template #default="{ model }">
            <NInput v-bind="model" data-testid="schema-email-input" />
          </template>
        </NFormField>
      </template>
    </NSchemaForm>

<NSchemalessForm data-testid="schemaless-form" :initial-values="{ nickname: '' }">
      <template #default>
        <span>schemaless</span>
      </template>
    </NSchemalessForm>
```

Replace its `<script setup>` block (lines 23-30) with:

```js
import { useForm } from "@formwerk/core"
import { z } from "zod"

const { handleSubmit } = useForm()
const onSubmit = handleSubmit(() => {
  // Handle form submit
})

const schema = z.object({
  email: z.string(),
})
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS, including every pre-existing test.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add test/
git commit -m "test(form): cover schema and schemaless form roots in SSR"
```

---

### Task 5: Playground multi-form demo

Layer 3 DOM tests were deliberately skipped, so this page is the **only** verification that independent forms actually work. It must exercise independent values, submits, and validation state — not just render twice.

**Files:**

- Modify: `playground/app/app.vue`

**Interfaces:**

- Consumes: `USchemaForm` (Task 2).
- Produces: nothing.

- [ ] **Step 1: Add the demo**

In `playground/app/app.vue`, add two schemas to `<script setup>`:

```ts
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const feedbackSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

const lastSubmit = ref<string | null>(null)
```

Then add a second `<UCard>` after the existing one, inside `<UContainer>`:

```vue
<UCard class="mt-8">
          <h2 class="text-xl font-bold mb-1">Two independent forms, one component</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Both forms live in this single component. Neither calls useForm() in script setup. Type in one and the
            other's values, errors and dirty state must stay untouched.
          </p>

          <div class="grid md:grid-cols-2 gap-6">
            <USchemaForm
              :schema="loginSchema"
              class="flex flex-col gap-3"
              #="{ values, form, dirtyFields }"
              @submit="lastSubmit = `login: ${JSON.stringify($event.toJSON())}`"
            >
              <h3 class="font-medium">Login</h3>
              <UFormField name="email" label="Email" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="password" label="Password" #="{ model }">
                <UInput v-bind="model" type="password" class="w-full" />
              </UFormField>
              <UButton type="submit" label="Submit login" :loading="form.isSubmitting.value" />
              <pre class="text-xs">values: {{ values }}</pre>
              <pre class="text-xs">dirty: {{ dirtyFields }}</pre>
            </USchemaForm>

            <USchemaForm
              :schema="feedbackSchema"
              class="flex flex-col gap-3"
              #="{ values, form, dirtyFields }"
              @submit="lastSubmit = `feedback: ${JSON.stringify($event.toJSON())}`"
            >
              <h3 class="font-medium">Feedback</h3>
              <UFormField name="subject" label="Subject" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UFormField name="message" label="Message" #="{ model }">
                <UInput v-bind="model" class="w-full" />
              </UFormField>
              <UButton type="submit" label="Submit feedback" :loading="form.isSubmitting.value" />
              <pre class="text-xs">values: {{ values }}</pre>
              <pre class="text-xs">dirty: {{ dirtyFields }}</pre>
            </USchemaForm>
          </div>

          <p v-if="lastSubmit" class="mt-4 text-sm">Last submit — {{ lastSubmit }}</p>
        </UCard>
```

- [ ] **Step 2: Verify by hand — this is the only check on the core feature**

Run: `pnpm dev`

Confirm all of the following in the browser, and report what you observed:

1. Both forms render.
2. Typing in Login's email changes **only** Login's `values` and `dirty` output.
3. Submitting Login with an invalid email shows an error on Login and **no** error on Feedback.
4. Submitting Feedback with valid data updates "Last submit" with the feedback payload only.
5. Pressing Enter inside a field submits that form (proves the real `<form>` element).
6. No hydration warnings in the browser console.

If any of these fail, stop — the feature does not work and no automated test will tell you.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add playground/app/app.vue
git commit -m "feat(playground): demo two independent forms in one component"
```

---

### Task 6: Documentation

**Files:**

- Modify: `README.md`

**Interfaces:**

- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Document the components**

Read `README.md` first and match its existing heading structure. Add a `### USchemaForm` and `### USchemalessForm` section after the existing `### UForm` section, each with Props / Slot Props / Emits subsections mirroring how `UForm` is documented. Add both to the "Components Summary" table and to the `## How It Works` component list.

Lead each section with the reason they exist:

> `UForm` reads a form you created with `useForm()`. `USchemaForm` creates its own. Because `useForm()` provides on the calling component, only one form per component is possible with `UForm` — `USchemaForm` lifts that limit, so you can put several forms in a single component.

Include a working example:

```vue
<script setup lang="ts">
  import { z } from "zod"

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })
</script>

<template>
  <USchemaForm :schema="schema" @submit="onSubmit" #="{ values, form }">
    <UFormField name="email" label="Email" #="{ model }">
      <UInput v-bind="model" />
    </UFormField>
    <UButton type="submit" label="Sign in" :loading="form.isSubmitting.value" />
  </USchemaForm>
</template>
```

- [ ] **Step 2: Document the four gotchas**

Add a `#### Gotchas` subsection. These are not optional — each one was found experimentally and will otherwise be hit cold:

1. **Declare shapes with `type`, not `interface`** (`USchemalessForm`). Formwerk's `FormObject` is `Record<string, unknown>` and TypeScript gives interfaces no implicit index signature, so an `interface` is rejected with a confusing error.
2. **Async initial values need `USchemaForm`.** On `USchemalessForm`, `:initial-values` is the only place the shape can be inferred from, so an object or sync getter works but an async getter is rejected at compile time. Use `USchemaForm` (where the schema supplies the shape, so async is fine), or `UForm` with your own `useForm<T>()`.
3. **`:schema` is read once.** Formwerk closes over it at setup, so swapping it at runtime does nothing — use `:key` to force a remount.
4. **Use `useTemplateRef`, not `ComponentExposed`.** The usual `ComponentExposed<typeof Comp>` advice for generic components degrades the type to `{}` here; a plain `useTemplateRef` keeps it fully typed.

Also note that `as` exists to avoid invalid nested `<form>` markup, and that two forms sharing an explicit `:id` will share event buses.

- [ ] **Step 3: Verify the documented example actually compiles**

Copy the README example into a scratch `.vue` file under `test/types/`, run `pnpm exec vue-tsc --noEmit -p test/types/tsconfig.json`, confirm it passes, then delete the scratch file. Documentation examples that do not compile are worse than none.

- [ ] **Step 4: Final full verification**

Run: `pnpm lint && pnpm format:check && pnpm test && pnpm test:types`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document USchemaForm and USchemalessForm"
```

---

## Deferred / Known Gaps

Recorded so they are not mistaken for oversights:

- **No automated test for multi-form isolation.** DOM testing was explicitly skipped (spec, Testing section). SSR string-matching and type tests cannot observe it. Task 5's manual checklist is the only verification. Revisit when `happy-dom` + `mountSuspended` are stood up for other reasons.
- **`@submit` / `@error` / `disabled`-strips-from-payload have no automated test**, for the same reason.
- **`name` is not typed against the schema.** Pre-existing; out of scope.
- **`scrollToInvalidFieldOnSubmit` is not exposed.** It cannot work — see spec limitation 4. Accessibility itself is fine; Nuxt UI handles it.
