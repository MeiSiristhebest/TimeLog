const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', '.expo/**'],
  },
  {
    plugins: {
      'react-compiler': require('eslint-plugin-react-compiler'),
      'react-native-a11y': require('eslint-plugin-react-native-a11y'),
    },
    rules: {
      'react/display-name': 'off',
      'react-compiler/react-compiler': 'error',
      // Prevent direct console usage - use devLog wrapper instead
      'no-console': 'error',
      // Accessibility Rules
      'react-native-a11y/has-accessibility-hint': 'off', // Optional
      'react-native-a11y/has-valid-accessibility-actions': 'error',
      'react-native-a11y/has-valid-accessibility-role': 'error',
      'react-native-a11y/has-valid-accessibility-state': 'error',
      'react-native-a11y/has-valid-accessibility-value': 'error',
      'react-native-a11y/no-nested-touchables': 'error',
    },
  },
  {
    // Allow console in test files and devLogger itself
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest-setup.js', '**/devLogger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      'import/no-unresolved': 'off',
      'no-console': 'off', // Edge functions can use console for server-side logging
    },
  },
]);
