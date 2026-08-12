# Nuxt UI Formwerk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> [!WARNING]
> **Experimental Module**
>
> This module is currently in an experimental phase. APIs may change, and some features may not be fully stable. Use with caution in production environments and please report any issues you encounter.

Enhanced form components for Nuxt UI with [@formwerk/core](https://formwerk.dev/) integration. This module bridges the gap between Formwerk's powerful form validation and state management with Nuxt UI's beautiful form components.

- [Release Notes](/CHANGELOG.md)

## Features

- **Formwerk Integration** - Seamless integration with [@formwerk/core](https://formwerk.dev/) for advanced form validation
- **Familiar Field API** - `UFormField` keeps Nuxt UI's name and props, so templates need no rewriting
- **Field-level Validation** - Granular validation control with error message handling
- **State Tracking** - Track touched, blurred, and dirty states per field
- **Flexible Validation Strategies** - Configure when validation occurs (on blur, on input, etc.)
- **Form Repeater** - Built-in support for dynamic array fields with add/remove/reorder
- **Auto-import** - Components are automatically available in your app
- **TypeScript** - Full type safety out of the box

## Quick Setup

Install the module and its peer dependencies:

```bash
pnpm add nuxt-ui-formwerk @formwerk/core
```

> **Note:** This module requires `@formwerk/core` and `@nuxt/ui` as peer dependencies. Make sure they are installed in your project.

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "nuxt-ui-formwerk"],
})
```

That's it! You can now use enhanced form components in your Nuxt app.

## How It Works

Formwerk forms are **opt-in**: you choose a formwerk root (`USchemaForm` or `USchemalessForm`) where you want one. Nuxt UI's own `UForm` is left alone and keeps working for forms that don't need formwerk.

The one component this module **does** override is `UFormField`. The original stays reachable as `NuxtUiFormField`.

| Component         | Origin        | Purpose                                          |
| ----------------- | ------------- | ------------------------------------------------ |
| `USchemaForm`     | new           | Self-contained root, driven by a Standard Schema |
| `USchemalessForm` | new           | Self-contained root, shape from `initialValues`  |
| `UFormField`      | **overrides** | Field wired to formwerk state and validation     |
| `UFormGroup`      | new           | Nested field grouping                            |
| `UFormRepeater`   | new           | Dynamic array fields                             |
| `UForm`           | untouched     | Nuxt UI's own form — not formwerk-aware          |
| `NuxtUiFormField` | renamed       | Nuxt UI's original field                         |

The module automatically uses the same prefix as your Nuxt UI configuration (default: `U`).

> [!IMPORTANT]
> `UFormField` requires a formwerk root. Inside a plain Nuxt UI `<UForm>` it would hold its value in formwerk while the form read from `state` — submitting nothing — so it throws instead. Use `<NuxtUiFormField>` for plain Nuxt UI fields.

### Event Bus Integration

The module bridges Nuxt UI's form system with formwerk by intercepting and coordinating events between both systems:

1. **Dual Event Buses** - the form root creates two event buses:
   - A Nuxt UI form bus (`form-{id}`) that Nuxt UI input components emit to
   - A formwerk bus (`formwerk-form-{id}`) for internal state tracking

2. **Event Interception** - `UFormField` listens to the Nuxt UI form bus and intercepts events (`blur`, `change`, `input`, `focus`) emitted by Nuxt UI input components. These events are translated into formwerk state updates (`setBlurred`, `setTouched`).

3. **State Propagation** - When formwerk field state changes (touched, blurred, dirty), `UFormField` emits events on the formwerk bus, which the form root listens to for tracking field-level state across the entire form.

This architecture allows Nuxt UI's native input components to work seamlessly with formwerk's validation and state management without requiring any modifications to the input components themselves.

## Usage

### USchemaForm

`USchemaForm` creates and owns its own formwerk form, so you never call `useForm()` yourself. Because `useForm()` provides on the calling component, owning it in script setup would limit you to one form per component — `USchemaForm` lifts that limit, so you can put several forms in a single component.

Use `USchemaForm` when you have a [Standard Schema](https://standardschema.dev/) (zod, valibot, …) to validate against — the schema drives all type inference for `values`, `initialValues`, and the submitted data.

```vue
<script setup lang="ts">
  import { z } from "zod"
  import type { ConsumableData } from "@formwerk/core"

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  function onSubmit(data: ConsumableData<z.infer<typeof schema>>) {
    return $fetch("/api/sign-in", { method: "POST", body: data.toJSON() })
  }
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

