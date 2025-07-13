// hooks/useSelectionSet.ts
// 選択肢の配列を管理するカスタムフック
// フック: React の機能を再利用しやすい形でまとめた関数のこと
import React from 'react';

export type UseSelectionSetReturn<T> = {
  selected: T[];
  toggle: (item: T) => void;
  selectAll: (items: T[]) => void;
  clear: () => void;
  setSelected: React.Dispatch<React.SetStateAction<T[]>>;
};

export function useSelectionSet<T>(initial: T[] = []): UseSelectionSetReturn<T> {
  // 選択中のアイテムを配列で保持します
  const [selected, setSelected] = React.useState<T[]>(initial);

  // 指定アイテムの有無を切り替え
  const toggle = (item: T) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    );
  };

  // 渡された全アイテムをそのまま選択状態に
  const selectAll = (items: T[]) => {
    setSelected([...items]);
  };

  // 選択をすべて解除
  const clear = () => {
    setSelected([]);
  };

  return { selected, toggle, selectAll, clear, setSelected };
}
