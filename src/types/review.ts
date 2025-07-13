import type { Question } from './question';

/** 復習リストの項目を表す型 */
export interface ReviewItem {
  question_id: string;
  next_review_at: string;
  interval_days: number;
  repetition: number;
  last_is_correct: number;
  attempts: number;
  last_grade: number | null;
}

/** 復習画面で使用する問題データの型 */
export interface ReviewQuestion extends Question {
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetition: number;
  last_is_correct: number;
  attempts: number;
  last_grade: number | null;
}
