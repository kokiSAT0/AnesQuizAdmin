import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// このスクリプトは JSON 形式の問題集から SQLite データベースを生成します。
// better-sqlite3 は Node.js で SQLite を扱うための高速なライブラリです。

// SQLite ファイルの保存先を決定
const dbDir = path.join(__dirname, '..', 'assets', 'db');
const dbPath = path.join(dbDir, 'app.db');

// ディレクトリが存在しない場合は作成
fs.mkdirSync(dbDir, { recursive: true });

// データベースを開く（存在しなければ作成される）
const db = new Database(dbPath);

// Questions テーブルを作成
// src/utils/db.ts と同じカラム構成にしています
// INTEGER は数値、TEXT は文字列を保存する型です

db.exec(`
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
  is_used INTEGER,
  last_answer_correct INTEGER,
  last_answered_at TEXT,
  last_correct_at TEXT,
  last_incorrect_at TEXT
);
`);

// プリペアドステートメントを作成
// SQL を一度解析しておくことで高速に実行できます
const insert = db.prepare(`
INSERT INTO Questions (
  id, type,
  category_json, tag_json,
  difficulty_level, difficulty_correct_rate,
  question, option_json, correct_json,
  explanation, media_json, reference_json,
  created_at, updated_at, created_by, reviewed,
  attempts, correct,
  first_attempt_correct, first_attempted_at,
  is_favorite, last_answer_correct,
  is_used,
  last_answered_at, last_correct_at, last_incorrect_at
) VALUES (
  @id, @type,
  @category_json, @tag_json,
  @difficulty_level, @difficulty_correct_rate,
  @question, @option_json, @correct_json,
  @explanation, @media_json, @reference_json,
  @created_at, @updated_at, @created_by, @reviewed,
  @attempts, @correct,
  @first_attempt_correct, @first_attempted_at,
  @is_favorite, @last_answer_correct,
  @is_used,
  @last_answered_at, @last_correct_at, @last_incorrect_at
);
`);

// questions ディレクトリにあるすべての JSON ファイルを読み込む
const questionsDir = path.join(__dirname, '..', 'questions');
const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'));

for (const file of files) {
  const jsonPath = path.join(questionsDir, file);
  // ファイルを読み込んで配列としてパース
  const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as any[];

  for (const q of list) {
    // DB のカラムに合わせて値を整形
    const row = {
      id: q.id,
      type: q.type,
      category_json: JSON.stringify(q.categories ?? []),
      tag_json: JSON.stringify(q.tags ?? []),
      difficulty_level: q.difficulty?.level ?? null,
      difficulty_correct_rate:
        typeof q.difficulty?.correct_rate === 'number'
          ? q.difficulty.correct_rate
          : null,
      question: q.question ?? '',
      option_json: JSON.stringify(q.options ?? []),
      correct_json: JSON.stringify(q.correct_answers ?? []),
      explanation: q.explanation ?? '',
      media_json: JSON.stringify(q.media_urls ?? []),
      reference_json: JSON.stringify(q.references ?? []),
      created_at: q.metadata?.created_at ?? '',
      updated_at: q.metadata?.updated_at ?? '',
      created_by: q.metadata?.created_by ?? '',
      reviewed: q.metadata?.reviewed ? 1 : 0,
      attempts: q.statistics?.attempts ?? 0,
      correct: q.statistics?.correct ?? 0,
      // 以下はアプリ起動後に更新される情報なので初期値を設定
      first_attempt_correct: null,
      first_attempted_at: null,
      is_favorite: 0,
      is_used: 1,
      last_answer_correct: 0,
      last_answered_at: null,
      last_correct_at: null,
      last_incorrect_at: null,
    };
    insert.run(row);
  }
}

console.log(`SQLite DB generated at ${dbPath}`);
