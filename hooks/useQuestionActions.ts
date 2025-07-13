// hooks/useQuestionActions.ts
// 問題データの「お気に入り」「使用中」フラグを切り替えるカスタムフックです
// フック: React で再利用できる処理をまとめた関数のこと

import React from 'react';
import type { Question } from '@/types/question';
import { updateFavorite, updateUsed } from '@/src/utils/db';
import { logInfo, logError } from '@/src/utils/logger';

export type UseQuestionActionsProps = {
  // 対象となる問題データ。null の場合は何もしません
  question: Question | null;
  // 親コンポーネント側の setState を受け取ります
  setQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
};

export type UseQuestionActionsReturn = {
  // お気に入り状態を切り替える関数
  toggleFavorite: () => Promise<void>;
  // 使用フラグを切り替える関数
  toggleUsed: () => Promise<void>;
};

export function useQuestionActions({
  question,
  setQuestion,
}: UseQuestionActionsProps): UseQuestionActionsReturn {
  // お気に入りをトグルする処理
  const toggleFavorite = async () => {
    if (!question) return;
    const newFlag = !question.is_favorite;
    try {
      // SQLite を更新し、状態も反映
      await updateFavorite(question.id, newFlag);
      setQuestion((prev) => (prev ? { ...prev, is_favorite: newFlag } : prev));
      logInfo('toggle favorite', { id: question.id, flag: newFlag });
    } catch (err) {
      logError('お気に入り更新失敗', err);
    }
  };

  // 使用中フラグをトグルする処理
  const toggleUsed = async () => {
    if (!question) return;
    const newFlag = !question.is_used;
    try {
      await updateUsed(question.id, newFlag);
      setQuestion((prev) => (prev ? { ...prev, is_used: newFlag } : prev));
      logInfo('toggle used', { id: question.id, flag: newFlag });
    } catch (err) {
      logError('使用フラグ更新失敗', err);
    }
  };

  // 2 つの関数を返します
  return { toggleFavorite, toggleUsed };
}
