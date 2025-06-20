import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { DB_VERSION } from '../../constants/DbVersion';

import type { Question } from '../../types/question';
import { calcSM2 } from './sm2';
/** UUID を簡易生成するヘルパー */
function generateUUID(): string {
  // x と y をランダムな 16 進数に置き換えて UUID v4 形式の文字列を作る
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let dbPromise: Promise<SQLiteDatabase> | null = null;
let dbCopiedFromAsset = false;

/* ------------------------------------------------------------------ */
/* DB ファイルを削除して次回起動時に再コピーさせる                    */
/* ------------------------------------------------------------------ */
export async function deleteDatabase(): Promise<void> {
  const sqlitePath = `${FileSystem.documentDirectory}SQLite/app.db`;
  const info = await FileSystem.getInfoAsync(sqlitePath);
  if (info.exists) {
    // FileSystem.deleteAsync は指定したファイルを非同期で削除します
    await FileSystem.deleteAsync(sqlitePath, { idempotent: true });
  }
  // 次回 getDB 呼び出し時に新しい DB をコピーさせるためリセット
  dbPromise = null;
  dbCopiedFromAsset = false;
}

/** シングルトンで DB を取得（新 API 版） */
export async function getDB(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    const sqlitePath = `${FileSystem.documentDirectory}SQLite/app.db`;
    const info = await FileSystem.getInfoAsync(sqlitePath);
    if (!info.exists) {
      // Expo が使う SQLite フォルダを作成（存在しない場合）
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}SQLite`,
        { intermediates: true },
      );

      // アセットから DB ファイルをコピー
      const asset = Asset.fromModule(require('../../assets/db/app.db'));
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error('app.db asset not found');
      }
      await FileSystem.copyAsync({ from: asset.localUri, to: sqlitePath });
      dbCopiedFromAsset = true;
    }
    dbPromise = openDatabaseAsync('app.db');
  }
  const db = await dbPromise;

  // DB バージョンをチェックし、古い場合は削除して再コピーする
  const { user_version = 0 } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  if (user_version < DB_VERSION) {
    await deleteDatabase();
    return getDB();
  }

  return db;
}

/**
 * PRAGMA user_version が 0 のときだけ
 * Questions テーブルを作成し、user_version を DB_VERSION に更新する。
 */
export async function initializeDatabaseIfNeeded(): Promise<void> {
  const db = await getDB(); // ← Promise を await

  // DB 初期化開始

  // ① 現在の user_version を取得
  const { user_version = 0 } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );

  if (dbCopiedFromAsset) {
    // 事前生成された DB を使っている場合、テーブル作成処理を省略
  } else if (user_version === 0) {
    // ② トランザクション内でテーブル作成 & user_version 更新
    // トランザクションとは複数の処理をひとまとめにして、途中で失敗したら全部なかったことにする仕組みです
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Questions (
          id TEXT PRIMARY KEY,
          type TEXT,
          category_json TEXT,
          tag_json TEXT,
          difficulty TEXT,
          question TEXT,
          option_json TEXT,
          correct_json TEXT,
          explanation TEXT,
          reference_json TEXT,
          first_attempt_correct INTEGER,
          first_attempted_at TEXT,
          is_favorite INTEGER,
          is_used INTEGER DEFAULT 1,
          last_answer_correct INTEGER,
          last_answered_at TEXT,
          last_correct_at TEXT,
          last_incorrect_at TEXT
        );
      `);

      // user_version を更新（DB_VERSION は定数で管理）
      await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
    });
  } else {
    // 既に初期化済みの場合
  }

  // AppInfo テーブルを作成（存在しない場合のみ）
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS AppInfo (
      user_id TEXT PRIMARY KEY,
      created_at TEXT
    );
  `);

  // Users テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      created_at TEXT,
      last_active_at TEXT
    );
  `);

  // QuestionAttempts テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS QuestionAttempts (
      user_id TEXT,
      question_id TEXT,
      answered_at TEXT,
      is_correct INTEGER,
      response_ms INTEGER,
      PRIMARY KEY (user_id, question_id, answered_at)
    );
  `);

  // ReviewQueue テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ReviewQueue (
      user_id TEXT,
      question_id TEXT,
      next_review_at TEXT,
      interval_days INTEGER,
      ease_factor REAL,
      repetition INTEGER,
      last_is_correct INTEGER,
      last_answered_at TEXT,
      PRIMARY KEY (user_id, question_id)
    );
  `);

  // LearningDailyStats テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS LearningDailyStats (
      user_id TEXT,
      learning_date TEXT,
      attempts_total INTEGER,
      correct_total INTEGER,
      xp_gained INTEGER,
      streak_after_today INTEGER,
      PRIMARY KEY (user_id, learning_date)
    );
  `);

  // Badges テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Badges (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      criteria_json TEXT
    );
  `);

  // UserBadges テーブル
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS UserBadges (
      user_id TEXT,
      badge_id TEXT,
      earned_at TEXT,
      PRIMARY KEY (user_id, badge_id)
    );
  `);

  // LearningDailyLogs テーブルを必ず作成しておく（古い DB 対策）
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS LearningDailyLogs (
        user_id TEXT,
        learning_date TEXT,
        answers_json TEXT,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (user_id, learning_date)
      );
    `);
}

