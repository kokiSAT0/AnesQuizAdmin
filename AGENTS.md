# AGENTS.md – AI Coding Guide for Expo Anesthesia Quiz App Development（初心者個人開発向け）

このファイルは **コーディング AI（ChatGPT／Codex 等）** に対する唯一の指示書です。ここに書かれたガイドラインに従ってコード・ドキュメントを生成してください。

---

## 1. 目的

- 麻酔科クイズアプリを **Expo Managed（iOS / Android）** で開発する。

## 2. 技術スタック

- **Node.js:** 20以上安定版
- **Expo SDK:** 53安定版
- **Package Manager:** npm 10+
- **UI ライブラリ:** `react-native-paper`最新版
- **TypeScript:** `"strict": false` で開始（段階的に厳格化）

## 3. リポジトリ構成

```
root
├─ app/                # 画面ファイルと画面遷移（Expo Router 用）
├─ components/         # ボタンなど再利用コンポーネント
├─ constants/          # 色などの定数定義
├─ hooks/              # 自作 React Hooks
├─ src/utils/          # データベース操作などのユーティリティ
├─ theme/              # アプリのテーマ設定
├─ types/              # 型定義置き場
├─ questions/          # JSON 形式のクイズデータ
├─ __tests__/          # Jest のテストコード
├─ docs/               # ドキュメント類
├─ scripts/            # ビルド補助スクリプト
├─ assets/             # 画像や生成した DB などの静的ファイル
└─ ...                 # その他設定ファイル
```

## 4. Git運用

- 基本的に `main` ブランチのみを使用
- コミットメッセージは簡潔で分かりやすく日本語で記載

## 5. ビルドとテスト

- ビルドは手動で実施（Expo Goを利用）
- 最終リリース時のみ `eas build --profile production` を利用

## 6. コード品質

- ESLint + Prettierでコード整形
- ゲーム進行や主要機能は `jest` と `@testing-library/react-native` を使って自動テストを行う

## 7. 環境構築

- 初心者でも環境構築できるように、README.mdに具体的な手順を記載する。

## 8. AIへの指示

### 8.1 フォーマット

- **言語:** 日本語
- **コードブロック:** `tsx / ts / bash` など言語名を指定
- **追加パッケージ:** `npm install` コマンドを併記

### 8.2 コーディングルール

| ルール       | 内容                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| UI           | **必ず `react-native-paper` を使用**。原生 `react-native` コンポーネントはラップして使う |
| 型           | `export type XxxProps = { ... }` を必ず定義                                              |
| エラー処理   | `try / catch` を省略しない。ユーザー通知は `Snackbar` or `Alert`                         |
| データ管理   | `AsyncStorage` を使用                                                                    |
| スタイリング | `StyleSheet.create` に統一。インラインスタイル禁止                                       |

### 8.3 チェックリスト

1. `react-native-paper` を使ったか？
2. 型定義はあるか？
3. コメントは日本語か？
4. 不要 import はないか？

## 9. リリース

- 内部配布: TestFlight (iOS) / Google Play Internal Testing (Android)
- バージョン管理は簡易的にSemVerで実施

---

_Last updated: 2025‑06‑19_
