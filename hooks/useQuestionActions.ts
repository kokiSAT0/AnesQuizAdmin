// hooks/useQuestionActions.ts
// 問題データの「お気に入り」「使用中」フラグを切り替えるカスタムフックです
// フック: React で再利用できる処理をまとめた関数のこと

import React from 'react';
import type { Question } from '@/types/question';
import { updateQuestionFlag } from '@/src/utils/db';
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
  /**
   * 任意のフラグをトグルする共通処理
   * @param field 更新対象のフィールド名
   */
  const toggleFlag = async (field: 'is_favorite' | 'is_used') => {
    if (!question) return;
    const newFlag = !question[field];
    try {
      // DB 更新と状態反映をまとめて実行
      await updateQuestionFlag(question.id, field, newFlag);
      setQuestion((prev) => (prev ? { ...prev, [field]: newFlag } : prev));
      logInfo(`toggle ${field}`, { id: question.id, flag: newFlag });
    } catch (err) {
      logError(`${field} 更新失敗`, err);
    }
  };

  // 各操作用のラッパー関数を返す
  const toggleFavorite = async () => toggleFlag('is_favorite');
  const toggleUsed = async () => toggleFlag('is_used');

  return { toggleFavorite, toggleUsed };
}
