import Database from 'better-sqlite3';
import {
  dropQuestionsTable,
  dropAppInfoTable,
  dropLearningLogsTable,
} from '../src/utils/db/maintenance';

// connection モジュールをモックしてメモリDBを利用する
jest.mock('../src/utils/db/connection', () => ({
  getDB: async () => ({
    execAsync: async (sql: string) => {
      (global as any).testDb.exec(sql);
    },
  }),
}));

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  (global as any).testDb = db;
  db.exec('CREATE TABLE Questions(id TEXT);');
  db.exec('CREATE TABLE AppInfo(id TEXT);');
  db.exec('CREATE TABLE LearningDailyLogs(id TEXT);');
});

afterEach(() => {
  db.close();
  delete (global as any).testDb;
});

function tableExists(name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return !!row;
}

test('dropQuestionsTable がテーブルを削除する', async () => {
  expect(tableExists('Questions')).toBe(true);
  await dropQuestionsTable();
  expect(tableExists('Questions')).toBe(false);
});

test('dropAppInfoTable がテーブルを削除する', async () => {
  expect(tableExists('AppInfo')).toBe(true);
  await dropAppInfoTable();
  expect(tableExists('AppInfo')).toBe(false);
});

test('dropLearningLogsTable がテーブルを削除する', async () => {
  expect(tableExists('LearningDailyLogs')).toBe(true);
  await dropLearningLogsTable();
  expect(tableExists('LearningDailyLogs')).toBe(false);
});
