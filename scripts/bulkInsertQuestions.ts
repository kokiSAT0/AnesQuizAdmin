/**
 * 初期クイズデータを Firestore に一括登録するスクリプト
 *   - フォルダを渡すと *.json を再帰しない 1階層で読み込む
 *   - 単一ファイルも可
 *   - --prod フラグがある時だけ本番 Firestore に書き込む
 */

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import chalk from 'chalk';

(async () => {
  /* ---------- CLI 引数 & モード ---------- */
  const isProd = process.argv.includes('--prod');
  const inputArg =
    process.argv.find((a) => a.endsWith('.json') || a.endsWith('questions')) ??
    'questions';
  const absPath = resolve(inputArg);

  /* ---------- Firebase Admin 初期化 ---------- */
  if (isProd) {
    // ── 本番 Firestore：サービスアカウント必須 ──
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath) {
      console.error(
        '❌  Set GOOGLE_APPLICATION_CREDENTIALS to your serviceAccount.json path',
      );
      process.exit(1);
    }
    initializeApp({ credential: cert(keyPath as ServiceAccount | string) });
  } else {
    // ── エミュレータ：匿名で OK ──
    // 環境変数が無ければ自動で設定
    process.env.FIRESTORE_EMULATOR_HOST ??= 'localhost:8080';
    initializeApp({ projectId: 'anesquiz' }); // projectId は適宜
    // エミュレータ用の特別な db.settings は不要
  }
  const db = getFirestore();

  /* ---------- ファイル列挙 ---------- */
  const jsonFiles: string[] = absPath.endsWith('.json')
    ? [absPath]
    : readdirSync(absPath)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(absPath, f));

  if (!jsonFiles.length) {
    console.error(chalk.red(`No JSON files found under ${absPath}`));
    process.exit(1);
  }

  /* ---------- バッチ書き込み ---------- */
  const batch = db.batch();
  let total = 0;

  for (const file of jsonFiles) {
    const questions = JSON.parse(readFileSync(file, 'utf8')) as any[];
    questions.forEach((q) => {
      const ref = db.collection('questions').doc(q.id);
      batch.set(ref, q, { merge: false });
      total += 1;
    });
  }

  await batch.commit();
  console.log(
    chalk.green(
      `✅ Inserted ${total} questions from ${jsonFiles.length} file(s) ${isProd ? '(PROD)' : '(EMULATOR)'}`,
    ),
  );
  process.exit(0);
})();
