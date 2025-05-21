import React from 'react';
import {
  ScrollView,
  type ScrollViewProps,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 全体がスクロール可能なページ向けコンポーネント
 */
export function ScrollableScreen({
  style,
  contentContainerStyle,
  children,
  ...props
}: ScrollViewProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const base = width >= 768 ? 24 : 16;
  return (
    <ScrollView
      style={[{ flex: 1, paddingHorizontal: base }, style]}
      contentContainerStyle={[
        { paddingTop: base, paddingBottom: insets.bottom + base },
        contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
