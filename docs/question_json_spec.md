# 問題データ JSON 仕様

このドキュメントでは、`questions/` ディレクトリに保存する問題データ JSON の構造をまとめます。問題作成時は必ず本仕様に従ってください。

## 必須フィールド

| フィールド名 | 型 | 説明 |
| --- | --- | --- |
| `id` | `string` | `"an"` に7桁の連番を付与した識別子。例: `"an0000041"` |
| `type` | `"single_choice"` or `"multiple_choice"` | 出題形式。単一選択か複数選択かを指定 |
| `categories` | `string[]` | 分野名の配列。`questions/question.md` にある15カテゴリから選択 |
| `tags` | `string[]` | 任意の関連タグ配列 |
| `difficulty` | `"初級"` / `"中級"` / `"上級"` | 学習レベル |
| `question` | `string` | 問題文。必要に応じ `[br]` で改行位置を指定 |
| `options` | `string[]` | 選択肢配列。3〜5個まで |
| `correct_answers` | `number[]` | 正解インデックスの配列。単一選択でも配列で表記 |
| `explanation` | `string` | 正誤判定後に表示する簡潔な解説文 |
| `references` | `{ title: string; url: string }[]` | 参考文献リスト。無い場合は空配列 `[]` |

## 任意フィールド

| フィールド名 | 型 | 説明 |
| --- | --- | --- |
| `pack_id` | `string` | 課金パック識別用 ID。省略時は `"core"` |
| `is_locked` | `number` | 初期ロック状態。`1` でロック、`0` で解放済み。省略時は `0` |

## 作成例

```json
[
  {
    "id": "an0000001",
    "type": "single_choice",
    "categories": ["気道管理"],
    "tags": ["挿管", "成人"],
    "difficulty": "初級",
    "question": "成人女性の標準的な挿管チューブサイズはどれか？",
    "options": ["6.0 mm", "7.0 mm", "8.0 mm"],
    "correct_answers": [1],
    "explanation": "成人女性では 7.0 mm が一般的である。",
    "references": []
  }
]
```

カテゴリの一覧や `[br]` の挿入ルールは [`questions/question.md`](../questions/question.md) を参照してください。
