// カラースキーム型をインポート
import type { ColorScheme } from '@/theme/tokens';
import React from 'react';
import { Chip, useTheme } from 'react-native-paper';

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
  const { colors } = useTheme();
  return (
    <Chip
      mode="outlined"
      onPress={onToggle}
      style={{
        margin: 4,
        backgroundColor: selected ? colors[selectedColorToken] : '#FFFFFF',
      }}
    >
      {label}
    </Chip>
  );
}
