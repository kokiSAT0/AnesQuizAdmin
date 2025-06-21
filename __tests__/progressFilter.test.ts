import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { spawnSync } from 'child_process';

import {
  getQuestionIdsByFilter,
  countQuestionsByFilter,
} from '../src/utils/db/questions';

// このテストでは問題取得関数が進捗条件で正しく絞り込めるかを確認します

let db: Database.Database;
const dbPath = path.join(__dirname, '..', 'assets', 'db', 'app.db');
const testDbPath = path.join(__dirname, 'test.db');

jest.mock('../src/utils/db/connection', () => ({
  // テスト用に expo-sqlite を差し替えて better-sqlite3 を利用します
  getDB: async () => ({
    getAllAsync: async (sql: string, params: any[] = []) =>
      (global as any).testDb.prepare(sql).all(params),
    getFirstAsync: async (sql: string, params: any[] = []) =>
      (global as any).testDb.prepare(sql).get(params),
    runAsync: async (sql: string, params: any[] = []) =>
      (global as any).testDb.prepare(sql).run(params),
  }),
}));

const allLevels = ['初級', '中級', '上級'];

function getAllCategories() {
  // json_each を使ってカテゴリ配列を展開し、重複なく取得
  return db
    .prepare(
      'SELECT DISTINCT value FROM Questions, json_each(Questions.category_json)',
    )
    .all()
    .map((r: any) => r.value as string);
}

beforeAll(() => {
  const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
  const scriptPath = path.join(__dirname, '..', 'scripts', 'buildSqlite.ts');
  const result = spawnSync(tsxPath, [scriptPath], { encoding: 'utf8' });
  if (result.error) throw result.error;
  // 作成された DB をテスト用にコピーして使用
  fs.copyFileSync(dbPath, testDbPath);
  db = new Database(testDbPath);
  (global as any).testDb = db;
  // 1問だけ正解済みに設定
  db.prepare(
    'UPDATE Questions SET last_answer_correct = 1, first_attempt_correct = 1 WHERE id = ?',
  ).run('an0000001');
  // 1問だけ不正解済みに設定
  db.prepare('UPDATE Questions SET first_attempt_correct = 0 WHERE id = ?').run(
    'an0000002',
  );
});

afterAll(() => {
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  delete (global as any).testDb;
});

// 正解済みの問題だけを数える
test('正解のみを指定すると1件取得できる', async () => {
  const categories = getAllCategories();
  const count = await countQuestionsByFilter(allLevels, categories, false, [
    '正解',
  ]);
  const ids = await getQuestionIdsByFilter(allLevels, categories, false, [
    '正解',
  ]);
  expect(count).toBe(ids.length);
  expect(ids).toContain('an0000001');
});

// first_attempt_correct が NULL の問題を取得
test('未学習のみを指定すると null 行が取得できる', async () => {
  const categories = getAllCategories();
  const count = await countQuestionsByFilter(allLevels, categories, false, [
    '未学習',
  ]);
  const row = db
    .prepare(
      'SELECT COUNT(*) as total FROM Questions WHERE is_used = 1 AND first_attempt_correct IS NULL',
    )
    .get();
  expect(count).toBe(row.total);
});

// 直近で不正解だった問題を取得
test('不正解のみを指定すると更新済みの行を含む', async () => {
  const categories = getAllCategories();
  const count = await countQuestionsByFilter(allLevels, categories, false, [
    '不正解',
  ]);
  const row = db
    .prepare(
      'SELECT COUNT(*) as total FROM Questions WHERE is_used = 1 AND last_answer_correct = 0',
    )
    .get();
  expect(count).toBe(row.total);
});
