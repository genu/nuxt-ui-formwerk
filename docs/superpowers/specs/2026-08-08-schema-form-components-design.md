# USchemaForm / USchemalessForm — self-contained form roots

Date: 2026-08-08
Status: Approved, ready for planning

## Problem

`useForm()` calls `provide(FormKey, context)` on the **calling component instance**. Two calls in
one `<script setup>` and the second clobbers the first for every descendant. There is no way to
scope them.

Today `UForm` consumes an existing context via `useFormContext()` (`src/runtime/components/Form.vue:23`),
which means the user must call `useForm()` in their own `<script setup>`. So a component can host
exactly one formwerk form. Multiple independent forms on one page require splitting them into
separate components purely to work around the provide scope.

## Solution

Two new components that call `useForm()` **themselves**. Each instance gets its own provides object,
so `<USchemaForm>` three times in one template is three independent forms.

They map to formwerk's two `useForm` overloads (`@formwerk/core@0.14.4`, `dist/core.d.ts:686-687`):

```ts
function useForm<TInput extends FormObject>(props?: NoSchemaFormProps<TInput>): FormReturns<TInput>
function useForm<TSchema extends GenericFormSchema>(
  props?: SchemaFormProps<TSchema>,
): FormReturns<InferInput<TSchema>, InferOutput<TSchema>>
```

- `USchemaForm` — schema-driven
- `USchemalessForm` — no schema

Names follow formwerk's own vocabulary; `SchemaFormProps` and `SchemalessFormProps` are its exported
type names (`core.d.ts:540`, `:3681`), so docs map 1:1 with upstream.

`UFormwerk*` was rejected: every component in this module is formwerk-backed and intercepts Nuxt UI
field events, so "Formwerk" in a name carries no information. The distinction that matters is
**these declare the form; `UForm` joins one that already exists.**

## Why two components and not one

At runtime `useForm` is a single function with an optional `schema`. The overloads are purely a
TypeScript inference device. Both a props union and a single component with two optional props were
tested and mostly work — but one case fails.

`SchemaFormProps` permits `schema` **and** `initialValues` together (`core.d.ts:540-546`). That is a
normal combination, not an error. In a single component `TSchema` and `TInput` are independent
inference sites, so TS infers `TInput` from whatever `initialValues` receives and never cross-checks
it against `TSchema`:

| Probe                                            | Shape                         | Result   |
| ------------------------------------------------ | ----------------------------- | -------- |
| One component, `schema` only                     | slot typed from schema        | pass     |
| One component, `initialValues` only              | slot typed from initialValues | pass     |
| One component, `schema` + bogus `initialValues`  | **silently accepted**         | **fail** |
| Two components, `schema` + bogus `initialValues` | correctly rejected (TS2353)   | pass     |

Split apart, `schema` is required on `USchemaForm`, so `initialValues` can be typed
`PartialDeep<InferInput<TSchema>>` directly — no conditional types, no union, nothing for a future
vue-tsc to regress on. Each component has exactly one generic with one inference source.

Verified against Vue 3.5.26 / vue-tsc 3.2.2. Note for the record: union props and conditional slot
types **do** work in this toolchain. They were not the blocker.

## Architecture

`Form.vue` currently does six things; five are identical regardless of where the form came from:

|     | Today in `Form.vue`                                | Belongs to    |
| --- | -------------------------------------------------- | ------------- |
| 1   | `useFormContext()`                                 | the component |
| 2   | two `useEventBus` instances keyed off `context.id` | shared        |
| 3   | `provide` × 4 injection keys                       | shared        |
| 4   | reactive `dirty`/`touched`/`blurred` Sets          | shared        |
| 5   | `formwerkBus.on` → toggle those Sets               | shared        |
| 6   | render                                             | the component |

Extract 2–5 into `src/runtime/composables/useFormRoot.ts`, taking a `FormReturns` plus
`{ validateOn, disabled }` and returning the three Sets.

```
useFormRoot(form, opts)          ← buses, provides, field-state Sets
├── Form.vue            useFormContext()          → <div>    (behaviour unchanged)
├── SchemaForm.vue      useForm({ schema, … })    → <form>
└── SchemalessForm.vue  useForm({ … })            → <form>
```

