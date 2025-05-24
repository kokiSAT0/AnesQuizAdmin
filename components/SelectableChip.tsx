import React from 'react';
import { Chip, useTheme } from 'react-native-paper';

type Props = {
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
}: Props) {
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
