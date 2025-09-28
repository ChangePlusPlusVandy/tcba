module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off', // React components don't need explicit return types
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TCBA specific React patterns
    'react/jsx-pascal-case': ['error', { allowAllCaps: false }],
    'react/jsx-no-useless-fragment': 'error',
    'react/self-closing-comp': 'error',

    // Component naming
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'function',
        filter: { regex: '^[A-Z]', match: true }, // React components
        format: ['PascalCase'],
      },
      {
        selector: 'variable',
        filter: { regex: '^[A-Z]', match: true }, // React components as variables
        format: ['PascalCase'],
      },
    ],

    // Import organization
    'sort-imports': ['error', { ignoreDeclarationSort: true }],

    // Code style
    'prettier/prettier': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2020: true,
  },
};