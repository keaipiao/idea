import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    ignores: [".next/**", "node_modules/**", "e2e/**", "scripts/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
    },
    rules: {
      // PR-3 ADR-18 XSS 缓解:禁 dangerouslySetInnerHTML
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",
      // 禁 console.log(用 console.warn / console.error 替代)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // 严禁未使用变量(防漏代码)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
