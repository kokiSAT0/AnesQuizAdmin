import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Text, Button, useTheme } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useDebugStore } from '@/src/store/debug';

import {
  initializeDatabaseIfNeeded,
  getQuestionsCount,
  getOrCreateUserId,
} from '@/src/utils/db';
import { syncFirestoreToSQLite } from '@/src/utils/firestoreSync';

export default function IndexScreen() {
  const theme = useTheme();
  const debugEnabled = useDebugStore((s) => s.enabled);
  const [isSyncing, setIsSyncing] = useState(false); // 同期中フラグ（複数連打防止）
  const [isConnected, setIsConnected] = useState(true); // ネットワーク接続状態
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        const id = await getOrCreateUserId();
        appendLog(`DB initialization complete (user_id: ${id})`);
        const count = await getQuestionsCount();
        if (count === 0 && isConnected) {
          appendLog('初回起動のため Firestore から同期します');
          await handleSync();
        }
      } catch (err: any) {
        appendLog(`DB init error: ${err.message}`);
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

  // ログ追記ヘルパー
  const appendLog = (msg: string) => {
    setLogMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
    console.log(msg);
  };

  // Firestore → SQLite 同期
  const handleSync = async () => {
    if (isSyncing) {
      appendLog('同期中です。しばらくお待ちください...');
      return;
    }
    setIsSyncing(true);
    appendLog('同期開始');
    const startTime = Date.now();

    try {
      const { importedCount } = await syncFirestoreToSQLite();
      const endTime = Date.now();
      const durationSec = ((endTime - startTime) / 1000).toFixed(2);
      appendLog(`同期完了: ${importedCount}件 (${durationSec}s)`);
    } catch (err: any) {
      appendLog(`同期エラー: ${err.message}`);
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
          style={{ width: '100%', maxWidth: 320, marginVertical: 4 }}
        >
          クイズを始める
        </Button>

        {debugEnabled && (
          <View style={styles.logArea}>
            <ScrollView>
              {logMessages.map((msg, idx) => (
                <Text key={idx} style={{ fontSize: 12, marginVertical: 4 }}>
                  {msg}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

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
  logArea: {
    flex: 1,
    width: '100%',
    marginTop: 8,
    borderRadius: 4,
    padding: 8,
  },
});
