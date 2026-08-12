import { afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

/**
 * formwerk batches validation behind a `window.setTimeout`, and the callback ends
 * in `document.dispatchEvent`. `flushPromises` only drains microtasks, so a test
 * that does not outlast the timer leaves it pending — it then fires against a torn
 * down environment and throws `document is not defined`, which vitest reports as an
 * unhandled rejection and exits non-zero even with every test passing.
 *
 * Long enough to clear formwerk's 10ms batch window.
 */
export const settle = async () => {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 30))
  await flushPromises()
}

// Registered globally so no test can leak a timer by forgetting to await one.
afterEach(settle)
