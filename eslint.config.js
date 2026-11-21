'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// Root config covers the backend only; client/ has its own eslint.config.js.
module.exports = [
  { ignores: ['client/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
