// lib/firebase.ts
import Constants from 'expo-constants';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';
import type { Question } from '@/types/firestore'; // ← スキーマに合わせてパス調整

/* ---------- Firebase 初期化 (Singleton) ---------- */
let _app: FirebaseApp;
export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  const cfg = Constants.expoConfig?.extra ?? {};
  _app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: cfg.FIREBASE_API_KEY,
        authDomain: cfg.FIREBASE_AUTH_DOMAIN,
        projectId: cfg.FIREBASE_PROJECT_ID,
        storageBucket: cfg.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: cfg.FIREBASE_MESSAGING_SENDER_ID,
        appId: cfg.FIREBASE_APP_ID,
      });
  return _app;
}

export const db = getFirestore(getFirebaseApp());

/* ---------- CRUD ラッパー ---------- */

// 単一問題取得
export async function getQuestionById(id: string): Promise<Question | null> {
  const snap = await getDoc(doc(db, 'questions', id));
  return snap.exists() ? (snap.data() as Question) : null;
}

// レベル別取得
export async function getQuestionsByLevel(
  level: Question['difficulty']['level'],
): Promise<Question[]> {
  const q = query(
    collection(db, 'questions'),
    where('difficulty.level', '==', level),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Question);
}

// 解答ログ書き込み（オフライン対応）
export async function writeAnswerLog(
  questionId: string,
  isCorrect: boolean,
): Promise<void> {
  const logRef = doc(collection(db, 'questionLogs'));
  const statRef = doc(db, 'questionStats', questionId);

  const batch = writeBatch(db);
  batch.set(logRef, {
    question_id: questionId,
    correct: isCorrect,
    answered_at: Date.now(),
  });
  batch.set(
    statRef,
    {
      attempts: increment(1),
      correct: increment(isCorrect ? 1 : 0),
      updated_at: Date.now(),
    },
    { merge: true },
  );
  await batch.commit();
}
