import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CATEGORIES } from '../constants/Categories';
import { DB_VERSION } from '../constants/DbVersion';

// このスクリプトは JSON 形式の問題集から SQLite データベースを生成します。
// better-sqlite3 は Node.js で SQLite を扱うための高速なライブラリです。

// SQLite ファイルの保存先を決定
const dbDir = path.join(__dirname, '..', 'assets', 'db');
const dbPath = path.join(dbDir, 'app.db');

// ディレクトリが存在しない場合は作成
fs.mkdirSync(dbDir, { recursive: true });

// データベースを開く（存在しなければ作成される）
const db = new Database(dbPath);

// 既存のテーブルを削除してから作成する
// スキーマ変更時に古いテーブルが残っているとINSERTに失敗するため
db.exec('DROP TABLE IF EXISTS Questions;');
db.exec('DROP TABLE IF EXISTS Users;');
db.exec('DROP TABLE IF EXISTS QuestionAttempts;');
db.exec('DROP TABLE IF EXISTS ReviewQueue;');
db.exec('DROP TABLE IF EXISTS LearningDailyStats;');
db.exec('DROP TABLE IF EXISTS Badges;');
db.exec('DROP TABLE IF EXISTS UserBadges;');

// Questions テーブルを作成
// src/utils/db.ts と同じカラム構成にしています
// INTEGER は数値、TEXT は文字列を保存する型です

db.exec(`
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
  is_used INTEGER,
  last_answer_correct INTEGER,
  last_answered_at TEXT,
  last_correct_at TEXT,
  last_incorrect_at TEXT
);
`);

// 以下、追加テーブル定義
db.exec(`
CREATE TABLE IF NOT EXISTS Users (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  created_at TEXT,
  last_active_at TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS QuestionAttempts (
  user_id TEXT,
  question_id TEXT,
  answered_at TEXT,
  is_correct INTEGER,
  response_ms INTEGER,
  PRIMARY KEY (user_id, question_id, answered_at)
);
`);

db.exec(`
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

db.exec(`
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

db.exec(`
CREATE TABLE IF NOT EXISTS Badges (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  criteria_json TEXT
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS UserBadges (
  user_id TEXT,
  badge_id TEXT,
  earned_at TEXT,
  PRIMARY KEY (user_id, badge_id)
);
`);

// プリペアドステートメントを作成
// SQL を一度解析しておくことで高速に実行できます
const insert = db.prepare(`
INSERT INTO Questions (
  id, type,
  category_json, tag_json,
  difficulty,
  question, option_json, correct_json,
  explanation, reference_json,
  first_attempt_correct, first_attempted_at,
  is_favorite, last_answer_correct,
  is_used,
  last_answered_at, last_correct_at, last_incorrect_at
) VALUES (
  @id, @type,
  @category_json, @tag_json,
  @difficulty,
  @question, @option_json, @correct_json,
  @explanation, @reference_json,
  @first_attempt_correct, @first_attempted_at,
  @is_favorite, @last_answer_correct,
  @is_used,
  @last_answered_at, @last_correct_at, @last_incorrect_at
);
`);

// questions ディレクトリにあるすべての JSON ファイルを読み込む
const questionsDir = path.join(__dirname, '..', 'questions');
const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'));
// 定義済みカテゴリを素早く照合するため Set 化
const categorySet = new Set(CATEGORIES);

for (const file of files) {
  const jsonPath = path.join(questionsDir, file);
  // ファイルを読み込んで配列としてパース
  const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as any[];

  for (const q of list) {
    const invalid = (q.categories ?? []).filter(
      (c: string) => !categorySet.has(c),
    );
    if (invalid.length) {
      throw new Error(`Invalid category in ${file}: ${invalid.join(', ')}`);
    }
    // DB のカラムに合わせて値を整形
    const row = {
      id: q.id,
      type: q.type,
      category_json: JSON.stringify(q.categories ?? []),
      tag_json: JSON.stringify(q.tags ?? []),
      // 旧形式 { level: string } にも対応
      difficulty:
        typeof q.difficulty === 'string'
          ? q.difficulty
          : (q.difficulty?.level ?? null),
      question: q.question ?? '',
      option_json: JSON.stringify(q.options ?? []),
      correct_json: JSON.stringify(q.correct_answers ?? []),
      explanation: q.explanation ?? '',
      reference_json: JSON.stringify(q.references ?? []),
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

// DB のバージョンを設定する。これはアプリ側でバージョン管理を行うためのもの。
db.pragma(`user_version = ${DB_VERSION}`);

console.log(`SQLite DB generated at ${dbPath}`);
