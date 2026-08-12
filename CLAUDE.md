# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt module that integrates [@formwerk/core](https://formwerk.dev/) with [@nuxt/ui](https://ui.nuxt.com/) to provide enhanced form components with validation and state management. The module wraps Nuxt UI's form components with formwerk's composables to enable advanced form handling features like field-level validation, blur/touch/dirty tracking, and event-driven validation strategies.

**Dependencies:**

- `@formwerk/core`: Form management library (peer, `^0.14.4` — still pre-1.0, so its types are not stable)
- `@nuxt/ui`: Nuxt UI library (peer, `^4.0.0`)
- `@internationalized/date`: peer, `^3.10.0` — declared but not referenced anywhere in `src/`
- `@nuxt/kit`, `@vueuse/core`: direct dependencies

## Architecture

### Module Structure

Components are auto-registered using **Nuxt UI's own prefix**, read from `nuxt.options.ui.prefix` and defaulting to `U`. The module declares no `configKey` and accepts no options of its own.

```
src/
├── module.ts                      # Entry point: aliases, component renames, registration
└── runtime/
    ├── components/
    │   ├── Field.vue              # Overrides UFormField; bridges Nuxt UI events to formwerk
    │   ├── FormRoot.vue           # Root that adopts a caller-owned form
    │   ├── Group.vue              # Groups related form fields
    │   ├── Repeater.vue           # Repeatable field groups (dynamic arrays)
    │   ├── SchemaForm.vue         # Self-contained root, schema-driven
    │   └── SchemalessForm.vue     # Self-contained root, no schema
    ├── composables/
    │   └── useFormRoot.ts         # Shared wiring + submit handling for all three roots
    └── types/
        ├── form.ts                # Injection keys, shared prop and value types
        └── index.ts               # Type re-exports (module.ts does `export type *`)
```

### Registered components

Only `UFormField` **overrides** a Nuxt UI component. `module.ts` renames the original to `NuxtUiFormField` via the `components:extend` hook, matching on `filePath.includes("@nuxt/ui")`, and **throws** if no match is found — otherwise `Field.vue`'s `<NuxtUiFormField>` silently fails to resolve.

Nuxt UI's `UForm` is deliberately left alone. It was shadowed until v0.2: its API (`state`, `schema`, `@submit`, a real `<form>`) has no formwerk equivalent, so the override turned working Nuxt UI forms into silently broken ones. Formwerk forms are opt-in through the self-contained roots.

| Component         | Notes                                                  |
| ----------------- | ------------------------------------------------------ |
| `USchemaForm`     | Self-contained, schema-driven, renders a real `<form>` |
| `USchemalessForm` | Self-contained, shape inferred from `initialValues`    |
| `UFormRoot`       | Adopts a form the caller made with `useForm()`         |
| `UFormField`      | Override of Nuxt UI's; throws outside a formwerk root  |
| `UFormGroup`      | Nested field grouping                                  |
| `UFormRepeater`   | Dynamic arrays                                         |
| `UForm`           | Nuxt UI's own, untouched                               |

### Two pinned aliases (both load-bearing)

`module.ts` pins two module paths, resolving from the consumer's `rootDir` first and falling back to this module's own copy:

- `@formwerk/core` — two instances break context sharing between `useForm()` and `useFormContext()`. Fails silently: markup renders, reactivity is dead, console is clean.
- `@nuxt/ui/composables/useFormField` — Nuxt UI's injection keys are plain per-module `Symbol`s, so two physical copies never match and `provide()` becomes invisible.

Both reach into `@nuxt/ui` internals that are **not public API**, against a `^4.0.0` peer range. A Nuxt UI minor can break this silently.

### Component Integration Pattern

**Form roots.** All three call `useFormRoot(form, options)` for the wiring — two event buses, four injection keys, per-field interaction state — and `useFormSubmit(form, handlers)` for the submit handler. `useFormRoot` takes the form as an argument rather than calling `useForm()` itself, which is what lets one component host several independent forms.

- `SchemaForm.vue` / `SchemalessForm.vue` create their own form via `useGenericForm`.
- `FormRoot.vue` adopts one passed as a prop. It exists because a template ref on the other two is null until mount, so nothing reaches the form during `setup`. Its prop list is short on purpose: `schema`, `id`, `initialValues`, `initialTouched`, `initialDirty` and `disabled` all belong to the caller's `useForm()`, and accepting them would mean silently ignoring them — the failure mode that got `UForm` deleted. `disabled` is the sharp one, since formwerk's disabled context is created by `useForm`.

**Field Component** ([src/runtime/components/Field.vue](src/runtime/components/Field.vue)):

- Calls `useFormField` for field state, then `useCustomControl` with `_field` for the control layer
- Injects `formBus`, `formwerkBus`, `formwerkOptions`; **throws** when `formwerkOptions` is absent, since that means it is outside a formwerk root
- Sniffs the first default-slot vnode at setup to derive formwerk's `controlType` — fragile, and computed once
- Never binds formwerk's `controlProps`. Not an a11y gap: Nuxt UI's own `ariaAttrs` (`aria-invalid`, `aria-describedby`) still reach the input, because `Field.vue` passes `:error` to `NuxtUiFormField`. What is lost is formwerk-specific — `scrollToInvalidFieldOnSubmit`, `aria-errormessage`, `data-fw-form-id`. Binding `controlProps` would collide with Nuxt UI over `id` and `aria-describedby`.

