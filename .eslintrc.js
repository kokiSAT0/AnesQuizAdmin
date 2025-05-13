// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    // 基本の推奨ルール
    "eslint:recommended",

    // React用のルール
    "plugin:react/recommended",

    // React Native専用の追加ルール
    "plugin:react-native/all",

    // Expo向けのルールセット（eslint-config-expo）
    "expo",

    // Prettier連携: Prettierルールを最後に適用して、他ルールと競合しないようにする
    "plugin:prettier/recommended"
  ],
  plugins: [
    "react",
    "react-native",
    "prettier"
  ],
  parserOptions: {
    // 可能なら latest / ES2020 以上に
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  // JSXを解釈するため
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    "react-native/react-native": true
  },
  rules: {
    // 必要に応じてルールを追加・上書き
    // 例: console.logをwarningに
    "no-console": "warn",

    // Prettier関連: エラーとして扱いたければ "error" に
    "prettier/prettier": "warn"
  }
};
