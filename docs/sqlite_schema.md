# SQLite Schema – AnesQuiz "プレα"

```mermaid
erDiagram
    QUESTIONS {
      string  id PK
      string  type
      string  category_json
      string  tag_json
      string  difficulty_level
      float   difficulty_correct_rate
      string  question
      string  option_json
      string  correct_json
      string  explanation
      string  media_json
      string  reference_json
      string  created_at
      string  updated_at
      string  created_by
      int     reviewed
      int     attempts
      int     correct
      int     is_favorite
      int     last_answer_correct
      string  last_answered_at
      string  last_correct_at
      string  last_incorrect_at
    }

    LEARNINGDAILYLOGS {
      string  user_id PK
      string  learning_date PK
      string  answers_json
      string  created_at
      string  updated_at
    }

    QUESTIONS ||--o{ LEARNINGDAILYLOGS : "question_id（JSON 内で参照）"

```

- `Questions` テーブルのみを使用します。
- 各カラムはアプリで扱う `Question` 型（`types/firestore.ts`）に対応しています。
- `*_json` と付くカラムは配列やオブジェクトを **JSON 文字列** として保存しています。
- `reviewed` は **0/1 の整数**で、`boolean` として扱います。
- 統計情報として `attempts` (解答数) と `correct` (正解数) を記録します。

このファイルを参照すれば、SQLite の現在の構造を簡単に確認できます。
