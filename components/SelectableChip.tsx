import React from 'react';
import { Chip } from 'react-native-paper';

type Props = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export function SelectableChip({ label, selected, onToggle }: Props) {
  return (
    <Chip
      mode={selected ? 'flat' : 'outlined'}
      selected={selected}
      onPress={onToggle}
      style={{ margin: 4 }}
    >
      {label}
    </Chip>
  );
}