`Field.vue`, `Group.vue` and `Repeater.vue` need **no changes**. They locate the form by injection,
and all three roots provide the same four keys.

This relies on slot children injecting from the slot _owner_ rather than the lexical parent. That is
already load-bearing in this repo — `Form.vue:43` provides `formBusInjectionKey` and `Field.vue:23`
injects it from inside the slot — so it is proven here, not assumed.

The two new files stay separate rather than sharing a base component: their only difference is the
SFC `generic` attribute, which cannot be factored out without reintroducing the cross-inference hole
above. Runtime is shared via `useFormRoot`; roughly 15 lines of typed props/slots differ per file.

### File layout

```
src/runtime/
├── components/
│   ├── Form.vue             ← shrinks to useFormContext + useFormRoot
│   ├── SchemaForm.vue       ← new
│   ├── SchemalessForm.vue   ← new
│   ├── Field.vue            ← untouched
│   ├── Group.vue            ← untouched
│   └── Repeater.vue         ← untouched
├── composables/
│   └── useFormRoot.ts       ← new
└── types/
    └── form.ts              ← + shared FormRootProps<TInput>
```

`FormRootProps<TInput>` is the shared-props table below, so the three roots declare it once.

Note one asymmetry: `disabled` reaches `useForm({ disabled })` only in the two new components, since
`Form.vue` does not call `useForm` at all. In `Form.vue` it continues to flow through the provides
alone, exactly as it does today. `useFormRoot` is responsible only for the provides; passing
`disabled` into `useForm` is each new component's own job.

`module.ts` gains two `addComponent` calls, `${prefix}SchemaForm` and `${prefix}SchemalessForm`. No
`components:extend` rename is needed — Nuxt UI has no components by those names, so the existing
rename hook for `UForm`/`UFormField` is untouched.

## Public API

### Shared props

| Prop                              | Type                                  | Default  | Note                                                                |
| --------------------------------- | ------------------------------------- | -------- | ------------------------------------------------------------------- |
| `as`                              | `string \| Component`                 | `"form"` | Escape hatch for the nested-form case                               |
| `id`                              | `string`                              | auto     | Passed to `useForm`; becomes the element `id`                       |
| `validateOn`                      | `"touched" \| "blur" \| "dirty"`      | `"blur"` | Ours; matches today's `UForm`                                       |
| `disabled`                        | `boolean`                             | `false`  | Goes to `useForm({ disabled })` **and** the existing provides       |
| `disableHtmlValidation`           | `boolean`                             | —        | Pass-through                                                        |
| `initialTouched` / `initialDirty` | `TouchedSchema<T>` / `DirtySchema<T>` | —        | Pass-through; mapped types, so they do not interfere with inference |

`scrollToInvalidFieldOnSubmit` is deliberately **not** exposed — see Known limitations.

**Principle governing this list: expose every formwerk form option except the one that provably
no-ops.** The table is `_FormProps` minus `scrollToInvalidFieldOnSubmit`, plus our own `as` and
`validateOn`.

This matters more here than it does for `UForm`. With `UForm` the user calls `useForm()` themselves,
so anything we fail to expose is still reachable. In these components the `useForm()` call is owned
by the component, so **the props are the entire API** — any omitted option becomes flatly
unavailable, with no escape hatch short of switching back to `UForm`. That is the reason
`initialTouched` / `initialDirty` are included: not because pre-marking touched state is especially
compelling on its own (its main use is edit forms that should show validation on mount), but because
omitting it would create an arbitrary capability cliff. They are fully typed —
`TouchedSchema<TForm>` is `Simplify<Schema<TForm, boolean>>` (`core.d.ts:256`), a deep mapped type
mirroring the form shape, giving the same checking you get passing it to `useForm` directly.

### Per-component props

```ts
// USchemaForm  — generic="TSchema extends GenericFormSchema"
schema: TSchema                                                           // required, drives all inference
initialValues?: MaybeGetter<MaybeAsync<PartialDeep<InferInput<TSchema>>>> // full async support

// USchemalessForm — generic="TInput extends FormObject"
initialValues?: TInput | (() => TInput)                                   // object or sync getter
```

