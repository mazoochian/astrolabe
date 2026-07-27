import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import solid from "eslint-plugin-solid/configs/typescript";

export default [
  { ignores: ["dist/**", ".vinxi/**", ".output/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      solid: solid.plugins.solid,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...solid.rules,
      "no-undef": "off",
    },
  },
];
