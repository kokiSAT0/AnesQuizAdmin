import { getDB } from './connection';
import { getOrCreateUserId } from './user';
export async function updateLearningDailyLog(
  questionId: string,
  isCorrect: boolean,
): Promise<void> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const now = new Date().toISOString();

  const row = await db.getFirstAsync<{ answers_json: string }>(
    'SELECT answers_json FROM LearningDailyLogs WHERE user_id = ? AND learning_date = ?;',
    [userId, today],
  );

  const answers = row ? JSON.parse(row.answers_json) : {};
  const current = answers[questionId] ?? { attempts: 0, correct: 0 };
  current.attempts += 1;
  if (isCorrect) current.correct += 1;
  answers[questionId] = current;

  const jsonStr = JSON.stringify(answers);

  if (row) {
    await db.runAsync(
      'UPDATE LearningDailyLogs SET answers_json = ?, updated_at = ? WHERE user_id = ? AND learning_date = ?;',
      [jsonStr, now, userId, today],
    );
  } else {
    await db.runAsync(
      'INSERT INTO LearningDailyLogs (user_id, learning_date, answers_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
      [userId, today, jsonStr, now, now],
    );
  }
}

/* ------------------------------------------------------------------ */
/* 9. 最新の学習ログを取得（デバッグ用）                              */
/* ------------------------------------------------------------------ */
export interface LearningDailyLog {
  learning_date: string;
  answers: Record<string, { attempts: number; correct: number }>;
  created_at: string;
  updated_at: string;
}

export async function getLatestLearningLogs(
  limit = 7,
): Promise<LearningDailyLog[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<{
    learning_date: string;
    answers_json: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT learning_date, answers_json, created_at, updated_at
       FROM LearningDailyLogs
      WHERE user_id = ?
      ORDER BY learning_date DESC
      LIMIT ?;`,
    [userId, limit],
  );

  return rows.map((r) => ({
    learning_date: r.learning_date,
    answers: JSON.parse(r.answers_json),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}
