import React from 'react';
import { View, type ViewProps, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * モーダル内で使用する専用コンテナ
 * 上部のセーフエリアも考慮した余白を付与します
 */
export function ModalScreen({ style, children, ...props }: ViewProps) {
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const base = width >= 768 ? 24 : 16;
  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: top + base,
          paddingBottom: bottom + base,
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
