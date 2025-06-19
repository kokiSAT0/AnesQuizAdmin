| ライブラリ / ツール          | 推奨バージョン (2025年)            | 備考                                   |
| ---------------------------- | ---------------------------------- | -------------------------------------- |
| Zustand                      | **5.0.4 以上**（v5 系）            | RN 0.79 対応の安定版                   |
| Firebase (JS SDK)            | **11.x 系列**（例: 11.7.1）        | Expo Go で Firestore 利用可            |
| Jest                         | **29.7.x**（最新安定版）           | 安定版（v30 は大規模アップデート予定） |
| React Native Testing Library | **13.2.0**（v13 系 最新安定）      | React 18/19 & RN 0.78+ 対応            |
| GitHub Actions               | **最新安定**（公式 Actions v3 系） | バージョン番号は固定でなく最新版を推奨 |
| ESLint                       | **9.x 系列**（例: 9.26.0）         | Node 18+ 対応                          |
| Prettier                     | **3.x 系列**（例: 3.5.x）          | Prettier 3 + eslint-plugin-prettier 5  |
| husky                        | **9.x 系列**（例: 9.1.7）          | Git フックの最新安定版                 |
| lint-staged                  | **15.5.x**（最新安定版）           | Node 18+ 対応（v16 直近リリース予定）  |
| TypeScript                   | **5.8.x**（例: 5.8.3）             | Expo 推奨バージョン                    |
| @react-navigation/native     | **7.x 系列**（例: 7.1.9）          | React Navigation 7（最新）             |
| @react-navigation/stack      | **7.x 系列**（例: 7.3.1）          | React Navigation 7 対応版              |

---

## 🛠️ 開発環境セットアップ

### 1. 前提ソフト

| ツール       | 推奨バージョン | インストール例                              |
| ------------ | -------------- | ------------------------------------------- |
| **Node.js**  | ≥ 18.x LTS     | <https://nodejs.org/ja>                     |
| **npm**      | ≥ 10.x         | Node 同梱（`npm i -g npm@latest` で更新可） |
| **Expo CLI** | ≥ 7.x          | `npm i -g expo-cli`                         |
| **Git**      | ≥ 2.40         | <https://git-scm.com/>                      |

> Windows は **PowerShell**、Mac は **zsh** を想定。  
> WSL/ターミナルでも手順は同一です。

### 2. リポジトリ取得

```bash
git clone https://github.com/<YOUR_ORG>/AnesQuiz.git
cd AnesQuiz
npm install

### 3. 環境変数 .env

```

ルートに .env を作成（コミットしない）

Firebase の各種キーを記入してください。

# .env 例

FIREBASE_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FIREBASE_AUTH_DOMAIN="anesquiz.firebaseapp.com"
FIREBASE_PROJECT_ID="anesquiz"
FIREBASE_STORAGE_BUCKET="anesquiz.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="1234567890"
FIREBASE_APP_ID="1:1234567890:web:abcdef123456"

### 4. 開発サーバ起動

# キャッシュクリア付き起動を推奨

npx expo start --clear

---

## ドキュメント

- Firestore の構成: [docs/firestore_schema.md](docs/firestore_schema.md)
- SQLite の構成: [docs/sqlite_schema.md](docs/sqlite_schema.md)

## Expo export / リリース前の準備

`assets/db/app.db` が無いとアプリが正しく動作しません。
`expo export` など本番ビルドの前に以下を実行してください。

```bash
npm run build:sqlite
```
