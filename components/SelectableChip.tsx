// カラースキーム型をインポート
import type { ColorScheme } from '@/theme/tokens';
import React from 'react';
import { Chip, useTheme, type MD3Theme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

// コンポーネントが受け取るプロパティ型
// "export" を付けることで他のファイルからも利用できます
export type SelectableChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  selectedColorToken: keyof ColorScheme;
};

export function SelectableChip({
  label,
  selected,
  onToggle,
  selectedColorToken,
}: SelectableChipProps) {
  // ジェネリック指定でテーマ型を確定させる
  const { colors } = useTheme<MD3Theme>();
  // 選択状態に応じて背景色を変える
  const backgroundStyle = {
    backgroundColor: selected ? (colors as any)[selectedColorToken] : '#FFFFFF',
  };

  return (
    <Chip
      mode="outlined"
      onPress={onToggle}
      style={[styles.chip, backgroundStyle]}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    margin: 4,
  },
});
