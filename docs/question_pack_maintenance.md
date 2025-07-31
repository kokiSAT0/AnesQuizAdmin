# 問題追加・保守手順

アプリに新しい問題パックを追加する際の基本的な流れをまとめます。問題データは JSON 形式で管理し、ビルド時に SQLite DB へ変換します。以下の手順に従えば、アップデート時に既存ユーザーのデータを保ったまま新規問題を取り込めます。

## 1. 問題 JSON ファイルの用意

1. `questions/` ディレクトリに、[`questions/question.md`](../questions/question.md) のガイドラインに沿った JSON ファイルを配置します。
2. ファイル名は最後の問題番号を 7 桁で記載したものにしてください。（例: `0000050.json`）
3. 各問題に `pack_id` と `is_locked` を設定すると、アプリ内課金で解放するパックを作成できます。

```bash
# 例: questions/0000050.json に追加
[
  {
    "id": "an0000050",
    "type": "single_choice",
    "categories": ["麻酔薬"],
    "tags": ["新薬"],
    "difficulty": "中級",
    "question": "新規麻酔薬の投与量は?",
    "options": ["10mg", "20mg", "30mg"],
    "correct_answers": [1],
    "explanation": "一般的な初期投与量は20mg。",
    "references": [],
    "pack_id": "pack1",  # このパックを購入するとアンロックされる
    "is_locked": 1        # 初期状態ではロック
  }
]
```

## 2. SQLite DB の再生成

問題ファイルを追加したら、以下のスクリプトで `assets/db/app.db` を更新します。

```bash
npm run build:sqlite  # scripts/buildSqlite.ts が実行される
```

- `assets/db/app.db` が生成・更新されます。
- EAS ビルドでも `eas-build-post-install` スクリプトが自動的に実行され、`assets/db/app.db` が最新化されます。
- 既存の DB を削除するわけではないので、Git 管理下の `assets/db` を一緒にコミットしてください。

## 3. DB バージョンの更新 (必要に応じて)

新しいパックをリリースしてユーザー端末へ配布する際、`constants/DbVersion.ts` の `DB_VERSION` をインクリメントすると、アプリ起動時に古い DB へ自動マージされます。マージ処理では不足カラムの追加と新規問題の取込が行われます。

```ts
export const DB_VERSION = 5;  // 例: 1増やす
```

## 4. コミットとリリース

1. 追加した JSON、生成された SQLite DB、DB_VERSION の変更をすべて Git に追加します。
2. `npm test` でユニットテストを実行し、エラーが無いことを確認します。
3. 問題がなければコミットしてリリースします。アプリ公開後、購入処理 `purchasePack()` を通じて新規パックが解放されます。

```bash
npm test  # Jest によるテスト
```

以上で問題追加の基本的な保守フローは完了です。新しいパックを追加する際は、上記手順を繰り返してください。
