# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt module that integrates [@formwerk/core](https://formwerk.dev/) with [@nuxt/ui](https://ui.nuxt.com/) to provide enhanced form components with validation and state management. The module wraps Nuxt UI's form components with formwerk's composables to enable advanced form handling features like field-level validation, blur/touch/dirty tracking, and event-driven validation strategies.

**Key Dependencies:**
- `@formwerk/core`: Form management library (peer dependency)
- `@nuxt/ui`: Nuxt UI library (peer dependency)
- `@vueuse/core`: Vue composition utilities for event bus

## Architecture

### Module Structure

The module follows the standard Nuxt module pattern with components auto-registered with a configurable prefix (default: `UE`).

```
src/
├── module.ts                 # Module entry point, registers components
└── runtime/
    └── components/
        ├── Field.vue         # Wraps UFormField with formwerk validation
        ├── Form.vue          # Provides form context and event coordination
        └── Group.vue         # Groups related form fields
```

### Component Integration Pattern

**Form Component** ([src/runtime/components/Form.vue](src/runtime/components/Form.vue)):
- Creates formwerk form context via `useFormContext()`
- Manages two event buses:
  - `formwerkBus`: Custom bus for formwerk-specific events (touched, blur, dirty)
  - `NuxtUiFormBus`: Nuxt UI's native form event bus
- Tracks field state in reactive Sets (dirtyFields, touchedFields, blurredFields)
- Provides form options via injection keys (validateOn strategy, disabled state)

**Field Component** ([src/runtime/components/Field.vue](src/runtime/components/Field.vue)):
- Uses `useCustomControl` from formwerk for field registration and validation
- Injects form context (formBus, formwerkBus, formwerkOptions)
- Bridges between Nuxt UI form events and formwerk state management
- Supports configurable validation triggers (blur, etc.)
- Exposes `setValue` and `fieldValue` to slot content

**Group Component** ([src/runtime/components/Group.vue](src/runtime/components/Group.vue)):
- Simple wrapper using `useFormGroup` from formwerk
- Groups related fields for nested validation

### Injection Keys

The module uses typed injection keys for form context sharing:
- `formwerkOptionsInjectionKey`: Form configuration (validateOn, disabled)
- `formwerkBusInjectionKey`: Custom event bus for form events
- `formBusInjectionKey`: Nuxt UI form event bus (from @nuxt/ui)
- `formOptionsInjectionKey`: Nuxt UI form options (from @nuxt/ui)

## Development Commands

```bash
# Install dependencies
pnpm install

# Prepare development (build stub + prepare playground)
pnpm dev:prepare

# Start development server with playground
pnpm dev

# Build playground
pnpm dev:build

# Run linter (uses oxlint with type-aware checking)
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code (uses oxfmt)
pnpm format

# Check formatting
pnpm format:check

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check both module and playground
pnpm test:types

# Build module for production
pnpm prepack

# Release (lint, test, build, changelog, publish, push tags)
pnpm release
```

## Testing

Tests use Vitest with `@nuxt/test-utils` for E2E SSR testing. Test fixtures are located in [test/fixtures/basic/](test/fixtures/basic/).

The basic test verifies SSR rendering works correctly with the module installed.

## Module Configuration

Users configure the module in their `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-ui-formwerk'],
  uiElements: {
    prefix: 'UE' // Customizes component prefix (default: 'UE')
  }
})
```

The module checks for required peer dependencies (`@nuxt/ui`) at setup time and logs errors if missing.

## Tooling

- **Linter**: oxlint (with type-aware checking and TSGolint plugin)
- **Formatter**: oxfmt
- **Type Checker**: vue-tsc
- **Test Framework**: Vitest with @nuxt/test-utils
- **Build Tool**: @nuxt/module-builder
- **Package Manager**: pnpm 10.26.2

## Important Notes

- Components are auto-imported, so users don't need explicit imports
- The module requires both `@nuxt/ui` and `@formwerk/core` as peer dependencies
- Event coordination between Nuxt UI's form system and formwerk is critical - changes to event handling should preserve both systems' expectations
- The module also has `motion-v/nuxt` and `@nuxtjs/color-mode` as module dependencies (auto-installed)
