import React from 'react';
import { Text } from 'react-native-paper';
import type { ComponentProps } from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';

// Text コンポーネントの既存のプロパティに text を追加
export type ResponsiveTextProps = ComponentProps<typeof Text> & {
  /** 表示する文字列。改行用に [br] を含める */
  text: string;
};

/**
 * 画面幅に応じて `[br]` を改行または空白に変換するテキスト
 * 幅 768px 以上をタブレットとして扱います
 */
export function ResponsiveText({ text, style, ...props }: ResponsiveTextProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const displayText = text.replace(/\[br\]/g, isTablet ? ' ' : '\n');

  return (
    <Text style={[styles.text, style]} {...props}>
      {displayText}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: 24,
  },
});
