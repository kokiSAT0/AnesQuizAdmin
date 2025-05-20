// types/firestore.ts
export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  categories: string[];
  tags: string[];
  difficulty: { level: '初級' | '中級' | '上級'; correct_rate: number };
  question: string;
  options: string[];
  correct_answers: number[];
  explanation: string;
  media_urls: string[];
  references: { title: string; url: string }[];
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: 'koki';
    reviewed: boolean;
  };
  statistics: { attempts: number; correct: number };
  /** お気に入り登録フラグ */
  is_favorite: boolean;
  /** 直近の回答が正解かどうか */
  last_answer_correct: boolean;
  /** 最後に回答した日時 (ISO 文字列) */
  last_answered_at: string | null;
  /** 最後に正解した日時 (ISO 文字列) */
  last_correct_at: string | null;
  /** 最後に不正解だった日時 (ISO 文字列) */
  last_incorrect_at: string | null;
}
