// \src\utils\firestoreSync.ts
import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase'; // ← ① 共通インスタンスを使用
import { getMaxUpdatedAt, upsertQuestion } from './db';

/**
 * Firestore → SQLite 同期処理
 * @returns 同期でインポートした件数
 */
export async function syncFirestoreToSQLite(): Promise<{
  importedCount: number;
}> {
  let imported = 0;

  // 1. SQLite 内の最大 updated_at を取得
  const maxUpdatedAt = await getMaxUpdatedAt();
  // デバッグ用: どこから同期を始めるかを記録
  console.info(`sync start from ${maxUpdatedAt}`);

  // 2. Firestore から 500 件ずつ取得
  let cursor: DocumentSnapshot | null = null;

  while (true) {
    const q = query(
      collection(db, 'questions'),
      where('metadata.updated_at', '>', maxUpdatedAt),
      orderBy('metadata.updated_at', 'asc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(500),
    );

    const snap = await getDocs(q);
    // 何件取得できたかログに残す
    console.info(`fetched ${snap.docs.length} docs`);
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = { ...doc.data(), id: doc.id }; // ← id を上書き
      await upsertQuestion(data);
      imported++;
    }

    console.info(`imported ${imported} docs so far`);

    cursor = snap.docs[snap.docs.length - 1]; // 次ページ用カーソル
  }

  console.info(`sync finished: total ${imported}`);
  return { importedCount: imported };
}
