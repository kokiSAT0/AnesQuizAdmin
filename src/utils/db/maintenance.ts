import { getDB } from './connection';

/**
 * Questions テーブルを削除します。存在しない場合は何もしません。
 */
export async function dropQuestionsTable(): Promise<void> {
  const db = await getDB();
  await db.execAsync('DROP TABLE IF EXISTS Questions;');
}

/**
 * AppInfo テーブルを削除します。存在しない場合は何もしません。
 */
export async function dropAppInfoTable(): Promise<void> {
  const db = await getDB();
  await db.execAsync('DROP TABLE IF EXISTS AppInfo;');
}

/**
 * LearningDailyLogs テーブルを削除します。存在しない場合は何もしません。
 */
export async function dropLearningLogsTable(): Promise<void> {
  const db = await getDB();
  await db.execAsync('DROP TABLE IF EXISTS LearningDailyLogs;');
}
