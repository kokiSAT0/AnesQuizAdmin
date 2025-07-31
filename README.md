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

4. Python ツールを利用する場合は仮想環境を作成して依存パッケージを
   インストールしてください。

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` は新しいパッケージを追加後に
`pip freeze > requirements.txt` を実行して最新の状態に保ちます。

初回起動時に自動で SQLite データベースが生成されます。
EAS ビルドでは `eas-build-post-install` スクリプトが走り、`assets/db/app.db` が最新状態に更新されます。

---

## 主な機能

- SQLite に問題データを保存し、解答履歴を管理します。
- テキスト内で `[br]` を使うと画面幅に応じて改行や空白に変換されます。

詳細な DB 構成は [docs/sqlite_schema.md](docs/sqlite_schema.md) を参照してください。

---

## TestFlight 向けビルド手順

Apple Developer Program へ登録し、証明書とプロビジョニングプロファイルを準備しておく必要があります。EAS CLI は対話形式でこれらの情報を登録できますが、自動化したい場合は以下の環境変数を設定してからビルドを実行してください。

- `EXPO_APPLE_APP_SPECIFIC_PASSWORD`: App Store Connect 用のアプリ固有パスワード
- `EXPO_IOS_DIST_P12_PASSWORD`: 配布用証明書（p12）のパスワード

設定が完了したら、次のコマンドで TestFlight 用のビルドを行います。

```bash
# TestFlight 向け iOS ビルド
eas build --profile testflight --platform ios
```

初回ビルド時は Apple ID へのログインやチーム選択を求められます。`--non-interactive` オプションを利用する場合は、上記環境変数をすべて設定したうえで実行してください。

---

## 免責事項

本アプリおよび付属ドキュメントは麻酔科に関する一般的な知識を学習目的で提供するものです。実際の治療や診断に関しては、必ず最新の成書やガイドラインを確認し、医師などの有資格者が判断してください。本プロジェクトの情報を利用したことによって生じる損害について、開発者は一切の責任を負いません。

詳細は [docs/disclaimer.md](docs/disclaimer.md) を参照してください。
