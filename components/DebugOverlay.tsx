import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useDebugStore } from '@/src/store/debug';

/**
 * 画面下部にログを表示するオーバーレイ
 */
export const DebugOverlay: React.FC = () => {
  const { enabled, logs } = useDebugStore();
  const theme = useTheme();
  // ScrollView の参照を保持するための "ref" を用意
  const scrollRef = useRef<ScrollView | null>(null);

  // ログ一覧が変わったとき、最新行が見えるよう末尾へスクロールする
  useEffect(() => {
    // scrollToEnd は内容の一番下まで移動するメソッド
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  if (!enabled) return null;

  return (
    <View
      // pointerEvents="none" でこのビューはタッチを受け付けず、背後のボタンが押せる
      pointerEvents="none"
      style={[
        styles.container,
        {
          // 半透明にして下の UI を見やすくする
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <ScrollView ref={scrollRef}>
        {logs.map((l, i) => (
          <Text key={i} style={styles.text}>
            {l.timestamp} [{l.level}] {l.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // ログをより多く表示できるよう高さを広げる
    maxHeight: '50%',
    padding: 8,
    borderTopWidth: 1,
  },
  text: {
    fontSize: 12,
  },
});