/* ------------------------------------------------------------------ */
/* 1. updated_at の最大値を取得                                        */
/* ------------------------------------------------------------------ */
export async function getMaxUpdatedAt(): Promise<string> {
  const db = await getDB();

  // 空テーブルなら user_version 同様に undefined が返る
  const row = await db.getFirstAsync<{ maxTime: string | null }>(
    'SELECT MAX(updated_at) AS maxTime FROM Questions;',
  );

  return row?.maxTime ?? '1970-01-01T00:00:00Z';
}

/* ------------------------------------------------------------------ */
/* 2. Firestore → SQLite UPSERT                                       */
/* ------------------------------------------------------------------ */
export async function upsertQuestion(data: any): Promise<void> {
  const db = await getDB();

  const {
    id,
    type,
    categories = [],
    tags = [],
    difficulty,
    question,
    options = [],
    correct_answers = [],
    explanation,
    references = [],
  } = data;

  await db.runAsync(
    `
    INSERT INTO Questions (
      id, type,
      category_json, tag_json,
      difficulty,
      question, option_json, correct_json,
      explanation, reference_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      category_json=excluded.category_json,
      tag_json=excluded.tag_json,
      difficulty=excluded.difficulty,
      question=excluded.question,
      option_json=excluded.option_json,
      correct_json=excluded.correct_json,
      explanation=excluded.explanation,
      reference_json=excluded.reference_json
    ;
    `,
    [
      id,
      type,
      JSON.stringify(categories),
      JSON.stringify(tags),
      difficulty ?? null,
      question ?? '',
      JSON.stringify(options),
      JSON.stringify(correct_answers),
      explanation ?? '',
      JSON.stringify(references),
    ],
  );
}

/* ------------------------------------------------------------------ */
/* 3. 総レコード数を取得                                               */
/* ------------------------------------------------------------------ */
export async function getQuestionsCount(): Promise<number> {
  const db = await getDB();
  const { total } = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM Questions;',
  );
  return total;
}

/* ------------------------------------------------------------------ */
/* 4. 先頭 5 件を取得                                                  */
/* ------------------------------------------------------------------ */
export async function getQuestionsLimit5(): Promise<any[]> {
  const db = await getDB();
  return await db.getAllAsync(
    'SELECT * FROM Questions WHERE is_used = 1 ORDER BY id LIMIT 5;',
  );
}

/* ------------------------------------------------------------------ */
/* 5. すべての問題IDを取得                                             */
/* ------------------------------------------------------------------ */
export async function getAllQuestionIds(): Promise<string[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM Questions WHERE is_used = 1 ORDER BY id;',
  );
  return rows.map((r) => r.id);
}

/* ------------------------------------------------------------------ */
/* 5-1. 難易度を指定して問題IDを取得                                   */
/* ------------------------------------------------------------------ */
export async function getQuestionIdsByDifficulty(
  levels: string[],
): Promise<string[]> {
  const db = await getDB();

  if (levels.length === 0) {
    const rows = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM Questions WHERE is_used = 1 ORDER BY id;',
    );
    return rows.map((r) => r.id);
  }

  const placeholders = levels.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM Questions WHERE is_used = 1 AND difficulty IN (${placeholders}) ORDER BY id;`,
    levels,
  );
  return rows.map((r) => r.id);
}

/* ------------------------------------------------------------------ */
/* 5-1b. レベルとカテゴリを指定して問題IDを取得                         */
/* ------------------------------------------------------------------ */
export async function getQuestionIdsByFilter(
  levels: string[],
  categories: string[],
  favoriteOnly = false,
): Promise<string[]> {
  const db = await getDB();

  // レベルまたはカテゴリが未選択の場合は空配列を返す
  // AND 条件を満たす組み合わせが存在しないため
  if (levels.length === 0 || categories.length === 0) {
    return [];
  }

  const conditions: string[] = [];
  const params: any[] = [];

  // 常に使用中の問題のみカウント
  conditions.push('is_used = 1');

  // 使用中の問題のみ取得
  conditions.push('is_used = 1');

  if (levels.length) {
    const placeholders = levels.map(() => '?').join(', ');
    conditions.push(`difficulty IN (${placeholders})`);
    params.push(...levels);
  }

  if (categories.length) {
    const placeholders = categories.map(() => '?').join(', ');
    conditions.push(
      `EXISTS (SELECT 1 FROM json_each(Questions.category_json) WHERE value IN (${placeholders}))`,
    );
    params.push(...categories);
  }

  if (favoriteOnly) {
    conditions.push('is_favorite = 1');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM Questions ${where} ORDER BY id;`,
    params,
  );
  const ids = rows.map((r) => r.id);
  return ids;
}

