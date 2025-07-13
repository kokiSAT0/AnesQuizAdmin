/** ReviewQueue テーブルの1行を表す型
 * SuperMemo-2 法に基づく復習管理に利用します
 */
export interface ReviewQueue {
  user_id: string;
  question_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetition: number;
  last_is_correct: number;
  attempts: number;
  last_grade: number | null;
  last_answered_at: string | null;
}
