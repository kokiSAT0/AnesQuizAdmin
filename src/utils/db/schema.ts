// DBテーブル定義をまとめた配列
// build スクリプトやアプリ本体で共通利用します
export const TABLE_SCHEMAS: string[] = [
  `CREATE TABLE IF NOT EXISTS Questions (
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
  pack_id TEXT DEFAULT 'core',
  is_locked INTEGER DEFAULT 0,
  last_answer_correct INTEGER,
  last_answered_at TEXT,
  last_correct_at TEXT,
  last_incorrect_at TEXT
);`,
  `CREATE TABLE IF NOT EXISTS AppInfo (
  user_id TEXT PRIMARY KEY,
  created_at TEXT
);`,
  `CREATE TABLE IF NOT EXISTS Users (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  created_at TEXT,
  last_active_at TEXT
);`,
  `CREATE TABLE IF NOT EXISTS QuestionAttempts (
  user_id TEXT,
  question_id TEXT,
  answered_at TEXT,
  is_correct INTEGER,
  response_ms INTEGER,
  PRIMARY KEY (user_id, question_id, answered_at)
);`,
  `CREATE TABLE IF NOT EXISTS ReviewQueue (
  user_id TEXT,
  question_id TEXT,
  next_review_at TEXT,
  interval_days INTEGER,
  ease_factor REAL,
  repetition INTEGER,
  last_is_correct INTEGER,
  attempts INTEGER DEFAULT 0,
  last_grade INTEGER,
  last_answered_at TEXT,
  PRIMARY KEY (user_id, question_id)
);`,
  `CREATE TABLE IF NOT EXISTS LearningDailyStats (
  user_id TEXT,
  learning_date TEXT,
  attempts_total INTEGER,
  correct_total INTEGER,
  xp_gained INTEGER,
  streak_after_today INTEGER,
  PRIMARY KEY (user_id, learning_date)
);`,
  `CREATE TABLE IF NOT EXISTS Badges (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  criteria_json TEXT
);`,
  `CREATE TABLE IF NOT EXISTS UserBadges (
  user_id TEXT,
  badge_id TEXT,
  earned_at TEXT,
  PRIMARY KEY (user_id, badge_id)
);`,
  `CREATE TABLE IF NOT EXISTS PurchasedPacks (
  id TEXT PRIMARY KEY,
  purchased_at TEXT
);`,
  `CREATE TABLE IF NOT EXISTS LearningDailyLogs (
  user_id TEXT,
  learning_date TEXT,
  answers_json TEXT,
  created_at TEXT,
  updated_at TEXT,
  PRIMARY KEY (user_id, learning_date)
);`,
];
