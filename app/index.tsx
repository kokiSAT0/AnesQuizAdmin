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
} from '@/src/utils/db/index';
import { logInfo, logError } from '@/src/utils/logger';

export default function IndexScreen() {
  const theme = useTheme();

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        const id = await getOrCreateUserId();
        logInfo('ユーザーID取得', { id });
        await getQuestionsCount();
        logInfo('起動処理完了');
      } catch (err: any) {
        logError('起動処理失敗', err);
        Alert.alert('起動エラー', 'データベースの初期化に失敗しました。');
      }
    })();
  }, []);

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="AnesQuiz"
        // rightIcon="cog"
        // onRightPress={() => router.push('/settings')}
      />

      <View style={styles.center}>
        <Button
          mode="contained"
          onPress={() => router.push('/select')}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          クイズを始める
        </Button>
        {/* <Button
          mode="contained"
          onPress={() => router.push('/review')}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          復習モード
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push('/history')}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          学習履歴
        </Button> */}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 画面全体の配置調整
  screen: {
    flex: 1,
  },
  // 中央寄せレイアウト
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
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
