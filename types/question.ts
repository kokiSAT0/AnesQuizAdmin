// types/question.ts
// クイズデータの基本構造
export interface BaseQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  categories: string[];
  tags: string[];
  // 難易度文字列（初級・中級・上級）
  difficulty: '初級' | '中級' | '上級';
  question: string;
  options: string[];
  correct_answers: number[];
  explanation: string;
  references: { title: string; url: string }[];
}

// SQLite 上で保持する追加情報
export interface Question extends BaseQuestion {
  /** 初回解答が正解かどうか。未解答なら null */
  first_attempt_correct: boolean | null;
  /** 初回解答日時 (ISO 文字列)。未解答なら null */
  first_attempted_at: string | null;
  /** お気に入り登録フラグ */
  is_favorite: boolean;
  /** 使用対象かどうか */
  is_used: boolean;
  /** 直近の回答が正解かどうか */
  last_answer_correct: boolean;
  /** 最後に回答した日時 (ISO 文字列) */
  last_answered_at: string | null;
  /** 最後に正解した日時 (ISO 文字列) */
  last_correct_at: string | null;
  /** 最後に不正解だった日時 (ISO 8601 文字列) */
  last_incorrect_at: string | null;
}
