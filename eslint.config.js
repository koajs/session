// Reuse legacy eslint-config-egg via FlatCompat on ESLint v9 flat config
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nodePlugin from 'eslint-plugin-node';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  js.configs.recommended,
  // TypeScript recommendations (no type-checking for speed)
  ...tseslint.configs.recommended,
  // Bring in the Egg preset (legacy) so behavior stays identical
  ...compat.extends('eslint-config-egg'),
  // Project-specific tweaks
  {
    ignores: [ 'dist/**', 'node_modules/**' ],
  },
  {
    files: [ 'src/**/*.ts', 'test/**/*.ts' ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: (() => {
      // Disable all node/* rules to avoid ESLint v9 incompatibilities from legacy plugin versions pulled by eslint-config-egg
      const disabled = Object.fromEntries(
        Object.keys(nodePlugin.rules ?? {}).map(ruleName => [ `node/${ruleName}`, 'off' ])
      );
      // Align with previous ESLint 8 behavior from eslint-config-egg in this repo
      Object.assign(disabled, {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
        'comma-dangle': 'off',
        'no-prototype-builtins': 'off',
        'no-useless-catch': 'off',
      });
      return disabled;
    })(),
  },
  // Relax rules specifically for tests to mirror prior setup
  {
    files: [ 'test/**/*.ts' ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
];


