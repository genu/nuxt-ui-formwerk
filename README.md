# Nuxt UI Formwerk

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> [!WARNING]
> **⚠️ Experimental Module**
>
> This module is currently in an experimental phase. APIs may change, and some features may not be fully stable. Use with caution in production environments and please report any issues you encounter.
>
> **Technical Note:** This module works by tapping into Nuxt UI's form mechanism and intercepting events to coordinate between Nuxt UI's native form system and formwerk's validation engine.

Enhanced form components for Nuxt UI with [@formwerk/core](https://formwerk.dev/) integration. This module bridges the gap between Formwerk's powerful form validation and state management with Nuxt UI's beautiful form components.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 🎯 **Formwerk Integration** - Seamless integration with [@formwerk/core](https://formwerk.dev/) for advanced form validation
- 📝 **Enhanced Form Components** - Wraps Nuxt UI components with formwerk capabilities
- ✅ **Field-level Validation** - Granular validation control with error message handling
- 🔄 **State Tracking** - Track touched, blurred, and dirty states per field
- ⚙️ **Flexible Validation Strategies** - Configure when validation occurs (on blur, on input, etc.)
- 📦 **Auto-import** - Components are automatically available in your app
- 🎯 **TypeScript** - Full type safety out of the box

## Quick Setup

Install the module and its peer dependencies:

```bash
pnpm add nuxt-ui-formwerk
```

> **Note:** This module requires `@formwerk/core` and `@nuxt/ui` as peer dependencies. Make sure they are installed in your project.

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "nuxt-ui-formwerk"],
})
```

That's it! You can now use enhanced form components in your Nuxt app ✨

## Usage

This module provides three main components that wrap Nuxt UI form components with formwerk functionality:

### FormwerkForm

The root form component that provides validation context and tracks form state.

```vue
<script setup lang="ts">
  import { z } from "zod"
  import { useForm } from "@formwerk/core"

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  const form = useForm({ schema })
</script>

<template>
  <FormwerkForm validate-on="blur" #="{ blurredFields, touchedFields, dirtyFields }">
    <!-- Form content here -->
    <p>Blurred fields: {{ blurredFields.size }}</p>
  </FormwerkForm>
</template>
```

#### Props

| Prop         | Type                             | Default  | Description                |
| ------------ | -------------------------------- | -------- | -------------------------- |
| `validateOn` | `'touched' \| 'blur' \| 'dirty'` | `'blur'` | When to trigger validation |
| `disabled`   | `boolean`                        | `false`  | Disable all form fields    |

#### Slot Props

- `blurredFields` - Set of field names that have been blurred
- `touchedFields` - Set of field names that have been touched
- `dirtyFields` - Set of field names with modified values

### FormwerkField

Enhanced field component that wraps `UFormField` with formwerk validation.

```vue
<template>
  <FormwerkForm>
    <FormwerkField name="email" label="Email" required #="{ model }">
      <UInput v-bind="model" type="email" />
    </FormwerkField>
  </FormwerkForm>
</template>
```

#### Props

Accepts all `UFormField` props except `validateOnInputDelay`, `errorPattern`, `eagerValidation`, and `error` (these are managed by formwerk).

#### Slot Props

- `model` - Object containing `{ modelValue, onUpdate:modelValue }` for v-bind compatibility
- `setValue` - Function to update field value
- `value` - Current field value (reactive)

**Recommended usage:** Use `#="{ model }"` and spread with `v-bind="model"` for compatibility with all Nuxt UI components.

### FormwerkGroup

Groups related form fields together for nested validation.

```vue
<template>
  <FormwerkForm>
    <FormwerkGroup name="address">
      <FormwerkField name="street" label="Street" #="{ model }">
        <UInput v-bind="model" />
      </FormwerkField>
      <FormwerkField name="city" label="City" #="{ model }">
        <UInput v-bind="model" />
      </FormwerkField>
    </FormwerkGroup>
  </FormwerkForm>
</template>
```

#### Props

| Prop   | Type     | Required | Description      |
| ------ | -------- | -------- | ---------------- |
| `name` | `string` | Yes      | Group identifier |

## Complete Example

```vue
<script setup lang="ts">
  import { z } from "zod"
  import { useForm } from "@formwerk/core"

  const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })

  const form = useForm({ schema })

  const onSubmit = form.handleSubmit((data) => {
    // Handle validated data
  })
</script>

<template>
  <FormwerkForm validate-on="blur">
    <div class="space-y-4">
      <FormwerkField name="name" label="Name" required #="{ model }">
        <UInput v-bind="model" />
      </FormwerkField>

      <FormwerkField name="email" label="Email" required #="{ model }">
        <UInput v-bind="model" type="email" />
      </FormwerkField>

      <FormwerkField name="password" label="Password" required #="{ model }">
        <UInput v-bind="model" type="password" />
      </FormwerkField>

      <UButton type="submit" @click="onSubmit"> Submit </UButton>
    </div>
  </FormwerkForm>
</template>
```

## Components

All components are auto-imported with the `Formwerk` prefix:

- `FormwerkForm` - Root form component
- `FormwerkField` - Field wrapper component
- `FormwerkGroup` - Field grouping component

## How It Works

This module bridges [@formwerk/core](https://formwerk.dev/) with [@nuxt/ui](https://ui.nuxt.com/) by:

1. **FormwerkForm** creates a formwerk form context and manages dual event buses (one for Nuxt UI, one for formwerk)
2. **FormwerkField** uses formwerk's `useCustomControl` composable to register fields and handle validation
3. Event coordination between both systems ensures validation triggers work as expected
4. Field state (touched, blurred, dirty) is tracked and exposed to the parent form

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

# Run linter (oxlint)
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code (oxfmt)
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
