# AnesQuizAdmin

麻酔科クイズを管理する Expo アプリです。ローカル SQLite で問題と学習状況を保存します。

| ライブラリ / ツール          | 推奨バージョン (2025年)            | 備考 |
| ---------------------------- | ---------------------------------- | ---------------------------- |
| Zustand                      | **5.0.4 以上**（v5 系）            | RN 0.79 対応の安定版 |
| Jest                         | **29.7.x**（最新安定版）           | 安定版（v30 は大規模アップデート予定） |
| React Native Testing Library | **13.2.0**（v13 系 最新安定）      | React 18/19 & RN 0.78+ 対応 |
| ESLint                       | **9.x 系列**（例: 9.26.0）         | Node 18+ 対応 |
| Prettier                     | **3.x 系列**（例: 3.5.x）          | Prettier 3 + eslint-plugin-prettier 5 |
| husky                        | **9.x 系列**（例: 9.1.7）          | Git フックの最新安定版 |
| lint-staged                  | **15.5.x**（最新安定版）           | Node 18+ 対応（v16 直近リリース予定） |
| TypeScript                   | **5.8.x**（例: 5.8.3）             | Expo 推奨バージョン |
| @react-navigation/native     | **7.x 系列**（例: 7.1.9）          | React Navigation 7（最新） |
| @react-navigation/stack      | **7.x 系列**（例: 7.3.1）          | React Navigation 7 対応版 |

---

## 🛠️ 最低限のセットアップ

1. **Node.js** 20 LTS をインストールしてください。
2. リポジトリを取得します。

```bash
git clone https://github.com/<YOUR_ORG>/AnesQuizAdmin.git
cd AnesQuizAdmin
npm ci
```

3. 開発サーバを起動します。

```bash
npm start
```

初回起動時に自動で SQLite データベースが生成されます。

---

## 主な機能

- SQLite に問題データを保存し、解答履歴を管理します。
- テキスト内で `[br]` を使うと画面幅に応じて改行や空白に変換されます。

詳細な DB 構成は [docs/sqlite_schema.md](docs/sqlite_schema.md) を参照してください。
