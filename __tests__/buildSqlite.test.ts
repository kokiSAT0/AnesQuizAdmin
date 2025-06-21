import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// buildSqlite.ts を実行して SQLite DB を生成する
// テスト実行前に一度だけ呼び出し、終了後に削除する

const dbPath = path.join(__dirname, '..', 'assets', 'db', 'app.db');

beforeAll(() => {
  // スクリプトを読み込むだけで DB が生成される
  require('../scripts/buildSqlite.ts');
});

afterAll(() => {
  // テスト用に作成した DB を削除する
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});

describe('buildSqlite スクリプト', () => {
  test('Questions テーブルが作成されている', () => {
    const db = new Database(dbPath, { readonly: true });
    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Questions'",
      )
      .get();
    expect(table).toBeTruthy();
    db.close();
  });

  test('サンプルデータ an0000001 が登録されている', () => {
    const db = new Database(dbPath, { readonly: true });
    const row = db
      .prepare('SELECT question FROM Questions WHERE id = ?')
      .get('an0000001');
    // 日本語の質問文が正しく保存されているか確認
    expect(row?.question).toBe('プロポフォールの[br]投与経路は?');
    db.close();
  });

  test('ReviewQueue テーブルに attempts カラムがある', () => {
    const db = new Database(dbPath, { readonly: true });
    const info = db.prepare("PRAGMA table_info('ReviewQueue')").all();
    const hasAttempts = info.some((c: any) => c.name === 'attempts');
    expect(hasAttempts).toBe(true);
    db.close();
  });

  test('進捗フィルタで件数が変わる', () => {
    const db = new Database(dbPath);
    db.prepare(
      'UPDATE Questions SET first_attempt_correct = 1, last_answer_correct = 1 WHERE id = ?',
    ).run('an0000001');
    db.prepare(
      'UPDATE Questions SET first_attempt_correct = 0, last_answer_correct = 0 WHERE id = ?',
    ).run('an0000002');
    const total = db.prepare('SELECT COUNT(*) AS c FROM Questions').get()
      .c as number;
    const correct = db
      .prepare(
        'SELECT COUNT(*) AS c FROM Questions WHERE last_answer_correct = 1',
      )
      .get().c as number;
    const incorrect = db
      .prepare(
        'SELECT COUNT(*) AS c FROM Questions WHERE last_answer_correct = 0',
      )
      .get().c as number;
    const unlearned = db
      .prepare(
        'SELECT COUNT(*) AS c FROM Questions WHERE first_attempt_correct IS NULL',
      )
      .get().c as number;
    expect(correct).toBe(1);
    expect(incorrect).toBe(total - 1);
    expect(unlearned).toBe(total - 2);
    db.close();
  });
});
