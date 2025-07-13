import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

// TouchableRipple を使った押下可能コンポーネント
export type PaperPressableProps = React.ComponentProps<typeof TouchableRipple>;

export function PaperPressable({ style, ...rest }: PaperPressableProps) {
  return <TouchableRipple style={[styles.container, style]} {...rest} />;
}

const styles = StyleSheet.create({
  container: {},
});
