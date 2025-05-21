import React from 'react';
import { View, type ViewProps, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 画面共通の余白を持つコンテナコンポーネント
 * 端末幅に応じて余白を変えることでスマホとタブレットの両方に対応します
 */
export function Screen({ style, children, ...props }: ViewProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // スマホは 16, タブレットは 24 を基準とする
  const base = width >= 768 ? 24 : 16;
  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: base,
          paddingBottom: insets.bottom + base,
          paddingHorizontal: base,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