/* ------------------------------------------------------------------ */
/* 5-2. 難易度を指定して問題数をカウントする                           */
/* ------------------------------------------------------------------ */
export async function countQuestionsByDifficulty(
  levels: string[],
): Promise<number> {
  const db = await getDB();

  // 難易度が選択されていない場合は全件数を返す
  if (levels.length === 0) {
    const { total } = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM Questions WHERE is_used = 1;',
    );
    return total;
  }

  // IN 句の ? をレベルの個数分並べる
  const placeholders = levels.map(() => '?').join(', ');
  const { total } = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Questions WHERE is_used = 1 AND difficulty IN (${placeholders});`,
    levels,
  );
  return total;
}

/* ------------------------------------------------------------------ */
/* 5-2b. レベルとカテゴリを指定して問題数をカウントする                 */
/* ------------------------------------------------------------------ */
export async function countQuestionsByFilter(
  levels: string[],
  categories: string[],
  favoriteOnly = false,
): Promise<number> {
  const db = await getDB();

  // レベルかカテゴリが未選択なら 0 件とする
  if (levels.length === 0 || categories.length === 0) {
    return 0;
  }

  const conditions: string[] = [];
  const params: any[] = [];

  if (levels.length) {
    const placeholders = levels.map(() => '?').join(', ');
    conditions.push(`difficulty IN (${placeholders})`);
    params.push(...levels);
  }

  if (categories.length) {
    const placeholders = categories.map(() => '?').join(', ');
    conditions.push(
      `EXISTS (SELECT 1 FROM json_each(Questions.category_json) WHERE value IN (${placeholders}))`,
    );
    params.push(...categories);
  }

  if (favoriteOnly) {
    conditions.push('is_favorite = 1');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { total } = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Questions ${where};`,
    params,
  );
  return total;
}

/* ------------------------------------------------------------------ */
/* 6. ID を指定して問題を取得                                          */
/* ------------------------------------------------------------------ */
export interface SQLiteQuestionRow {
  id: string;
  type: string;
  category_json: string;
  tag_json: string;
  difficulty: string | null;
  question: string;
  option_json: string;
  correct_json: string;
  explanation: string;
  reference_json: string;
  first_attempt_correct: number | null; // 初回解答が正解かどうか（0/1）
  first_attempted_at: string | null; // 初回解答日時
  is_favorite: number; // お気に入り登録されているかどうか（0/1）
  is_used: number; // 出題対象として使うかどうか（0/1）
  last_answer_correct: number; // 直近の回答が正解かどうか（0/1）
  last_answered_at: string | null; // 最後に回答した日時
  last_correct_at: string | null; // 最後に正解した日時
  last_incorrect_at: string | null; // 最後に不正解だった日時
}

export async function getQuestionById(id: string) {
  const db = await getDB();
  const row = await db.getFirstAsync<SQLiteQuestionRow>(
    'SELECT * FROM Questions WHERE id = ?;',
    [id],
  );
  if (!row) {
    // 該当する問題が無い
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    categories: JSON.parse(row.category_json),
    tags: JSON.parse(row.tag_json),
    difficulty: row.difficulty,
    question: row.question,
    options: JSON.parse(row.option_json),
    correct_answers: JSON.parse(row.correct_json),
    explanation: row.explanation,
    references: JSON.parse(row.reference_json),
    first_attempt_correct:
      row.first_attempt_correct === null ? null : !!row.first_attempt_correct,
    first_attempted_at: row.first_attempted_at,
    is_favorite: !!row.is_favorite,
    is_used: !!row.is_used,
    last_answer_correct: !!row.last_answer_correct,
    last_answered_at: row.last_answered_at,
    last_correct_at: row.last_correct_at,
    last_incorrect_at: row.last_incorrect_at,
  };
}

/* ------------------------------------------------------------------ */
/* 7. お気に入りフラグを更新                                          */
/* ------------------------------------------------------------------ */
export async function updateFavorite(id: string, flag: boolean): Promise<void> {
  const db = await getDB();
  await db.runAsync('UPDATE Questions SET is_favorite = ? WHERE id = ?;', [
    flag ? 1 : 0,
    id,
  ]);
}

/* ------------------------------------------------------------------ */
/* 7-1. 使用フラグを更新                                               */
/* ------------------------------------------------------------------ */
export async function updateUsed(id: string, flag: boolean): Promise<void> {
  const db = await getDB();
  console.info('update used', { id, flag });
  await db.runAsync('UPDATE Questions SET is_used = ? WHERE id = ?;', [
    flag ? 1 : 0,
    id,
  ]);
}