### Emits

```ts
submit: [data: ConsumableData<TOutput>]   // only on successful validation
error:  [issues: IssueCollection[]]       // synthesized from getSubmitErrors() after the handler settles
```

`handleSubmit(cb)` runs `cb` only on success and provides no failure callback (`core.mjs:1091-1106`);
on invalid it simply returns. `error` is therefore our wrapper: await the handler, then read
`getSubmitErrors()`. `handleSubmit` already calls `e.preventDefault()`, so we must not double-handle.

`ConsumableData` is what formwerk hands users today — the playground already calls `data.toJSON()`
on it.

### Default slot

```ts
{
  ;(form, // the whole FormReturns
    values, // convenience alias for form.values
    blurredFields,
    touchedFields,
    dirtyFields) // unchanged from today's UForm
}
```

Passing `form` wholesale rather than curating individual slot props means we never fall out of sync
when formwerk adds something. The three Sets stay top-level so existing `UForm` slot destructuring
ports over unchanged.

### Exposed

```ts
defineExpose({ ...form, blurredFields, touchedFields, dirtyFields })
```

Flat, so it reads `formRef.value.reset()` rather than `formRef.value.form.reset()`. No key
collisions: `FormReturns` has `isDirty`/`isTouched`/`isBlurred` as functions, our additions are
`*Fields` Sets.

Access must use a plain `useTemplateRef`. Verified:

| Access pattern                                                           | Typing                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| `useTemplateRef("form")`                                                 | **Full** — `values` resolves to the concrete shape |
| `ComponentExposed<typeof USchemaForm>` from `vue-component-type-helpers` | Degrades to `{}`                                   |

The `ComponentExposed` helper is the usual advice for generic components and is actively wrong here.
The README must say so.

### Template

```vue
<component :is="as" :id="form.formProps.id" @submit="onSubmit">
  <slot v-bind="slotProps" />
</component>
```

## Behaviour changes vs today's `UForm`

- **Renders a real `<form>`.** Enter-to-submit and `<UButton type="submit">` start working; today's
  `<div>` swallows both. Nested `<form>` is invalid HTML and browsers drop the inner one, hence the
  `as` prop.
- **`disabled` is stronger.** Today it is only provided and forwarded into `useCustomControl`
  (`Field.vue:48`). Formwerk's native `useForm({ disabled })` additionally strips disabled paths out
  of the submit output (`core.mjs:1106`). Wiring both keeps `disabled` meaning one thing across all
  three roots.
- **Generated ids move.** Ids come from Vue's `useId()` (`core.mjs:48-49`), which is tree-position
  dependent. Relocating the `useForm()` call changes the id string. SSR-stable either way, but
  id-snapshotting tests will churn.

## Known limitations (must be documented)

1. **`interface` is rejected; use `type`.** `FormObject` is `Record<string, unknown>`
   (`core.d.ts:80`) and TypeScript refuses to assign an `interface` to an index-signature type —
   interfaces get no implicit index signature, `type` aliases do.

   ```ts
   interface Contact {
     email: string
     age: number
   } // rejected
   type Contact = { email: string; age: number } // fine
   ```

   Upstream formwerk's constraint, but `USchemalessForm` is where users meet it.

2. **Async initial values are unavailable on `USchemalessForm`.** Templates cannot take a type
   argument, so the shape is inferred from `:initial-values`:

   | `:initial-values="…"`                 | Infers?                   |
   | ------------------------------------- | ------------------------- |
   | object literal                        | yes                       |
   | typed const declared with `type`      | yes                       |
   | typed const declared with `interface` | no — rejected             |
   | sync getter `() => ({ … })`           | yes                       |
   | async getter `async () => ({ … })`    | no — yields an empty type |

   Escape hatches: `USchemaForm` (schema drives inference, so `initialValues` may be async), or
   `UForm` + `useForm<T>()` which is unchanged. Only the schemaless + async + inference combination
   is affected.

3. **`:schema` is read once at setup.** `useForm` destructures and closes over it
   (`core.mjs:1352`, `:976`). Swapping it at runtime does nothing; users need `:key` to force a
   remount.

