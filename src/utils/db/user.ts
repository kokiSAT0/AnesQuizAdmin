import { getDB } from './connection';
import { generateUUID } from '../uuid';
import AsyncStorage from 'expo-sqlite/kv-store';

/**
 * AppInfo テーブルと AsyncStorage の両方で user_id を管理します
 */
export async function getOrCreateUserId(): Promise<string> {
  const storageKey = 'user_id';
  const db = await getDB();

  // 先に AsyncStorage から取得
  const storageId = await AsyncStorage.getItem(storageKey);

  // DB に保存されている user_id を確認
  const row = await db.getFirstAsync<{ user_id: string }>(
    'SELECT user_id FROM AppInfo LIMIT 1;',
  );

  // DB に値があればそれを優先し、AsyncStorage と同期する
  if (row?.user_id) {
    if (storageId !== row.user_id) {
      await AsyncStorage.setItem(storageKey, row.user_id);
    }
    return row.user_id;
  }

  // DB に無く、AsyncStorage にだけある場合は DB へ保存する
  if (storageId) {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO AppInfo (user_id, created_at) VALUES (?, ?);',
      [storageId, now],
    );
    return storageId;
  }

  // どちらにも無い場合は新規生成して両方へ保存
  const newId = generateUUID();
  const now = new Date().toISOString();
  await AsyncStorage.setItem(storageKey, newId);
  await db.runAsync(
    'INSERT INTO AppInfo (user_id, created_at) VALUES (?, ?);',
    [newId, now],
  );

  return newId;
}
