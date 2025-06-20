/** SQLite の学習ログを表す型 */
export interface LearningDailyLog {
  learning_date: string;
  answers: Record<string, { attempts: number; correct: number }>;
  created_at: string;
  updated_at: string;
}
