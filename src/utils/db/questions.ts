import { getDB } from './connection';
import { logInfo } from '../logger';
import type { QuestionData, Question } from '@/src/types/question';
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
export async function upsertQuestion(data: QuestionData): Promise<void> {
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
export async function getQuestionsLimit5(): Promise<Question[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<SQLiteQuestionRow>(
    'SELECT * FROM Questions WHERE is_used = 1 ORDER BY id LIMIT 5;',
  );
  // 取得した各行を mapRowToQuestion で変換して返す
  return rows.map((row) => mapRowToQuestion(row));
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
  const params: string[] = [];

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
  const params: string[] = [];

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

/* ------------------------------------------------------------------ */
/* SQLite の行データを Question 型へ変換する共通処理                    */
/* ------------------------------------------------------------------ */
export function mapRowToQuestion(row: SQLiteQuestionRow): Question {
  // JSON 文字列で保存している項目をオブジェクトや配列に戻す
  // データベースから取得したままだと文字列のため、ここでパースする
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

  // 共通変換関数に委譲して Question 型に組み立てる
  return mapRowToQuestion(row);
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
  logInfo('update used', { id, flag });
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
