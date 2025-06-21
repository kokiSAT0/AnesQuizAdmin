import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { spawnSync } from 'child_process';

// buildSqlite.ts を実行して SQLite DB を生成する
// テスト実行前に一度だけ呼び出し、終了後に削除する

const dbPath = path.join(__dirname, '..', 'assets', 'db', 'app.db');

beforeAll(() => {
  // tsx を使ってスクリプトを実行し、同期的に終了するか確認
  const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
  const scriptPath = path.join(__dirname, '..', 'scripts', 'buildSqlite.ts');
  const result = spawnSync(tsxPath, [scriptPath], { encoding: 'utf8' });
  if (result.error) throw result.error;
  // 正常終了しているかチェック
  expect(result.status).toBe(0);
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

  test('スクリプト実行後にプロセスが残らない', () => {
    const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
    const scriptPath = path.join(__dirname, '..', 'scripts', 'buildSqlite.ts');
    const result = spawnSync(tsxPath, [scriptPath], {
      encoding: 'utf8',
      timeout: 5000,
    });
    if (result.error) throw result.error;
    // 5秒以内に終了し、成功しているか確認
    expect(result.status).toBe(0);
  });
});
