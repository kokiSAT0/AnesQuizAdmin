import React from 'react';
import { TouchableRipple, type TouchableRippleProps } from 'react-native-paper';

export type PaperPressableProps = TouchableRippleProps;

/**
 * TouchableRipple を使った共通 Pressable コンポーネント
 * React Native の Pressable と同様に使えます
 */
export function PaperPressable({ children, ...props }: PaperPressableProps) {
  return <TouchableRipple {...props}>{children}</TouchableRipple>;
}
