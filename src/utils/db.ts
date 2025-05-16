import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

/** シングルトンで DB を取得（新 API 版） */
export function getDB(): Promise<SQLiteDatabase> {
  dbPromise ??= openDatabaseAsync('app.db');
  return dbPromise;
}

/**
 * PRAGMA user_version が 0 のときだけ
 * Questions テーブルを作成し、user_version を 1 に更新する。
 */
export async function initializeDatabaseIfNeeded(): Promise<void> {
  const db = await getDB(); // ← Promise を await

  // ① 現在の user_version を取得
  const { user_version = 0 } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );

  if (user_version === 0) {
    // ② トランザクション内でテーブル作成 & user_version 更新
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
          correct INTEGER
        );
      `);

      // user_version を 1 に設定
      await db.execAsync(`PRAGMA user_version = 1;`);
    });
  }
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
  return await db.getAllAsync('SELECT * FROM Questions ORDER BY id LIMIT 5;');
}