/* ------------------------------------------------------------------ */
/* 8. 回答結果を Questions テーブルに記録                              */
/* ------------------------------------------------------------------ */
export async function recordAnswer(
  id: string,
  isCorrect: boolean,
): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const lastCorrect = isCorrect ? now : null;
  const lastIncorrect = isCorrect ? null : now;
  await db.runAsync(
    `UPDATE Questions
        SET last_answer_correct = ?,
            last_answered_at = ?,
            last_correct_at = COALESCE(?, last_correct_at),
            last_incorrect_at = COALESCE(?, last_incorrect_at)
      WHERE id = ?;`,
    [isCorrect ? 1 : 0, now, lastCorrect, lastIncorrect, id],
  );
}

/* ------------------------------------------------------------------ */
/* 8-1. 初回解答を記録                                                */
/* ------------------------------------------------------------------ */
export async function recordFirstAttempt(
  id: string,
  isCorrect: boolean,
): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE Questions
        SET first_attempt_correct = ?,
            first_attempted_at = ?
      WHERE id = ? AND first_attempt_correct IS NULL;`,
    [isCorrect ? 1 : 0, now, id],
  );
}

/* ------------------------------------------------------------------ */
/* 7. user_id を取得（なければ生成）                                   */
/* ------------------------------------------------------------------ */
export async function getOrCreateUserId(): Promise<string> {
  const db = await getDB();

  // 既に保存されている user_id を取得
  const row = await db.getFirstAsync<{ user_id: string }>(
    'SELECT user_id FROM AppInfo LIMIT 1;',
  );

  if (row?.user_id) {
    return row.user_id;
  }

  // 無ければ生成して保存
  const newId = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO AppInfo (user_id, created_at) VALUES (?, ?);',
    [newId, now],
  );

  return newId;
}

/* ------------------------------------------------------------------ */
/* 8. 解答ログを LearningDailyLogs に記録                              */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* カテゴリごとの正答率を計算                                         */
/* ------------------------------------------------------------------ */
export interface CategoryStat {
  category: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export async function getCategoryStats(): Promise<CategoryStat[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();

  // 学習ログをすべて取得
  const logs = await db.getAllAsync<{
    learning_date: string;
    answers_json: string;
  }>(
    'SELECT learning_date, answers_json FROM LearningDailyLogs WHERE user_id = ?;',
    [userId],
  );

  // 質問ID -> カテゴリ一覧 のマップを事前取得
  const qRows = await db.getAllAsync<{ id: string; category_json: string }>(
    'SELECT id, category_json FROM Questions;',
  );
  const categoryMap: Record<string, string[]> = {};
  for (const row of qRows) {
    categoryMap[row.id] = JSON.parse(row.category_json);
  }

  const stats: Record<string, { attempts: number; correct: number }> = {};

  for (const log of logs) {
    const answers = JSON.parse(log.answers_json) as Record<
      string,
      { attempts: number; correct: number }
    >;
    for (const [qid, data] of Object.entries(answers)) {
      const cats = categoryMap[qid];
      if (!cats) continue;
      for (const c of cats) {
        if (!stats[c]) stats[c] = { attempts: 0, correct: 0 };
        stats[c].attempts += data.attempts;
        stats[c].correct += data.correct;
      }
    }
  }

  return Object.entries(stats).map(([category, { attempts, correct }]) => ({
    category,
    attempts,
    correct,
    accuracy: attempts > 0 ? correct / attempts : 0,
  }));
}

/* ------------------------------------------------------------------ */
/* 連続学習日数（ストリーク）を計算                                   */
/* ------------------------------------------------------------------ */
export async function getLearningStreak(): Promise<number> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<{ learning_date: string }>(
    'SELECT learning_date FROM LearningDailyLogs WHERE user_id = ? ORDER BY learning_date DESC;',
    [userId],
  );
  const dates = new Set(rows.map((r) => r.learning_date));

  let streak = 0;
  let current = new Date();

  while (true) {
    const yyyy = current.toISOString().slice(0, 10);
    if (dates.has(yyyy)) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/* ------------------------------------------------------------------ */
/* 獲得済みバッジ一覧を取得                                           */
/* ------------------------------------------------------------------ */
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earned_at?: string;
}

export async function getAllBadgesWithStatus(): Promise<BadgeInfo[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    earned_at: string | null;
  }>(
    `SELECT b.id, b.name, b.description, ub.earned_at
       FROM Badges b
  LEFT JOIN UserBadges ub ON b.id = ub.badge_id AND ub.user_id = ?
      ORDER BY b.id;`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    earned: !!r.earned_at,
    earned_at: r.earned_at ?? undefined,
  }));
}

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
