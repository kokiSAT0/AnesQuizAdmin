import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { Button, Text, useTheme } from 'react-native-paper';

export default function ReviewSummary() {
  const theme = useTheme();
  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader title="復習完了" onBack={() => router.replace('/')} />
      <View style={styles.center}>
        <Text>お疲れさまでした！</Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/')}
          style={styles.marginTop}
        >
          ホームに戻る
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 画面全体
  screen: { flex: 1 },
  // 上マージン
  marginTop: { marginTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
