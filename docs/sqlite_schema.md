# SQLite Schema – AnesQuiz "プレα"

```mermaid
erDiagram
    %% 既存テーブル
    QUESTIONS {
      string  id PK
      string  type
      string  category_json
      string  tag_json
      string  difficulty
      string  question
      string  option_json
      string  correct_json
      string  explanation
      string  reference_json
      int     first_attempt_correct
      string  first_attempted_at
      int     is_favorite
      int     is_used
      int     last_answer_correct
      string  last_answered_at
      string  last_correct_at
      string  last_incorrect_at
    }

    %% 追加テーブル
    USERS {
      string  id PK
      string  nickname
      string  created_at
      string  last_active_at
    }

    QUESTION_ATTEMPTS {
      string  user_id PK
      string  question_id PK
      string  answered_at PK
      int     is_correct
      int     response_ms
    }

    REVIEW_QUEUE {
      string  user_id PK
      string  question_id PK
      string  next_review_at
      int     interval_days
      real    ease_factor
      int     repetition
      int     last_is_correct
      string  last_answered_at
    }

    LEARNING_DAILY_STATS {
      string  user_id PK
      string  learning_date PK
      int     attempts_total
      int     correct_total
      int     xp_gained
      int     streak_after_today
    }

    BADGES {
      string  id PK
      string  name
      string  description
      string  criteria_json
    }

    USER_BADGES {
      string  user_id PK
      string  badge_id PK
      string  earned_at
    }

    QUESTIONS ||--o{ QUESTION_ATTEMPTS : question_id
    QUESTIONS ||--o{ REVIEW_QUEUE : question_id
    USERS ||--o{ QUESTION_ATTEMPTS : user_id
    USERS ||--o{ REVIEW_QUEUE : user_id
    USERS ||--o{ LEARNING_DAILY_STATS : user_id
    USERS ||--o{ USER_BADGES : user_id
    BADGES ||--o{ USER_BADGES : badge_id
```

- `*_json` と付くカラムには配列やオブジェクトを JSON 文字列として保存します。
- `LearningDailyStats` はその日の解答数や経験値を集計して保存するテーブルです。
- `ReviewQueue` は SuperMemo-2 法に基づき次回復習日を管理します。
- `QuestionAttempts` は 1 回の解答を 1 行として保持し、後から弱点分析に利用します。

