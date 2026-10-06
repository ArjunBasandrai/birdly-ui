import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import typescriptEslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "no-undef": "off",
    },
  },
]);
