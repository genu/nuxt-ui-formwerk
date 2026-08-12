import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import { createConfigForNuxt } from "@nuxt/eslint-config"

export default createConfigForNuxt(eslintPluginPrettierRecommended, {
  rules: {
    "nuxt/prefer-import-meta": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-namespace": ["off"],
    "@typescript-eslint/no-explicit-any": ["off"],

    // Stylistic
    "@stylistic/quotes": "off",
    "@stylistic/brace-style": "off",
    "@stylistic/arrow-parens": "off",
    "@stylistic/member-delimiter-style": "off",
    "@stylistic/operator-linebreak": "off",
    "@stylistic/indent": "off",
    "@stylistic/quote-props": "off",

    // Vue
    "vue/space-infix-ops": ["error"],
    "vue/multi-word-component-names": "off",
    "vue/require-default-prop": "off",

    // No line-breaking rules here on purpose. `vue/html-closing-bracket-newline`
    // and `vue/max-attributes-per-line` are both disabled by eslint-config-prettier,
    // and re-enabling them put eslint in a fight prettier could not win:
    // `bracketSameLine: true` wants `>` on the last attribute line, the rule wanted
    // it on its own. Files ended up passing one tool or the other, never both, which
    // is why `format:check` drifted and could not be added to CI.
  },
})
