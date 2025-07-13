import Database from 'better-sqlite3';
import { getOrCreateUserId } from '../src/utils/db/user';

// connection モジュールをモックしてメモリDBを利用する
jest.mock('../src/utils/db/connection', () => ({
  getDB: async () => ({
    getFirstAsync: async (sql: string, params: any[] = []) =>
      (global as any).testDb.prepare(sql).get(params),
    runAsync: async (sql: string, params: any[] = []) =>
      (global as any).testDb.prepare(sql).run(params),
  }),
}));

// AsyncStorage を簡易モック
jest.mock('expo-sqlite/kv-store', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      __store: store,
    },
  };
});

const AsyncStorage = require('expo-sqlite/kv-store').default;

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  (global as any).testDb = db;
  db.exec('CREATE TABLE AppInfo (user_id TEXT PRIMARY KEY, created_at TEXT);');
  Object.keys(AsyncStorage.__store).forEach(
    (k) => delete AsyncStorage.__store[k],
  );
});

afterEach(() => {
  db.close();
  delete (global as any).testDb;
});

test('両方無い場合は生成して保存', async () => {
  const id = await getOrCreateUserId();
  const row = db.prepare('SELECT user_id FROM AppInfo').get();
  expect(row.user_id).toBe(id);
  expect(AsyncStorage.__store['user_id']).toBe(id);
});

test('AsyncStorage の値を DB に保存して返す', async () => {
  await AsyncStorage.setItem('user_id', 'storage-id');
  const id = await getOrCreateUserId();
  const row = db.prepare('SELECT user_id FROM AppInfo').get();
  expect(id).toBe('storage-id');
  expect(row.user_id).toBe('storage-id');
});

test('DB の値で AsyncStorage を上書き', async () => {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO AppInfo (user_id, created_at) VALUES (?, ?)').run(
    'db-id',
    now,
  );
  await AsyncStorage.setItem('user_id', 'other-id');
  const id = await getOrCreateUserId();
  expect(id).toBe('db-id');
  expect(AsyncStorage.__store['user_id']).toBe('db-id');
});
