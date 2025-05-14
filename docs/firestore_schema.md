# Firestore Schema – AnesQuiz “プレα”

```mermaid
erDiagram
    QUESTIONS ||--o{ QUESTION_STATS : has
    TEST_SETS ||--o{ TEST_SET_ITEMS : contains

    QUESTIONS {
      string id PK "an0000001 …"
      string type "single_choice | multiple_choice"
      string[] categories
      string[] tags
      object difficulty
      string  question
      string[] options
      int[]   correct_answers
      string  explanation
      string[] media_urls
      object[] references
      object  metadata
      object  statistics
    }

    QUESTION_STATS {
      string question_id PK FK -> QUESTIONS.id
      int    attempts
      int    correct
      float  correct_rate
      timestamp updated_at
    }

    TEST_SETS {
      string id PK "ts_yyyyMMdd_xxx"
      string title
      string description
      string level "初級 | 中級 | 上級 | mixed"
      int    total_questions
      timestamp created_at
    }

    TEST_SET_ITEMS {
      string test_set_id PK FK -> TEST_SETS.id
      string question_id  PK FK -> QUESTIONS.id
      int    order
    }
```