#### Props

| Prop                   | Type                              | Default        | Description                                                                                                      |
| ---------------------- | --------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `schema`               | Standard Schema                   | _required_     | Drives all type inference. Read once at setup — see [Gotchas](#gotchas).                                         |
| `initialValues`        | `MaybeGetter<MaybeAsync<Values>>` | -              | Initial values. Object, sync getter, or async getter are all supported.                                          |
| `as`                   | `string \| Component`             | `'form'`       | Native element to render as. Use a non-form element to avoid invalid nested `<form>` markup. See the note below. |
| `id`                   | `string`                          | auto-generated | Form identifier. Two forms sharing an explicit `id` share event buses.                                           |
| `showErrorsOn`         | `'touched' \| 'blur' \| 'dirty'`  | `'blur'`       | When field errors become visible.                                                                                |
| `validateOnInputDelay` | `number`                          | `300`          | Debounce, in ms, that Nuxt UI inputs apply before emitting their `input` event. Matches Nuxt UI's default.       |
| `disabled`             | `boolean`                         | `false`        | Disables every field, and strips disabled paths out of the submitted data.                                       |
| `initialTouched`       | `TouchedSchema<TInput>`           | -              | Marks fields as touched on mount.                                                                                |
| `initialDirty`         | `DirtySchema<TInput>`             | -              | Marks fields as dirty on mount.                                                                                  |

> [!NOTE]
> `showErrorsOn` is deliberately **not** called `validateOn`. Nuxt UI's forms have a `validateOn` prop meaning something different — an array of the DOM events that trigger validation — and reusing the name silently swallowed the array form. Here the value is a single field state, and formwerk owns when validation actually runs.

`as` is meant for native elements: `novalidate` is only applied when `as` is the string `"form"`, because there's no way to tell what a component renders. Pass a component that renders its own `<form>` and setting `novalidate` on it is your responsibility — otherwise native constraint validation swallows the submit event and `@submit`/`@error` never emit.

#### Slot Props

- `form` - The full formwerk form API (`values`, `isSubmitting`, `handleSubmit`, `setValue`, `reset`, …)
- `values` - Current form values (same as `form.values`)
- `blurredFields` - Set of field names that have been blurred
- `touchedFields` - Set of field names that have been touched
- `dirtyFields` - Set of field names with modified values

#### Emits

- `submit` - `(data: ConsumableData<TOutput>)`, emitted after a successful `handleSubmit`. Call `data.toJSON()` to get the plain validated object.
- `error` - `(issues: IssueCollection[])`, emitted when the submit attempt fails validation.

`@submit` is a Vue emit, and Vue discards whatever a listener returns — so `isSubmitting` covers validation only, not your handler's own async work. If you need a loading state that spans an API call, drive the submit with `form.handleSubmit(async …)` from the slot prop or a template ref instead; that's formwerk's own API, and it awaits your callback before clearing `isSubmitting`.

#### Exposed

Via `ref`/`useTemplateRef`: the entire formwerk form API flattened (`values`, `isSubmitting`, `handleSubmit`, `setValue`, `reset`, …), plus `blurredFields`, `touchedFields`, `dirtyFields`.

### USchemalessForm

The schema-free counterpart to `USchemaForm`, for forms that don't validate against a Standard Schema. Like `USchemaForm`, it creates its own form, so it isn't limited to one form per component.

Because there's no schema, `initialValues` is the only place the form's shape can be inferred from.

An inline object literal is enough — no type declaration needed, and `values` is still fully typed:

```vue
<template>
  <USchemalessForm :initial-values="{ email: '', password: '' }" #="{ values, form }">
    <UFormField name="email" label="Email" #="{ model }">
      <UInput v-bind="model" />
    </UFormField>
    <UButton type="submit" label="Sign in" :loading="form.isSubmitting.value" />
  </USchemalessForm>
</template>
```

If you want a reusable named shape, declare it with `type`, not `interface` — an `interface` is rejected, see [Gotchas](#gotchas):

```vue
<script setup lang="ts">
  type Credentials = {
    email: string
    password: string
  }

  const initialValues: Credentials = { email: "", password: "" }
</script>

<template>
  <USchemalessForm :initial-values="initialValues" #="{ values }">{{ values.email }}</USchemalessForm>
</template>
```

#### Props

| Prop                   | Type                             | Default        | Description                                                                                                            |
| ---------------------- | -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `initialValues`        | `TInput \| (() => TInput)`       | -              | Initial values. Only place the shape can be inferred from — object or sync getter, see [Gotchas](#gotchas).            |
| `as`                   | `string \| Component`            | `'form'`       | Native element to render as. Use a non-form element to avoid invalid nested `<form>` markup. See `USchemaForm`'s note. |
| `id`                   | `string`                         | auto-generated | Form identifier. Two forms sharing an explicit `id` share event buses.                                                 |
| `showErrorsOn`         | `'touched' \| 'blur' \| 'dirty'` | `'blur'`       | When field errors become visible. See `USchemaForm`'s note on the name.                                                |
| `validateOnInputDelay` | `number`                         | `300`          | Debounce, in ms, that Nuxt UI inputs apply before emitting their `input` event.                                        |
| `disabled`             | `boolean`                        | `false`        | Disables every field, and strips disabled paths out of the submitted data.                                             |
| `initialTouched`       | `TouchedSchema<TInput>`          | -              | Marks fields as touched on mount.                                                                                      |
| `initialDirty`         | `DirtySchema<TInput>`            | -              | Marks fields as dirty on mount.                                                                                        |

#### Slot Props

- `form` - The full formwerk form API (`values`, `isSubmitting`, `handleSubmit`, `setValue`, `reset`, …)
- `values` - Current form values (same as `form.values`)
- `blurredFields` - Set of field names that have been blurred
- `touchedFields` - Set of field names that have been touched
- `dirtyFields` - Set of field names with modified values

#### Emits

- `submit` - `(data: ConsumableData<TInput>)`, emitted after a successful `handleSubmit`. Call `data.toJSON()` to get the plain validated object.
- `error` - `(issues: IssueCollection[])`, emitted when the submit attempt fails validation.

As with `USchemaForm`, `isSubmitting` covers validation only — Vue discards a listener's return value. For a loading state that spans async submit work, use `form.handleSubmit(async …)` from the slot prop or a template ref.

#### Exposed

Via `ref`/`useTemplateRef`: the entire formwerk form API flattened (`values`, `isSubmitting`, `handleSubmit`, `setValue`, `reset`, …), plus `blurredFields`, `touchedFields`, `dirtyFields`.

#### Gotchas

These were all found experimentally — expect to hit them cold otherwise.

1. **Declare shapes with `type`, not `interface`** (`USchemalessForm`). Formwerk's `FormObject` is `Record<string, unknown>`, and TypeScript gives interfaces no implicit index signature, so an `interface` is rejected with a confusing error. Use a `type` alias instead.
2. **Async initial values need `USchemaForm`.** On `USchemalessForm`, `:initial-values` is the only place the shape can be inferred from, so an object or a _sync_ getter works, but an async getter is rejected at compile time. Use `USchemaForm` instead — the schema supplies the shape, so async is fine there.
3. **`:schema` is read once at setup.** Formwerk closes over it, so swapping the schema at runtime does nothing — use `:key` on `USchemaForm` to force a remount when the schema changes.
4. **Use `useTemplateRef`, not `ComponentExposed`.** The usual `ComponentExposed<typeof Comp>` advice for generic components degrades the type to `{}` here. A plain `useTemplateRef("form")` keeps the exposed API fully typed.
5. **`isSubmitting` covers validation only when you submit via `@submit`.** Vue discards whatever an emit listener returns, so an `async` handler keeps running after `isSubmitting` has flipped back to `false`, and a `:loading` button flashes instead of staying lit. Drive async submits with `form.handleSubmit(async …)` — off the slot prop or a template ref — and `isSubmitting` stays true for the whole callback.

Also worth knowing:

- **`as` avoids invalid nested `<form>` markup.** Render `USchemaForm`/`USchemalessForm` as a non-`form` element (e.g. `as="div"`) when nesting one inside another form-like element.
- **Native HTML5 validation is always off.** When rendered as a real `<form>`, these components set `novalidate`, matching formwerk's own `formProps`. Without it the browser's constraint bubbles fire first and swallow the `submit` event, so `@submit`/`@error` would never emit for a field marked `required`. There is no `disableHtmlValidation` prop, because formwerk's own flag provably no-ops here (this module's fields never hand formwerk an `inputEl`).
- **Two forms sharing an explicit `:id` share event buses.** Leave `id` unset (it's auto-generated) unless you specifically want two form components to observe the same formwerk/Nuxt UI events.

### UFormField

Enhanced field component that wraps Nuxt UI's UFormField with formwerk validation.

```vue
<template>
  <USchemalessForm>
    <UFormField name="email" label="Email" required #="{ model }">
      <UInput v-bind="model" type="email" />
    </UFormField>
  </USchemalessForm>
</template>
```

#### Props

Accepts all `UFormField` props except `validateOnInputDelay`, `errorPattern`, `eagerValidation`, and `error` (these are managed by formwerk).

#### Slot Props

- `model` - Object containing `{ modelValue, onUpdate:modelValue }` for v-bind compatibility
- `setValue` - Function to update field value
- `value` - Current field value (reactive)

**Recommended usage:** Use `#="{ model }"` and spread with `v-bind="model"` for compatibility with all Nuxt UI components.

### UFormGroup

Groups related form fields together for nested validation.

```vue
<template>
  <USchemalessForm>
    <UFormGroup name="address">
      <UFormField name="street" label="Street" #="{ model }">
        <UInput v-bind="model" />
      </UFormField>
      <UFormField name="city" label="City" #="{ model }">
        <UInput v-bind="model" />
      </UFormField>
    </UFormGroup>
  </USchemalessForm>
</template>
```

#### Props

| Prop   | Type     | Required | Description      |
| ------ | -------- | -------- | ---------------- |
| `name` | `string` | Yes      | Group identifier |

### UFormRepeater

Dynamic array field component for managing lists of items with add, remove, and reorder capabilities.

```vue
<script setup lang="ts">
  import { z } from "zod"
  import { useForm } from "@formwerk/core"

  const schema = z.object({
    contacts: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email"),
        }),
      )
      .min(1, "At least one contact required")
      .max(5, "Maximum 5 contacts"),
  })

  const form = useForm({ schema })
</script>

<template>
  <USchemalessForm>
    <UFormRepeater name="contacts" :min="1" :max="5" :ui="{ root: 'flex flex-col gap-3', item: 'p-4 border rounded-lg' }">
      <template #default="{ index, items, isFirst, isLast, repeater }">
        <div class="flex gap-4 items-end">
          <UFormField name="name" label="Name" class="flex-1" #="{ model }">
            <UInput v-bind="model" placeholder="Contact name" />
          </UFormField>
          <UFormField name="email" label="Email" class="flex-1" #="{ model }">
            <UInput v-bind="model" placeholder="Contact email" />
          </UFormField>
          <div class="flex gap-1">
            <UButton icon="i-lucide-arrow-up" variant="ghost" size="sm" :disabled="isFirst" @click="repeater.move(index, index - 1)" />
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
        <UButton icon="i-lucide-plus" variant="outline" :disabled="items.length >= 5" @click="repeater.add()"> Add Contact </UButton>
      </template>
    </UFormRepeater>
  </USchemalessForm>
</template>
```

#### Props

| Prop   | Type     | Required | Description               |
| ------ | -------- | -------- | ------------------------- |
| `name` | `string` | Yes      | Field name for the array  |
| `min`  | `number` | No       | Minimum number of items   |
| `max`  | `number` | No       | Maximum number of items   |
| `ui`   | `object` | No       | Styling classes for slots |

#### UI Prop

```ts
{
  root?: string      // Class for the root container
  leading?: string   // Class for the leading slot wrapper
  item?: string      // Class for each iteration item
  trailing?: string  // Class for the trailing slot wrapper
}
```

#### Slots

**default** - Rendered for each item in the array

| Prop       | Type                | Description                     |
| ---------- | ------------------- | ------------------------------- |
| `index`    | `number`            | Current item index              |
| `items`    | `readonly string[]` | Array of item keys              |
| `isFirst`  | `boolean`           | Whether this is the first item  |
| `isLast`   | `boolean`           | Whether this is the last item   |
| `repeater` | `RepeaterMethods`   | Methods to manipulate the array |

**leading** - Content before the items (optional)

| Prop       | Type                | Description                     |
| ---------- | ------------------- | ------------------------------- |
| `items`    | `readonly string[]` | Array of item keys              |
| `repeater` | `RepeaterMethods`   | Methods to manipulate the array |

**trailing** - Content after the items (optional)

| Prop       | Type                | Description                     |
| ---------- | ------------------- | ------------------------------- |
| `items`    | `readonly string[]` | Array of item keys              |
| `repeater` | `RepeaterMethods`   | Methods to manipulate the array |

#### Repeater Methods

```ts
interface RepeaterMethods {
  add: (count?: number) => void // Add items to the end
  remove: (index: number) => void // Remove item at index
  move: (from: number, to: number) => void // Move item from one index to another
  swap: (indexA: number, indexB: number) => void // Swap two items
  insert: (index: number, count?: number) => void // Insert items at index
}
```

> **Note:** Field names inside UFormRepeater should be relative (e.g., `name`, `email`), not the full path. The repeater automatically handles the array index pathing.

## Complete Example

```vue
<script setup lang="ts">
  import { z } from "zod"
  import type { ConsumableData } from "@formwerk/core"

  const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
    }),
  })

  const onSubmit = (data: ConsumableData<z.output<typeof schema>>) => {
    console.log("Validated data:", data.toJSON())
  }
</script>

<template>
  <USchemaForm :schema="schema" show-errors-on="blur" @submit="onSubmit">
    <div class="space-y-4">
      <UFormField name="name" label="Name" required #="{ model }">
        <UInput v-bind="model" />
      </UFormField>

      <UFormField name="email" label="Email" required #="{ model }">
        <UInput v-bind="model" type="email" />
      </UFormField>

      <UFormField name="password" label="Password" required #="{ model }">
        <UInput v-bind="model" type="password" />
      </UFormField>

      <UFormGroup name="address" class="space-y-4">
        <UFormField name="street" label="Street" #="{ model }">
          <UInput v-bind="model" />
        </UFormField>
        <UFormField name="city" label="City" #="{ model }">
          <UInput v-bind="model" />
        </UFormField>
      </UFormGroup>

      <UButton type="submit">Submit</UButton>
    </div>
  </USchemaForm>
</template>
```

## Components Summary

| Component         | Description                                       |
| ----------------- | ------------------------------------------------- |
| `USchemaForm`     | Self-contained, schema-driven form component      |
| `USchemalessForm` | Self-contained, schema-free form component        |
| `UFormField`      | Field wrapper with validation (overrides Nuxt UI) |
| `UFormGroup`      | Groups related fields for nested paths            |
| `UFormRepeater`   | Dynamic array fields with add/remove/reorder      |

## Accessing Original Nuxt UI Components

`UForm` is Nuxt UI's own component — this module does not touch it. Use it for forms that don't need formwerk.

Nuxt UI's original field is renamed and still accessible:

- `NuxtUiFormField` - Original Nuxt UI FormField component

## Technical Details

This module bridges [@formwerk/core](https://formwerk.dev/) with [@nuxt/ui](https://ui.nuxt.com/) by:

1. **USchemaForm / USchemalessForm** create a formwerk form and manage dual event buses (one for Nuxt UI, one for formwerk)
2. **UFormField** uses formwerk's `useCustomControl` composable to register fields and handle validation
3. **UFormRepeater** uses formwerk's `useFormRepeater` composable for array field management
4. Event coordination between both systems ensures validation triggers work as expected
5. Field state (touched, blurred, dirty) is tracked and exposed to the parent form

The integration allows you to use Nuxt UI's beautiful form components while leveraging formwerk's powerful validation and state management capabilities.

## Contribution

<details>
  <summary>Local development</summary>

```bash
# Install dependencies
pnpm install

# Generate type stubs and prepare playground
pnpm dev:prepare

# Develop with the playground
pnpm dev

# Build the playground
pnpm dev:build

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Run tests
pnpm test
pnpm test:watch

# Type check
pnpm test:types

# Release new version
pnpm release
```

</details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-ui-formwerk/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-ui-formwerk
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-ui-formwerk.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-ui-formwerk
[license-src]: https://img.shields.io/npm/l/nuxt-ui-formwerk.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-ui-formwerk
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
