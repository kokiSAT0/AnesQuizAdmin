import { getDB } from './connection';
import { getOrCreateUserId } from './user';
import { calcSM2 } from '../sm2';
import type { Question } from '@/src/types/question';
import type { SQLiteQuestionRow } from './questions';
import { mapRowToQuestion } from './questions';

/* ------------------------------------------------------------------ */
/* 今日復習すべき問題を取得                                           */
/* ------------------------------------------------------------------ */
export interface ReviewItem {
  question_id: string;
  next_review_at: string;
  interval_days: number;
  repetition: number;
  last_is_correct: number;
  attempts: number;
  last_grade: number | null;
}

export async function getDueReviewItems(limit = 20): Promise<ReviewItem[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<ReviewItem>(
    `SELECT question_id, next_review_at, interval_days, repetition, last_is_correct,
            attempts, last_grade
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
  attempts: number;
  last_grade: number | null;
}

export async function fetchDueList(limit = 20): Promise<ReviewQuestion[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();

  const results: (SQLiteQuestionRow & {
    next_review_at: string;
    interval_days: number;
    ease_factor: number;
    repetition: number;
    last_is_correct: number;
    attempts: number;
    last_grade: number | null;
  })[] = [];
  const added = new Set<string>();
  let remaining = limit;

  // 優先度 P1: 期限到来カード
  const p1 = await db.getAllAsync<
    SQLiteQuestionRow & {
      next_review_at: string;
      interval_days: number;
      ease_factor: number;
      repetition: number;
      last_is_correct: number;
      attempts: number;
      last_grade: number | null;
    }
  >(
    `SELECT Q.*, R.next_review_at, R.interval_days, R.ease_factor, R.repetition,
            R.last_is_correct, R.attempts, R.last_grade
       FROM Questions Q
       JOIN ReviewQueue R ON R.question_id = Q.id
      WHERE R.user_id = ?
        AND date(R.next_review_at) <= date('now','localtime')
        AND Q.is_used = 1
      ORDER BY R.next_review_at
      LIMIT ?;`,
    [userId, remaining],
  );
  for (const row of p1) {
    if (added.has(row.id)) continue;
    results.push(row);
    added.add(row.id);
  }
  remaining = limit - results.length;

  // 優先度 P2: 直近で間違えたカード（上限 50%）
  const p2Limit = Math.min(Math.floor(limit * 0.5), remaining);
  if (p2Limit > 0) {
    const p2 = await db.getAllAsync<
      SQLiteQuestionRow & {
        next_review_at: string;
        interval_days: number;
        ease_factor: number;
        repetition: number;
        last_is_correct: number;
        attempts: number;
        last_grade: number | null;
      }
    >(
      `SELECT Q.*, R.next_review_at, R.interval_days, R.ease_factor, R.repetition,
              R.last_is_correct, R.attempts, R.last_grade
         FROM Questions Q
         JOIN ReviewQueue R ON R.question_id = Q.id
        WHERE R.user_id = ?
          AND R.last_grade < 3
          AND R.attempts > 0
          AND Q.is_used = 1
        ORDER BY R.last_answered_at DESC
        LIMIT ?;`,
      [userId, p2Limit],
    );
    for (const row of p2) {
      if (remaining === 0) break;
      if (added.has(row.id)) continue;
      results.push(row);
      added.add(row.id);
      remaining = limit - results.length;
    }
  }

  // 優先度 P3: その他ランダム
  if (remaining > 0) {
    const p3 = await db.getAllAsync<
      SQLiteQuestionRow & {
        next_review_at: string;
        interval_days: number;
        ease_factor: number;
        repetition: number;
        last_is_correct: number;
        attempts: number;
        last_grade: number | null;
      }
    >(
      `SELECT Q.*, R.next_review_at, R.interval_days, R.ease_factor, R.repetition,
              R.last_is_correct, R.attempts, R.last_grade
         FROM Questions Q
         JOIN ReviewQueue R ON R.question_id = Q.id
        WHERE R.user_id = ?
          AND R.attempts > 0
          AND Q.is_used = 1
        ORDER BY RANDOM()
        LIMIT ?;`,
      [userId, remaining],
    );
    for (const row of p3) {
      if (remaining === 0) break;
      if (added.has(row.id)) continue;
      results.push(row);
      added.add(row.id);
      remaining = limit - results.length;
    }
  }

  // Question 部分は共通関数で変換し、復習用の追加情報を付与する
  return results.map((r) => ({
    ...mapRowToQuestion(r),
    next_review_at: r.next_review_at,
    interval_days: r.interval_days,
    ease_factor: r.ease_factor,
    repetition: r.repetition,
    last_is_correct: r.last_is_correct,
    attempts: r.attempts,
    last_grade: r.last_grade,
  }));
}

/* ------------------------------------------------------------------ */
/* ReviewQueue を初期化（過去回答済みの問題を登録）                   */
/* ------------------------------------------------------------------ */
export async function seedReviewQueue(): Promise<void> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  await db.runAsync(
    `INSERT INTO ReviewQueue (
        user_id, question_id, repetition, interval_days, ease_factor,
        next_review_at, last_is_correct, attempts, last_grade, last_answered_at
     )
     SELECT ?, Q.id, 0, 1, 2.5, date('now'),
            MAX(A.is_correct), COUNT(*),
            CASE WHEN MAX(A.is_correct) = 1 THEN 5 ELSE 2 END,
            MAX(A.answered_at)
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
    attempts: number;
  }>(
    `SELECT repetition, interval_days, ease_factor, attempts
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
  const attempts = (existing?.attempts ?? 0) + 1;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO QuestionAttempts (user_id, question_id, answered_at, is_correct, response_ms)
       VALUES (?, ?, ?, ?, ?);`,
      [userId, questionId, now, quality >= 3 ? 1 : 0, 0],
    );
    await db.runAsync(
      `INSERT INTO ReviewQueue (
         user_id, question_id, next_review_at, interval_days, ease_factor,
         repetition, last_is_correct, last_answered_at, attempts, last_grade
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, question_id) DO UPDATE SET
         next_review_at=excluded.next_review_at,
         interval_days=excluded.interval_days,
         ease_factor=excluded.ease_factor,
         repetition=excluded.repetition,
         last_is_correct=excluded.last_is_correct,
         last_answered_at=excluded.last_answered_at,
         attempts=excluded.attempts,
         last_grade=excluded.last_grade;`,
      [
        userId,
        questionId,
        result.next_review_at,
        result.interval_days,
        result.ease_factor,
        result.repetition,
        quality >= 3 ? 1 : 0,
        now,
        attempts,
        quality,
      ],
    );
  });
}
