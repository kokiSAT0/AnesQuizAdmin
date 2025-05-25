import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

// SQLite を利用した簡易ストレージを実装します
// AsyncStorage の代わりに SQLite を使うことで追加パッケージ無しで永続化できます
let db: SQLiteDatabase | null = null;

/** DB を取得しつつ KeyValue テーブルを確保 */
async function getDB(): Promise<SQLiteDatabase> {
  if (!db) {
    db = await openDatabaseAsync('debug.db');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS KeyValue (key TEXT PRIMARY KEY, value TEXT);',
    );
  }
  return db;
}

/** zustand persist 用のストレージ */
const sqliteStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const database = await getDB();
    const row = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM KeyValue WHERE key = ?;',
      [name],
    );
    return row?.value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const database = await getDB();
    await database.runAsync(
      'INSERT OR REPLACE INTO KeyValue (key, value) VALUES (?, ?);',
      [name, value],
    );
  },
  removeItem: async (name: string): Promise<void> => {
    const database = await getDB();
    await database.runAsync('DELETE FROM KeyValue WHERE key = ?;', [name]);
  },
};

/**
 * デバッグ用のログ 1 件を表す型
 */
export type DebugLog = {
  timestamp: string; // いつのログか
  level: 'log' | 'info' | 'warn' | 'error'; // 種類
  message: string; // 内容
};

/**
 * デバッグ状態を保持するストア
 */
export interface DebugState {
  enabled: boolean; // デバッグモード ON/OFF
  logs: DebugLog[]; // 保存しているログ一覧
  enable: () => void; // ON にする
  disable: () => void; // OFF にする
  addLog: (level: DebugLog['level'], message: string) => void; // ログ追加
  clearLogs: () => void; // 全削除
}

// persist を使って SQLite に保存し、アプリ再起動後も状態を保持します
export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      enabled: false,
      logs: [],
      enable: () => set({ enabled: true }),
      disable: () => set({ enabled: false }),
      addLog: (level, message) =>
        set((s) => ({
          logs: [
            ...s.logs,
            { timestamp: new Date().toISOString(), level, message },
          ],
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'debug-store',
      storage: createJSONStorage(() => sqliteStorage),
    },
  ),
);
