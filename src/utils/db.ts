import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

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
  return dbPromise;
}

/**
 * PRAGMA user_version が 0 のときだけ
 * Questions テーブルを作成し、user_version を 1 に更新する。
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
          difficulty_level TEXT,
          difficulty_correct_rate REAL,
          question TEXT,
          option_json TEXT,
          correct_json TEXT,
          explanation TEXT,
          media_json TEXT,
          reference_json TEXT,
          created_at TEXT,
          updated_at TEXT,
          created_by TEXT,
          reviewed INTEGER,
          attempts INTEGER,
          correct INTEGER,
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

      // user_version を 1 に設定
      await db.execAsync(`PRAGMA user_version = 1;`);
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
export async function upsertQuestion(docData: any): Promise<void> {
  const db = await getDB();

  const {
    id,
    type,
    categories = [],
    tags = [],
    difficulty = {},
    question,
    options = [],
    correct_answers = [],
    explanation,
    media_urls = [],
    references = [],
    metadata = {},
    statistics = {},
  } = docData;

  const { level, correct_rate } = difficulty;
  const { created_at, updated_at, created_by, reviewed } = metadata;
  const { attempts, correct } = statistics;

  await db.runAsync(
    `
    INSERT INTO Questions (
      id, type,
      category_json, tag_json,
      difficulty_level, difficulty_correct_rate,
      question, option_json, correct_json,
      explanation, media_json, reference_json,
      created_at, updated_at, created_by, reviewed,
      attempts, correct
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      category_json=excluded.category_json,
      tag_json=excluded.tag_json,
      difficulty_level=excluded.difficulty_level,
      difficulty_correct_rate=excluded.difficulty_correct_rate,
      question=excluded.question,
      option_json=excluded.option_json,
      correct_json=excluded.correct_json,
      explanation=excluded.explanation,
      media_json=excluded.media_json,
      reference_json=excluded.reference_json,
      created_at=excluded.created_at,
      updated_at=excluded.updated_at,
      created_by=excluded.created_by,
      reviewed=excluded.reviewed,
      attempts=excluded.attempts,
      correct=excluded.correct
    ;
    `,
    [
      id,
      type,
      JSON.stringify(categories),
      JSON.stringify(tags),
      level ?? null,
      typeof correct_rate === 'number' ? correct_rate : null,
      question ?? '',
      JSON.stringify(options),
      JSON.stringify(correct_answers),
      explanation ?? '',
      JSON.stringify(media_urls),
      JSON.stringify(references),
      created_at ?? '',
      updated_at ?? '',
      created_by ?? '',
      reviewed ? 1 : 0,
      typeof attempts === 'number' ? attempts : 0,
      typeof correct === 'number' ? correct : 0,
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
    `SELECT id FROM Questions WHERE is_used = 1 AND difficulty_level IN (${placeholders}) ORDER BY id;`,
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
    conditions.push(`difficulty_level IN (${placeholders})`);
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
    `SELECT COUNT(*) AS total FROM Questions WHERE is_used = 1 AND difficulty_level IN (${placeholders});`,
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
    conditions.push(`difficulty_level IN (${placeholders})`);
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
  difficulty_level: string | null;
  difficulty_correct_rate: number | null;
  question: string;
  option_json: string;
  correct_json: string;
  explanation: string;
  media_json: string;
  reference_json: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  reviewed: number;
  attempts: number;
  correct: number;
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
    difficulty: {
      level: row.difficulty_level,
      correct_rate: row.difficulty_correct_rate,
    },
    question: row.question,
    options: JSON.parse(row.option_json),
    correct_answers: JSON.parse(row.correct_json),
    explanation: row.explanation,
    media_urls: JSON.parse(row.media_json),
    references: JSON.parse(row.reference_json),
    metadata: {
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      reviewed: !!row.reviewed,
    },
    statistics: {
      attempts: row.attempts,
      correct: row.correct,
    },
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
        SET attempts = attempts + 1,
            correct = correct + ?,
            last_answer_correct = ?,
            last_answered_at = ?,
            last_correct_at = COALESCE(?, last_correct_at),
            last_incorrect_at = COALESCE(?, last_incorrect_at)
      WHERE id = ?;`,
    [isCorrect ? 1 : 0, isCorrect ? 1 : 0, now, lastCorrect, lastIncorrect, id],
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
