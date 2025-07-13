import { getDB } from './connection';
import { generateUUID } from '../uuid';
import type { AppInfo } from '@/src/types/appInfo';
export async function getOrCreateUserId(): Promise<string> {
  const db = await getDB();

  // 既に保存されている user_id を取得
  const row = await db.getFirstAsync<Pick<AppInfo, 'user_id'>>(
    'SELECT user_id FROM AppInfo LIMIT 1;',
  );

  if (row?.user_id) {
    return row.user_id;
  }

  // 無ければ生成して保存
  const newId = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO AppInfo (user_id, created_at) VALUES (?, ?);',
    [newId, now],
  );

  return newId;
}
