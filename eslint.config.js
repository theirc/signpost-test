import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "prefer-const": "off",
      "eslint no-empty": ["error", { "allowEmptyCatch": true }],
      "react-hooks/rules-of-hooks": "off", // Checks rules of Hooks
      "react-hooks/exhaustive-deps": "off", // Checks effect dependencies
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true },],
      "@typescript-eslint/no-unused-vars": ["off"],
      "@typescript-eslint/no-explicit-any": "off"
    },
  },
)
