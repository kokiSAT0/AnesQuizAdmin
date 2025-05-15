/**
 * 初期クイズデータを Firestore に一括登録するスクリプト
 * ------------------------------------------------------
 * 使い方:
 *   # 環境変数 GOOGLE_APPLICATION_CREDENTIALS にサービスアカウント JSON を指定
 *   npm run seed              ← ./questions/seed.json を投入
 *   npm run seed ./foo.json   ← 任意の JSON を投入
 *
 * package.json 例:
 *   "scripts": {
 *     "seed": "ts-node scripts/bulkInsertQuestions.ts"
 *   }
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import chalk from 'chalk';

// ---------- Firebase Admin 初期化 ----------
const app = initializeApp({
  credential: cert(
    process.env.GOOGLE_APPLICATION_CREDENTIALS as ServiceAccount | string,
  ),
});
const db = getFirestore(app);

// ---------- JSON 読み込み ----------
const filePath = resolve(process.argv[2] ?? 'questions/seed.json');
const raw = readFileSync(filePath, 'utf8');
const questions = JSON.parse(raw) as any[];

(async () => {
  const batch = db.batch();

  questions.forEach((q) => {
    const ref = db.collection('questions').doc(q.id);
    batch.set(ref, q, { merge: false });
  });

  await batch.commit();
  console.log(
    chalk.green(`✅ Inserted ${questions.length} questions from ${filePath}`),
  );
  process.exit(0);
})();
