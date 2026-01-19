import { fileURLToPath } from "node:url"
import { defineNuxtModule, addComponent, createResolver } from "@nuxt/kit"

export type * from "./runtime/types"

export default defineNuxtModule({
  meta: {
    name: "nuxt-ui-formwerk",
  },
  moduleDependencies: {
    "@nuxt/ui": {},
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Get the prefix from Nuxt UI's config, defaulting to 'U'
    const uiOptions = nuxt.options.ui as { prefix?: string } | undefined
    const prefix = uiOptions?.prefix ?? "U"

    // Prevent duplicate @formwerk/core instances which break context sharing between
    // useForm() and useFormContext(). Required for dev playground and pnpm strict mode.
    nuxt.options.alias["@formwerk/core"] = fileURLToPath(import.meta.resolve("@formwerk/core"))

    // Rename Nuxt UI's Form and FormField to NuxtUi* so we can override them
    const componentsToRename = [`${prefix}Form`, `${prefix}FormField`]

    nuxt.hook("components:extend", (components) => {
      for (const name of componentsToRename) {
        const component = components.find((c) => c.pascalName === name && c.filePath?.includes("@nuxt/ui"))
        if (component) {
          component.pascalName = `NuxtUi${name.slice(prefix.length)}`
          component.kebabName = `nuxt-ui-${name
            .slice(prefix.length)
            .replaceAll(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase()}`
        }
      }
    })

    // Register our components with the same prefix
    addComponent({
      name: `${prefix}Form`,
      filePath: resolver.resolve("./runtime/components/Form.vue"),
    })

    addComponent({
      name: `${prefix}FormField`,
      filePath: resolver.resolve("./runtime/components/Field.vue"),
    })

    addComponent({
      name: `${prefix}FormGroup`,
      filePath: resolver.resolve("./runtime/components/Group.vue"),
    })
  },
})
