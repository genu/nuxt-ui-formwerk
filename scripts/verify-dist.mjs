#!/usr/bin/env node
/**
 * Verifies the declaration output of `pnpm prepack`.
 *
 * `nuxt-module-build` exits 0 even when the declaration emitter fails, and
 * `vue-sfc-transformer` then writes zero-byte `.d.ts` files. Consumers get
 * `TS2306: not a module` from a build that CI reported as green.
 *
 * This checks the artifacts rather than the build log: every SFC under
 * `src/runtime/components/` must have a non-empty `.vue.d.ts` and `.d.vue.ts`
 * in `dist/`, and no declaration file anywhere in `dist/` may be empty.
 */

import { readdir, readFile, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const dist = join(root, "dist")
const componentsSrc = join(root, "src", "runtime", "components")
const componentsDist = join(dist, "runtime", "components")

const DECLARATION_RE = /\.d\.(ts|mts|cts)$|\.d\.vue\.ts$/

const errors = []
const checked = []

const sizeOf = async (path) => {
  try {
    return (await stat(path)).size
  } catch {
    return null
  }
}

const requireNonEmpty = async (path) => {
  const size = await sizeOf(path)
  const label = relative(root, path)

  if (size === null) errors.push(`missing declaration: ${label}`)
  else if (size === 0) errors.push(`empty declaration: ${label}`)
  else checked.push(`${label} (${size} B)`)
}

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(path)))
    else files.push(path)
  }

  return files
}

if ((await sizeOf(dist)) === null) {
  console.error("✖ dist/ does not exist — run `pnpm prepack` first")
  process.exit(1)
}

// `dev:prepare` leaves a jiti stub in dist/ that emits no declarations, so
// verifying it would report every file as missing for the wrong reason.
const moduleEntry = join(dist, "module.mjs")
if ((await sizeOf(moduleEntry)) !== null && (await readFile(moduleEntry, "utf8")).includes("createJiti")) {
  console.error("✖ dist/ holds a stub build from `dev:prepare` — run `pnpm prepack` before verifying")
  process.exit(1)
}

// Entry points the published package exports.
await requireNonEmpty(join(dist, "types.d.mts"))
await requireNonEmpty(join(dist, "module.d.mts"))

// Every component SFC must emit both declaration shapes.
const components = (await readdir(componentsSrc)).filter((name) => name.endsWith(".vue"))

if (components.length === 0) {
  console.error(`✖ no components found in ${relative(root, componentsSrc)}`)
  process.exit(1)
}

for (const component of components.sort()) {
  const name = component.replace(/\.vue$/, "")
  await requireNonEmpty(join(componentsDist, `${name}.vue.d.ts`))
  await requireNonEmpty(join(componentsDist, `${name}.d.vue.ts`))
}

// Nothing else in dist/ may be an empty declaration either.
for (const path of await walk(dist)) {
  if (!DECLARATION_RE.test(path)) continue
  if ((await sizeOf(path)) === 0) {
    const label = `empty declaration: ${relative(root, path)}`
    if (!errors.includes(label)) errors.push(label)
  }
}

if (errors.length > 0) {
  console.error(`✖ dist verification failed (${errors.length} problem(s)):`)
  for (const error of errors) console.error(`  - ${error}`)
  console.error("\nThe declaration emitter failed silently. Re-run `pnpm prepack` and check its output for `error TS`.")
  process.exit(1)
}

console.log(`✔ dist verified — ${checked.length} non-empty declaration(s):`)
for (const entry of checked) console.log(`  - ${entry}`)
