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
    expect(row?.question).toBe(
      '成人男性の標準的な気管チューブサイズはどれか？',
    );
    db.close();
  });
});
