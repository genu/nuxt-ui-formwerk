## v0.1.18

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.17...v0.1.18)

### 🚀 Enhancements

- Add repeater component ([460b3c5a](https://github.com/genu/nuxt-ui-formwerk/commit/460b3c5a))
- Enhance Repeater component with wrapper slot support ([d87c7070](https://github.com/genu/nuxt-ui-formwerk/commit/d87c7070))

### 🩹 Fixes

- Update dependencies for eslint-plugin-prettier, prettier, and vitest ([86f0924a](https://github.com/genu/nuxt-ui-formwerk/commit/86f0924a))
- Remove @nuxt/ui module from configuration since we already have it as a module dependency ([62383656](https://github.com/genu/nuxt-ui-formwerk/commit/62383656))
- Replace the @nuxt/ui registered components directly ([bdfef28a](https://github.com/genu/nuxt-ui-formwerk/commit/bdfef28a))
- Update kebab name generation for components to use replaceAll for consistency ([92980578](https://github.com/genu/nuxt-ui-formwerk/commit/92980578))
- Streamline module setup and prevent duplicate @formwerk/core instances ([89d0590a](https://github.com/genu/nuxt-ui-formwerk/commit/89d0590a))
- Disable require-default-prop rule in Vue ESLint configuration ([8a6aeb6f](https://github.com/genu/nuxt-ui-formwerk/commit/8a6aeb6f))

### 📖 Documentation

- Update README for clarity and component details ([3e3e4c0e](https://github.com/genu/nuxt-ui-formwerk/commit/3e3e4c0e))
- Add Event Bus integration details to README ([9a3339b6](https://github.com/genu/nuxt-ui-formwerk/commit/9a3339b6))

### 🏡 Chore

- **release:** V0.1.17 ([c9b4fce3](https://github.com/genu/nuxt-ui-formwerk/commit/c9b4fce3))
- Update claude.md for better context support ([60822223](https://github.com/genu/nuxt-ui-formwerk/commit/60822223))

### ✅ Tests

- Add enhanced tests ([4546dadf](https://github.com/genu/nuxt-ui-formwerk/commit/4546dadf))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## [0.1.21](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.20...v0.1.21) (2026-03-27)


### Bug Fixes

* **ci:** use PAT for release-please to trigger CI on PRs ([#42](https://github.com/genu/nuxt-ui-formwerk/issues/42)) ([b387d7f](https://github.com/genu/nuxt-ui-formwerk/commit/b387d7f6e2be291185218f4b02352a4fbdf048bc))
* use explicit import path for Nuxt UI injection keys ([#40](https://github.com/genu/nuxt-ui-formwerk/issues/40)) ([9da6b52](https://github.com/genu/nuxt-ui-formwerk/commit/9da6b525daaf9fd2d39e48b007824f4e7f4b27e0)), closes [#39](https://github.com/genu/nuxt-ui-formwerk/issues/39)

## [0.1.20](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.19...v0.1.20) (2026-02-10)


### Bug Fixes

* add missing prepare step to release workflow ([#13](https://github.com/genu/nuxt-ui-formwerk/issues/13)) ([38198c3](https://github.com/genu/nuxt-ui-formwerk/commit/38198c30ff5f76ee3e9a2907a165edcd04fc2706))

## [0.1.19](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.18...v0.1.19) (2026-02-07)


### Features

* add CI and release workflows with pnpm setup and versioning ([718019a](https://github.com/genu/nuxt-ui-formwerk/commit/718019a45ee9abeebc817ae866254cb72b87599e))
* enhance Repeater component with wrapper slot support ([d87c707](https://github.com/genu/nuxt-ui-formwerk/commit/d87c70707cc048e84fb14c07326730341b54d8f7))


### Bug Fixes

* disable require-default-prop rule in Vue ESLint configuration ([8a6aeb6](https://github.com/genu/nuxt-ui-formwerk/commit/8a6aeb6f1be9cbc18a35b2bff926f1b8e919c0a3))

## v0.1.17

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.16...v0.1.17)

### 🚀 Enhancements

- Add repeater component ([460b3c5a](https://github.com/genu/nuxt-ui-formwerk/commit/460b3c5a))

### 🩹 Fixes

- Update dependencies for eslint-plugin-prettier, prettier, and vitest ([86f0924a](https://github.com/genu/nuxt-ui-formwerk/commit/86f0924a))
- Remove @nuxt/ui module from configuration since we already have it as a module dependency ([62383656](https://github.com/genu/nuxt-ui-formwerk/commit/62383656))
- Replace the @nuxt/ui registered components directly ([bdfef28a](https://github.com/genu/nuxt-ui-formwerk/commit/bdfef28a))
- Update kebab name generation for components to use replaceAll for consistency ([92980578](https://github.com/genu/nuxt-ui-formwerk/commit/92980578))
- Streamline module setup and prevent duplicate @formwerk/core instances ([89d0590a](https://github.com/genu/nuxt-ui-formwerk/commit/89d0590a))

### ✅ Tests

- Add enhanced tests ([4546dadf](https://github.com/genu/nuxt-ui-formwerk/commit/4546dadf))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.16

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.15...v0.1.16)

### 🩹 Fixes

- Enhance slot handling and control type determination in Field component ([2af1a964](https://github.com/genu/nuxt-ui-formwerk/commit/2af1a964))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.15

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.14...v0.1.15)

### 🚀 Enhancements

- Integrate useFormField for devtools support ([febb0622](https://github.com/genu/nuxt-ui-formwerk/commit/febb0622))

### 🩹 Fixes

- Simplify error computation logic in Field component ([4dd5a77e](https://github.com/genu/nuxt-ui-formwerk/commit/4dd5a77e))
- Ensure we quality event handling on the bus ([3fa90b57](https://github.com/genu/nuxt-ui-formwerk/commit/3fa90b57))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.14

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.13...v0.1.14)

### 🚀 Enhancements

- Enhance TypeScript types and update ESLint configuration ([8aafaa91](https://github.com/genu/nuxt-ui-formwerk/commit/8aafaa91))

### 🏡 Chore

- Update @nuxt/test-utils to version 3.23.0 ([714bc01c](https://github.com/genu/nuxt-ui-formwerk/commit/714bc01c))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.13

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.12...v0.1.13)

### 🏡 Chore

- Update dependencies and add peer dependency for `@internationalized/date` ([557ce094](https://github.com/genu/nuxt-ui-formwerk/commit/557ce094))
- Lint/format ([7a15f728](https://github.com/genu/nuxt-ui-formwerk/commit/7a15f728))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.12

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.11...v0.1.12)

### 💅 Refactors

- Remove unused ModuleOptions interface and add eslint disables for any type usage ([d90396d2](https://github.com/genu/nuxt-ui-formwerk/commit/d90396d2))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.11

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.10...v0.1.11)

### 📖 Documentation

- Update README with peer dependency note and slot prop usage ([0dccc77d](https://github.com/genu/nuxt-ui-formwerk/commit/0dccc77d))

### 🏡 Chore

- Add FormwerkGroup props ([7f6f9483](https://github.com/genu/nuxt-ui-formwerk/commit/7f6f9483))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.10

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.9...v0.1.10)

### 💅 Refactors

- **Form.vue:** Streamline imports and add error handling for form context ([f35487d4](https://github.com/genu/nuxt-ui-formwerk/commit/f35487d4))

### 🏡 Chore

- Update playground ([c49bc5eb](https://github.com/genu/nuxt-ui-formwerk/commit/c49bc5eb))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.9

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.8...v0.1.9)

### 🩹 Fixes

- Unwrap the fieldValue ([2ee4b8fb](https://github.com/genu/nuxt-ui-formwerk/commit/2ee4b8fb))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.8

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.7...v0.1.8)

### 💅 Refactors

- Update input bindings to use v-bind for better compatibility with v-model ([664979fd](https://github.com/genu/nuxt-ui-formwerk/commit/664979fd))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.7

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.6...v0.1.7)

### 💅 Refactors

- Update form components to use v-model and improve validation schema ([69cb7962](https://github.com/genu/nuxt-ui-formwerk/commit/69cb7962))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.6

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.5...v0.1.6)

### 🩹 Fixes

- Add ts-ignore comment for FormFieldProps import in Field component ([5bbb10e3](https://github.com/genu/nuxt-ui-formwerk/commit/5bbb10e3))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.5

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.4...v0.1.5)

### 🩹 Fixes

- Update module dependencies and improve error logging in Field component ([1ffc9377](https://github.com/genu/nuxt-ui-formwerk/commit/1ffc9377))

### 📖 Documentation

- Add warning and technical note about experimental module status ([ffa9f37d](https://github.com/genu/nuxt-ui-formwerk/commit/ffa9f37d))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.4

[compare changes](https://github.com/genu/nuxt-ui-formwerk/compare/v0.1.3...v0.1.4)

### 💅 Refactors

- Improve form handling and event management in Field, Form, and Group components ([91dd2851](https://github.com/genu/nuxt-ui-formwerk/commit/91dd2851))

### 🏡 Chore

- Formatting ([710e0165](https://github.com/genu/nuxt-ui-formwerk/commit/710e0165))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.3

### 🏡 Chore

- Initial commit ([b3fb42d0](https://github.com/genu/nuxt-ui-formwerk/commit/b3fb42d0))
- **release:** V0.1.1 ([ba7c804b](https://github.com/genu/nuxt-ui-formwerk/commit/ba7c804b))
- **release:** V0.1.2 ([9d64f301](https://github.com/genu/nuxt-ui-formwerk/commit/9d64f301))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.2

### 🏡 Chore

- Initial commit ([b3fb42d0](https://github.com/genu/nuxt-ui-formwerk/commit/b3fb42d0))
- **release:** V0.1.1 ([ba7c804b](https://github.com/genu/nuxt-ui-formwerk/commit/ba7c804b))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>

## v0.1.1

### 🏡 Chore

- Initial commit ([b3fb42d0](https://github.com/genu/nuxt-ui-formwerk/commit/b3fb42d0))

### ❤️ Contributors

- Eugen Istoc <eugenistoc@gmail.com>
