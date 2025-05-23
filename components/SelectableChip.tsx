import React from 'react';
import { Chip } from 'react-native-paper';

type Props = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  selectedColor: string;
};

export function SelectableChip({
  label,
  selected,
  onToggle,
  selectedColor,
}: Props) {
  return (
    <Chip
      mode="outlined"
      onPress={onToggle}
      style={{
        margin: 4,
        backgroundColor: selected ? selectedColor : 'white',
      }}
    >
      {label}
    </Chip>
  );
}
