import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

import {
  initializeDatabaseIfNeeded,
  getQuestionsCount,
  getOrCreateUserId,
} from '@/src/utils/db';

export default function IndexScreen() {
  const theme = useTheme();

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        const id = await getOrCreateUserId();
        console.log(`DB initialization complete (user_id: ${id})`);
        await getQuestionsCount();
      } catch (err: any) {
        console.log(`DB init error: ${err.message}`);
        Alert.alert('起動エラー', 'データベースの初期化に失敗しました。');
      }
    })();
  }, []);

  return (
    <Screen style={{ backgroundColor: theme.colors.background }}>
      <AppHeader
        title="AnesQuiz α版"
        rightIcon="cog"
        onRightPress={() => router.push('/settings')}
      />

      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Button
          mode="contained"
          onPress={() => router.push('/select')}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          クイズを始める
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // クイズ開始ボタンのスタイル
  startButton: {
    width: 320,
    alignSelf: 'center',
    marginVertical: 4,
  },
  // ボタン内部の高さ調整
  startButtonContent: {
    height: 60,
  },
});
