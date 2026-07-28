import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // ARCHITECTURE.md §14 rule 1: nothing in the game core may import React.
    //
    // This is the single rule that stops the defect S4.1 fixed from coming back. The
    // simulation has to stay runnable — and unit-testable — with no React and no DOM, and
    // "we'll notice in review" is not a mechanism. It is an error, not a warning, so it
    // fails CI. `src/test/game-core-has-no-react.test.ts` asserts the same thing from the
    // test suite, because `npm run lint` currently has pre-existing failures and a rule
    // buried in a failing command is easy to stop trusting.
    files: ["src/game/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "react-*",
                "*.tsx",
                "@/components/*",
                "@/context/*",
                "@/hooks/*",
                "@/pages/*",
              ],
              message:
                "src/game/ is the React-free game core (ARCHITECTURE.md §14 rule 1). Move UI-facing code to src/components/ and talk to the core through its event emitter.",
            },
          ],
        },
      ],
    },
  },
);
