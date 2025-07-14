import { getDB } from './connection';
import { logInfo, logError } from '../logger';

/** 購入済みパックID一覧を取得 */
export async function getPurchasedPacks(): Promise<string[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM PurchasedPacks;');
  return rows.map((r) => r.id);
}

/** 指定パックを購入済みとして登録し、紐づく問題をアンロック */
export async function purchasePack(packId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT OR REPLACE INTO PurchasedPacks (id, purchased_at) VALUES (?, ?);',
        [packId, now],
      );
      await db.runAsync('UPDATE Questions SET is_locked = 0 WHERE pack_id = ?;', [packId]);
    });
    logInfo('pack purchased', { packId });
  } catch (err) {
    logError('pack purchase failed', err);
    throw err;
  }
}

/** 指定パックが購入済みか確認 */
export async function isPackPurchased(packId: string): Promise<boolean> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM PurchasedPacks WHERE id = ?;',
    [packId],
  );
  return !!row;
}
