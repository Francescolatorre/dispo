module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/'],
  rules: {
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],
    'no-constant-condition': 'error',
    'no-duplicate-imports': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
