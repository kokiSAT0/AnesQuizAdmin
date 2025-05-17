// eslint.config.js

const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
// const tseslint = require('typescript-eslint'); // ← 使用しない (もしくは必要箇所だけ利用)
const react = require('eslint-plugin-react');
const rn = require('eslint-plugin-react-native');
const rhooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-plugin-prettier');

module.exports = defineConfig([
  // 1) Expo 共通設定 (TS設定含む) ----------------------------------
  ...expo,

  // 2) JS/JSX 共通ルール ---------------------------------------------
  {
    plugins: { react, 'react-native': rn, 'react-hooks': rhooks, prettier },
    rules: {
      'no-console': 'warn',
      'prettier/prettier': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: { react: { version: 'detect' } },
  },

  // 3) TS ファイル専用の追加・上書き (plugin 再宣言なし) --------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      'react-native/no-inline-styles': 'warn',
      // ここに TypeScript のルールを追加
      // 例: '@typescript-eslint/explicit-function-return-type': 'warn'
    },
  },

  // 4) 無視パターン ---------------------------------------------------
  {
    ignores: [
      'dist/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'coverage/**',
      'app/index.tsx', // 個別除外
    ],
  },
]);