4. **`scrollToInvalidFieldOnSubmit` cannot work, so it is not exposed.** It queries
   `[aria-invalid="true"][aria-errormessage][data-fw-form-id="…"]` (`core.mjs:1269`).
   `data-fw-form-id` only exists on formwerk's `controlProps` (`core.mjs:1477`), and `Field.vue`
   never binds `controlProps` — it hands the slot `{ modelValue, onUpdate:modelValue }` and nothing
   else. Nuxt UI meanwhile expresses the same intent with `aria-describedby` rather than
   `aria-errormessage`. So the selector never matches and the option silently no-ops.

   This is a selector mismatch between two accessibility conventions, **not** an accessibility gap.
   Because `Field.vue:111` delegates to the real `NuxtUiFormField` and feeds it our formwerk-derived
   `error`, Nuxt UI's own a11y wiring runs end to end: `FormField.vue:46` provides the field context,
   `useFormField.js:55-65` derives `aria-invalid` and `aria-describedby`, `Input.vue:132` binds them
   onto the real `<input>`, and `FormField.vue:85` renders the error text under the matching id.
   Screen readers get error announcements. Nothing to fix here.

5. **Two forms given the same explicit `:id` share event buses.** Bus keys are `form-${context.id}` /
   `formwerk-form-${context.id}` and `useEventBus` is globally keyed. Auto-generated ids make the
   multi-form case safe by default. Documented, not defended against.

## Non-goals

- **Typing `name` against the schema.** `name` stays a plain `string` from Nuxt UI's `FormFieldProps`.
  Unchanged from today, but more noticeable once the root is generic.
- **Forwarding formwerk's `controlProps`.** Accessibility is Nuxt UI's job here and it already works
  (limitation 4). Binding formwerk's competing set of aria attributes on top would duplicate or
  conflict with it. The only thing forgone is `scrollToInvalidFieldOnSubmit`, which is not worth
  reopening that.
- **Removing or deprecating `UForm`.** It stays as the lower-level entry point.

## Testing

**Layer 1 — type tests.** This design is a typing argument, so the tests should be too. Add
`test/types/` with its own `tsconfig.json`, wired into the existing `test:types` script. Assert
expected failures with `@vue-expect-error`, which was verified to work both ways: it suppresses a
genuine error, and reports `TS2578: Unused '@ts-expect-error' directive` when placed over valid code.
So a typing regression fails the suite instead of silently passing.

Cases:

- schema inference reaching both slot props and `useTemplateRef`
- schemaless inference from object literal, typed const, sync getter
- async getter does _not_ infer — pinned so it cannot silently rot into `any`
- `interface` rejection — pinned for the same reason
- **regression guard:** `initialValues` _is_ checked against `schema`. This is the test that stops
  anyone later collapsing the two components back into one.

Working versions of every probe cited in this document live in this workspace's `.context/generics-probe/`
(git-excluded scratch, not committed). They are the source material for `test/types/`.

**Layer 2 — SSR.** Extend `test/fixtures/basic/app.vue` with both components; assert they render and
that `USchemaForm` produces a real `<form>` with an id.

**Layer 3 — DOM: deliberately out of scope for this change.** Verifying multi-form isolation,
`@submit` / `@error` firing, `disabled` stripping a field from the payload, and `as="div"` all
require `mountSuspended` plus a DOM environment, and `vitest.config.ts` currently has neither by
design (its comment notes E2E does not need one). Standing that up means adding `happy-dom` and a
second vitest project.

Decision: skip it. Behaviour is verified through the playground for now.

**This leaves a known coverage gap, stated plainly so it is not mistaken for coverage:** the headline
feature — multiple independent forms in one component — has no automated test. SSR string matching
cannot see it and type tests cannot see it. If this ships and later regresses, nothing in CI will
catch it. Revisit when DOM testing is stood up for other reasons.

## Playground

Add a page with two forms in one component. Given the Layer 3 decision above, this is not just a
demo — it is the only verification that the core feature works, so it should exercise independent
values, independent submits, and independent validation state.

## Release

Additive minor bump on 0.1.x. Nothing breaks.
