import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Button, useTheme } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';

import {
  initializeDatabaseIfNeeded,
  getQuestionsCount,
  getOrCreateUserId,
} from '@/src/utils/db';
import { syncFirestoreToSQLite } from '@/src/utils/firestoreSync';

export default function IndexScreen() {
  const theme = useTheme();
  const [isSyncing, setIsSyncing] = useState(false); // 同期中フラグ（複数連打防止）
  const [isConnected, setIsConnected] = useState(true); // ネットワーク接続状態
  const prevConnected = useRef(true); // 前回の接続状態を記録

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        const id = await getOrCreateUserId();
        logDebug(`DB initialization complete (user_id: ${id})`);
        const count = await getQuestionsCount();
        if (count === 0 && isConnected) {
          logDebug('初回起動のため Firestore から同期します');
          await handleSync();
        }
      } catch (err: any) {
        logDebug(`DB init error: ${err.message}`);
        Alert.alert('起動エラー', 'データベースの初期化に失敗しました。');
      }
    })();
  }, []);

  // ネットワーク監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected === true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 接続状態がオフラインになったらアラート表示
  useEffect(() => {
    if (!isConnected && prevConnected.current) {
      Alert.alert('通信エラー', 'インターネット接続を確認してください。');
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // デバッグ用ログを出力するヘルパー
  const logDebug = (msg: string) => {
    console.log(msg); // debugger.ts で console をラップしてログを保存している
  };

  // Firestore → SQLite 同期
  const handleSync = async () => {
    if (isSyncing) {
      logDebug('同期中です。しばらくお待ちください...');
      return;
    }
    if (!isConnected) {
      Alert.alert('通信エラー', 'ネットワーク接続を確認してから再度お試しください。');
      return;
    }
    setIsSyncing(true);
    logDebug('同期開始');
    const startTime = Date.now();

    try {
      const { importedCount } = await syncFirestoreToSQLite();
      const endTime = Date.now();
      const durationSec = ((endTime - startTime) / 1000).toFixed(2);
      logDebug(`同期完了: ${importedCount}件 (${durationSec}s)`);
    } catch (err: any) {
      logDebug(`同期エラー: ${err.message}`);
      Alert.alert('同期エラー', 'データ取得中に問題が発生しました。');
    } finally {
      setIsSyncing(false);
    }
  };

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

        {isSyncing && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: 'rgba(0,0,0,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.onPrimary} />
          </View>
        )}
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
