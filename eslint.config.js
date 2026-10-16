import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["extension/dist/", "release/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },
  {
    files: ["scripts/**", "test/**", "eslint.config.js"],
    languageOptions: { globals: globals.node },
  },
];