**Repeater Component** ([src/runtime/components/Repeater.vue](src/runtime/components/Repeater.vue)):

- Uses `useFormRepeater`; exposes `Iteration` so custom rendering preserves formwerk's internal state
- `repeater` methods: `add`, `remove`, `move`, `swap`, `insert`
- `ui` prop slots: `root`, `leading`, `wrapper`, `item`, `trailing`

### Injection Keys

- `formwerkOptionsInjectionKey`: ours — `showErrorsOn`, `isSubmitAttempted`. Its presence is also how `Field.vue` detects it is inside a formwerk root.
- `formwerkBusInjectionKey`: ours — touched / blur / dirty events
- `formBusInjectionKey`: Nuxt UI's — input components emit blur/change/input/focus here
- `formOptionsInjectionKey`: Nuxt UI's — `disabled`, `validateOnInputDelay`

### How `disabled` reaches the inputs

Two independent channels, easy to confuse:

1. **Nuxt UI channel** — `useFormRoot` provides `formOptionsInjectionKey`; each Nuxt UI input's own `useFormField` injects it and computes `formOptions.disabled || props.disabled`, then binds the DOM attribute. This **bypasses `Field.vue` entirely**.
2. **formwerk channel** — the roots pass `disabled` to `useForm`, which creates a `createDisabledContext` that descendant fields inherit through provide/inject. This is what suppresses errors and strips disabled paths from the submitted payload.

Both are required; neither substitutes for the other. `Field.vue` wires nothing here — it did while `UForm` existed, because there the consumer owned the `useForm()` call and the prop had no other route.

If you ever do need a field-level `disabled`, it goes on the `useFormField` init, **not** on `useCustomControl`: passing `_field` there short-circuits `resolveFieldState`, so its own `disabled` option is never read. `required` has no formwerk channel at all.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev:prepare      # Build stub + prepare playground (run before lint/test/types)
pnpm dev              # Dev server with the playground
pnpm dev:build        # Build the playground

pnpm lint             # ESLint
pnpm lint:fix         # ESLint --fix
pnpm format           # Prettier --write
pnpm format:check     # Prettier --check (currently fails on 5 pre-existing files; not in CI)

pnpm test             # Vitest run
pnpm test:watch       # Vitest watch
pnpm test:types       # vue-tsc on the module, then on test/types

pnpm prepack          # Build the module
pnpm verify:dist      # Type-check a consumer against dist/ (see below)
```

There is no `release` script — releases go through release-please and the `release.yml` workflow.

CI runs, in order: `lint` → `test:types` → `test` → `prepack` → `verify:dist`.

## Testing

Three suites, two different harnesses:

- **SSR E2E** ([test/basic.test.ts](test/basic.test.ts), [test/custom-prefix.test.ts](test/custom-prefix.test.ts)) — `setup()` + `$fetch` from `@nuxt/test-utils/e2e` against fixtures in [test/fixtures/](test/fixtures/). Assert on rendered HTML strings.
- **Component** ([test/disabled.test.ts](test/disabled.test.ts)) — opts in per file with a `// @vitest-environment nuxt` docblock, then `mountSuspended` from `@nuxt/test-utils/runtime`. `vitest.config.ts` points the Nuxt environment's `rootDir` at the basic fixture so the module is registered. Needs `@vue/test-utils` and `happy-dom`.
- **Types** ([test/types/](test/types/)) — `vue-tsc` over `.vue` files using `@vue-expect-error` to pin generic inference.

Prefer a component test whenever the behaviour under test is not visible in SSR markup. Much of formwerk's state registration is deferred to `nextTick` (see `initFormPathIfNecessary`), so it is structurally absent from server-rendered HTML. `handleSubmit` validates asynchronously — use `flushPromises()`, not a single `nextTick()`.

**`verify:dist` exists for a real failure mode:** `nuxt-module-build` exits 0 even when the declaration emitter fails, and `vue-sfc-transformer` then writes zero-byte `.d.ts` files. CI looks green while consumers get `TS2306: not a module`. Run it after `prepack`.

## Tooling

- **Linter**: ESLint with @nuxt/eslint-config + Prettier
- **Formatter**: Prettier (`printWidth: 135`, no semicolons)
- **Type Checker**: vue-tsc
- **Test Framework**: Vitest with @nuxt/test-utils
- **Build Tool**: @nuxt/module-builder
- **Package Manager**: pnpm 11.20.0
- **Releases**: release-please (`release-please-config.json`); `bump-minor-pre-major` is on, so `feat` commits currently bump a patch

## Important Notes

- Components are auto-imported; users need no explicit imports
- `module.ts` declares `@nuxt/ui` under `moduleDependencies`, so Nuxt installs it — there is no manual peer check
- Event coordination between Nuxt UI's form system and formwerk is critical; changes to event handling must preserve both systems' expectations
- The event-bus bridge — the module's core value — has almost no interaction coverage. Adding behaviour there without a component test means it is unverified
