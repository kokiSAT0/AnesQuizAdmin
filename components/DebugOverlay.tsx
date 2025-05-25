import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useDebugStore } from '@/src/store/debug';

/**
 * 画面下部にログを表示するオーバーレイ
 */
export const DebugOverlay: React.FC = () => {
  const { enabled, logs } = useDebugStore();
  const theme = useTheme();

  if (!enabled) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <ScrollView>
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
    maxHeight: '40%',
    padding: 8,
    borderTopWidth: 1,
  },
  text: {
    fontSize: 12,
  },
});
