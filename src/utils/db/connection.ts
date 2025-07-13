import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Alert } from 'react-native';
import { DB_VERSION } from '@/constants/DbVersion';

import { logInfo, logError, logWarn } from '../logger';

import { TABLE_SCHEMAS } from './schema';


let dbPromise: Promise<SQLiteDatabase> | null = null;
let dbCopiedFromAsset = false;

/* ------------------------------------------------------------------ */
/* DB ファイルを削除して次回起動時に再コピーさせる                    */
/* ------------------------------------------------------------------ */
export async function deleteDatabase(): Promise<void> {
  const sqlitePath = `${FileSystem.documentDirectory}SQLite/app.db`;
  const info = await FileSystem.getInfoAsync(sqlitePath);
  if (info.exists) {
    // FileSystem.deleteAsync は指定したファイルを非同期で削除します
    await FileSystem.deleteAsync(sqlitePath, { idempotent: true });
    logWarn('既存 DB を削除しました');
  }
  // 次回 getDB 呼び出し時に新しい DB をコピーさせるためリセット
  dbPromise = null;
  dbCopiedFromAsset = false;
}

/** シングルトンで DB を取得（新 API 版） */
export async function getDB(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    const sqlitePath = `${FileSystem.documentDirectory}SQLite/app.db`;
    try {
      const info = await FileSystem.getInfoAsync(sqlitePath);
      if (!info.exists) {
        // Expo が使う SQLite フォルダを作成（存在しない場合）
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}SQLite`,
          { intermediates: true },
        );

        // アセットから DB ファイルをコピー
        const asset = Asset.fromModule(require('@/assets/db/app.db'));
        await asset.downloadAsync();
        if (!asset.localUri) {
          throw new Error('app.db asset not found');
        }
        await FileSystem.copyAsync({ from: asset.localUri, to: sqlitePath });
        dbCopiedFromAsset = true;
      }
      dbPromise = openDatabaseAsync('app.db');
      logInfo('DB オープン準備完了');
    } catch (err) {
      logError('DB初期化エラー', err);
      Alert.alert('DB初期化エラー', 'データベースの準備に失敗しました。');
      throw err;
    }
  }
  let db: SQLiteDatabase;
  try {
    db = await dbPromise;
    logInfo('DB 接続確立');
  } catch (err) {
    logError('DB接続エラー', err);
    Alert.alert('DB接続エラー', 'データベースを開けませんでした。');
    throw err;
  }

  // DB バージョンをチェックし、古い場合は削除して再コピーする
  const { user_version = 0 } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  if (user_version < DB_VERSION) {
    logWarn('DB バージョンが古いため再コピーします');
    await deleteDatabase();
    return getDB();
  }

  return db;
}

/**
 * PRAGMA user_version が 0 のときだけ
 * Questions テーブルを作成し、user_version を DB_VERSION に更新する。
 */
export async function initializeDatabaseIfNeeded(): Promise<void> {
  const db = await getDB(); // ← Promise を await
  logInfo('DB 初期化開始');
  try {
    // DB 初期化開始

    // ① 現在の user_version を取得
    const { user_version = 0 } = await db.getFirstAsync<{
      user_version: number;
    }>('PRAGMA user_version;');

    if (!dbCopiedFromAsset && user_version === 0) {
      // 初回のみトランザクション内で全テーブルを作成し user_version を更新
      await db.withTransactionAsync(async () => {
        for (const sql of TABLE_SCHEMAS) {
          await db.execAsync(sql);
        }
        await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
      });
    } else {
      // 既存 DB やアセット利用時も不足分を作成
      for (const sql of TABLE_SCHEMAS) {
        await db.execAsync(sql);
      }
    }
  } catch (err) {
    logError('DB初期化処理エラー', err);
    Alert.alert('DB初期化処理エラー', 'データベースの初期化に失敗しました。');
    throw err;
  }
  logInfo('DB 初期化完了');
}
