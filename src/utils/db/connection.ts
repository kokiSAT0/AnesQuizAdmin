import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Alert } from 'react-native';
import { DB_VERSION } from '@/constants/DbVersion';
import { logInfo, logError, logWarn } from '../logger';

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

    if (dbCopiedFromAsset) {
      // 事前生成された DB を使っている場合、テーブル作成処理を省略
    } else if (user_version === 0) {
      // ② トランザクション内でテーブル作成 & user_version 更新
      // トランザクションとは複数の処理をひとまとめにして、途中で失敗したら全部なかったことにする仕組みです
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Questions (
          id TEXT PRIMARY KEY,
          type TEXT,
          category_json TEXT,
          tag_json TEXT,
          difficulty TEXT,
          question TEXT,
          option_json TEXT,
          correct_json TEXT,
          explanation TEXT,
          reference_json TEXT,
          first_attempt_correct INTEGER,
          first_attempted_at TEXT,
          is_favorite INTEGER,
          is_used INTEGER DEFAULT 1,
          last_answer_correct INTEGER,
          last_answered_at TEXT,
          last_correct_at TEXT,
          last_incorrect_at TEXT
        );
      `);

        // user_version を更新（DB_VERSION は定数で管理）
        await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
      });
    } else {
      // 既に初期化済みの場合
    }

    // AppInfo テーブルを作成（存在しない場合のみ）
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS AppInfo (
      user_id TEXT PRIMARY KEY,
      created_at TEXT
    );
  `);

    // Users テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      created_at TEXT,
      last_active_at TEXT
    );
  `);

    // QuestionAttempts テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS QuestionAttempts (
      user_id TEXT,
      question_id TEXT,
      answered_at TEXT,
      is_correct INTEGER,
      response_ms INTEGER,
      PRIMARY KEY (user_id, question_id, answered_at)
    );
  `);

    // ReviewQueue テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ReviewQueue (
      user_id TEXT,
      question_id TEXT,
      next_review_at TEXT,
      interval_days INTEGER,
      ease_factor REAL,
      repetition INTEGER,
      last_is_correct INTEGER,
      attempts INTEGER DEFAULT 0,
      last_grade INTEGER,
      last_answered_at TEXT,
      PRIMARY KEY (user_id, question_id)
    );
  `);

    // LearningDailyStats テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS LearningDailyStats (
      user_id TEXT,
      learning_date TEXT,
      attempts_total INTEGER,
      correct_total INTEGER,
      xp_gained INTEGER,
      streak_after_today INTEGER,
      PRIMARY KEY (user_id, learning_date)
    );
  `);

    // Badges テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Badges (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      criteria_json TEXT
    );
  `);

    // UserBadges テーブル
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS UserBadges (
      user_id TEXT,
      badge_id TEXT,
      earned_at TEXT,
      PRIMARY KEY (user_id, badge_id)
    );
  `);

    // LearningDailyLogs テーブルを必ず作成しておく（古い DB 対策）
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS LearningDailyLogs (
        user_id TEXT,
        learning_date TEXT,
        answers_json TEXT,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (user_id, learning_date)
      );
    `);
  } catch (err) {
    logError('DB初期化処理エラー', err);
    Alert.alert('DB初期化処理エラー', 'データベースの初期化に失敗しました。');
    throw err;
  }
  logInfo('DB 初期化完了');
}
