import { getDB } from './connection';
import { getOrCreateUserId } from './user';
import { calcSM2 } from '../sm2';

/* ------------------------------------------------------------------ */
/* 今日復習すべき問題を取得                                           */
/* ------------------------------------------------------------------ */
export interface ReviewItem {
  question_id: string;
  next_review_at: string;
  interval_days: number;
  repetition: number;
  last_is_correct: number;
}

export async function getDueReviewItems(limit = 30): Promise<ReviewItem[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<ReviewItem>(
    `SELECT question_id, next_review_at, interval_days, repetition, last_is_correct
       FROM ReviewQueue
      WHERE user_id = ? AND date(next_review_at) <= date('now')
      ORDER BY next_review_at
      LIMIT ?;`,
    [userId, limit],
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* 出題対象の復習リストを取得                                         */
/* ------------------------------------------------------------------ */
export interface ReviewQuestion extends Question {
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetition: number;
  last_is_correct: number;
}

export async function fetchDueList(limit = 30): Promise<ReviewQuestion[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<any>(
    `SELECT Q.*, R.next_review_at, R.interval_days, R.ease_factor, R.repetition, R.last_is_correct
       FROM Questions Q
       JOIN ReviewQueue R ON R.question_id = Q.id
      WHERE R.user_id = ?
        AND date(R.next_review_at) <= date('now','localtime')
        AND Q.is_used = 1
      ORDER BY R.next_review_at, R.ease_factor ASC
      LIMIT ?;`,
    [userId, limit],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    categories: JSON.parse(r.category_json),
    tags: JSON.parse(r.tag_json),
    difficulty: r.difficulty,
    question: r.question,
    options: JSON.parse(r.option_json),
    correct_answers: JSON.parse(r.correct_json),
    explanation: r.explanation,
    references: JSON.parse(r.reference_json),
    first_attempt_correct:
      r.first_attempt_correct === null ? null : !!r.first_attempt_correct,
    first_attempted_at: r.first_attempted_at,
    is_favorite: !!r.is_favorite,
    is_used: !!r.is_used,
    last_answer_correct: !!r.last_answer_correct,
    last_answered_at: r.last_answered_at,
    last_correct_at: r.last_correct_at,
    last_incorrect_at: r.last_incorrect_at,
    next_review_at: r.next_review_at,
    interval_days: r.interval_days,
    ease_factor: r.ease_factor,
    repetition: r.repetition,
    last_is_correct: r.last_is_correct,
  }));
}

/* ------------------------------------------------------------------ */
/* ReviewQueue を初期化（過去回答済みの問題を登録）                   */
/* ------------------------------------------------------------------ */
export async function seedReviewQueue(): Promise<void> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  await db.runAsync(
    `INSERT INTO ReviewQueue (user_id, question_id, repetition, interval_days, ease_factor, next_review_at, last_is_correct)
     SELECT ?, Q.id, 0, 1, 2.5, date('now'), 0
       FROM Questions Q
       JOIN QuestionAttempts A ON A.question_id = Q.id AND A.user_id = ?
      GROUP BY Q.id
      ON CONFLICT(user_id, question_id) DO NOTHING;`,
    [userId, userId],
  );
}

/* ------------------------------------------------------------------ */
/* 復習結果を記録して次回日時を更新                                   */
/* ------------------------------------------------------------------ */
export async function saveReviewResult(
  questionId: string,
  quality: number,
): Promise<void> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const existing = await db.getFirstAsync<{
    repetition: number;
    interval_days: number;
    ease_factor: number;
  }>(
    `SELECT repetition, interval_days, ease_factor
       FROM ReviewQueue
      WHERE user_id = ? AND question_id = ?;`,
    [userId, questionId],
  );

  const state = existing ?? {
    repetition: 0,
    interval_days: 1,
    ease_factor: 2.5,
  };

  const result = calcSM2(state, quality);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO QuestionAttempts (user_id, question_id, answered_at, is_correct, response_ms)
       VALUES (?, ?, ?, ?, ?);`,
      [userId, questionId, now, quality >= 3 ? 1 : 0, 0],
    );
    await db.runAsync(
      `INSERT INTO ReviewQueue (user_id, question_id, next_review_at, interval_days, ease_factor, repetition, last_is_correct, last_answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, question_id) DO UPDATE SET
         next_review_at=excluded.next_review_at,
         interval_days=excluded.interval_days,
         ease_factor=excluded.ease_factor,
         repetition=excluded.repetition,
         last_is_correct=excluded.last_is_correct,
         last_answered_at=excluded.last_answered_at;`,
      [
        userId,
        questionId,
        result.next_review_at,
        result.interval_days,
        result.ease_factor,
        result.repetition,
        quality >= 3 ? 1 : 0,
        now,
      ],
    );
  });
}
