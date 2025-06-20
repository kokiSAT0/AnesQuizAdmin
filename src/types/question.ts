import type { Category } from '@/constants/Categories';

/** Firestore などから取得する問題データの型 */
export interface QuestionData {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  categories: Category[];
  tags: string[];
  difficulty?: '初級' | '中級' | '上級' | null;
  question: string;
  options: string[];
  correct_answers: number[];
  explanation: string;
  references: { title: string; url: string }[];
}

/** SQLite 保存後に使用する拡張情報付きの問題データ */
export interface Question extends QuestionData {
  first_attempt_correct: boolean | null;
  first_attempted_at: string | null;
  is_favorite: boolean;
  is_used: boolean;
  last_answer_correct: boolean;
  last_answered_at: string | null;
  last_correct_at: string | null;
  last_incorrect_at: string | null;
}
