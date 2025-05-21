import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { ModalScreen } from '@/components/ModalScreen';
import { Text, Button } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';

import {
  initializeDatabaseIfNeeded,
  getQuestionsCount,
  getQuestionsLimit5,
  getOrCreateUserId,
  getLatestLearningLogs,
  dropQuestionsTable,
  dropAppInfoTable,
  dropLearningLogsTable,
} from '@/src/utils/db';
import { syncFirestoreToSQLite } from '@/src/utils/firestoreSync';

export default function IndexScreen() {
  const [isSyncing, setIsSyncing] = useState(false); // 同期中フラグ（複数連打防止）
  const [isConnected, setIsConnected] = useState(true); // ネットワーク接続状態
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // SQLite 表示用
  const [showDataModal, setShowDataModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchedRows, setFetchedRows] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        const id = await getOrCreateUserId();
        appendLog(`DB initialization complete (user_id: ${id})`);
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

  // SQLite の内容表示
  const handleShowData = async () => {
    try {
      const total = await getQuestionsCount();
      const rows = await getQuestionsLimit5();
      setTotalRecords(total);
      setFetchedRows(rows);
      setShowDataModal(true);
    } catch (err: any) {
      appendLog(`SQLite 取得エラー: ${err.message}`);
    }
  };

  // LearningDailyLogs を表示
  const handleShowLogs = async () => {
    try {
      const rows = await getLatestLearningLogs();
      // dailyLogs ステートの値を更新
      // 「ステート」とは React で扱う画面の状態を指します
      setDailyLogs(rows);
      setShowLogModal(true);
    } catch (err: any) {
      appendLog(`ログ取得エラー: ${err.message}`);
    }
  };

  // テーブル削除 (Questions)
  const handleDropQuestions = async () => {
    try {
      await dropQuestionsTable();
      await initializeDatabaseIfNeeded();
      appendLog('Questions テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  // テーブル削除 (AppInfo)
  const handleDropAppInfo = async () => {
    try {
      await dropAppInfoTable();
      appendLog('AppInfo テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  // テーブル削除 (LearningDailyLogs)
  const handleDropLogsTbl = async () => {
    try {
      await dropLearningLogsTable();
      appendLog('LearningDailyLogs テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  return (
    <Screen className="bg-gray-50">
      {/* Screen コンポーネントで全体の余白を統一 */}
      <Text variant="titleLarge" className="text-center mb-3">
        AnesQuiz α版
      </Text>

      <View className="items-center space-y-2">
        <Button
          mode="contained"
          onPress={handleSync}
          disabled={!isConnected || isSyncing}
          className="w-full max-w-sm"
        >
          🔄 Firestore → SQLite 同期
        </Button>
        <Button
          mode="contained"
          onPress={handleShowData}
          className="w-full max-w-sm"
        >
          📂 SQLite の内容表示
        </Button>
        <Button
          mode="contained"
          onPress={handleShowLogs}
          className="w-full max-w-sm"
        >
          📜 学習ログ表示
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push('/select')}
          className="w-full max-w-sm"
        >
          クイズを始める
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropQuestions}
          className="w-full max-w-sm"
        >
          Questions 削除
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropAppInfo}
          className="w-full max-w-sm"
        >
          AppInfo 削除
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropLogsTbl}
          className="w-full max-w-sm"
        >
          Logs 削除
        </Button>
      </View>

      {/* 結果・ログ表示 */}
      <View className="flex-1 mt-2 bg-gray-200 rounded p-2">
        <ScrollView>
          {logMessages.map((msg, idx) => (
            <Text key={idx} className="text-xs my-1">
              {msg}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* 同期中スピナー */}
      {isSyncing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* SQLite の内容を JSON 表示するモーダル */}
      <Modal
        visible={showDataModal}
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        {/* ModalScreen でモーダル内の余白を調整 */}
        <ModalScreen className="bg-white">
          <Text variant="titleMedium" className="text-center mb-3">
            SQLite レコード内容
          </Text>
          <Text>合計件数: {totalRecords}</Text>
          <ScrollView className="flex-1 my-2 bg-gray-100 rounded p-2">
            <Text selectable style={styles.jsonText}>
              {JSON.stringify(fetchedRows, null, 2)}
            </Text>
          </ScrollView>
          <Button onPress={() => setShowDataModal(false)}>閉じる</Button>
        </ModalScreen>
      </Modal>
      {/* 学習ログを表示するモーダル */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <ModalScreen className="bg-white">
          <Text variant="titleMedium" className="text-center mb-3">
            最近の学習ログ
          </Text>
          <ScrollView className="flex-1 my-2 bg-gray-100 rounded p-2">
            <Text selectable style={styles.jsonText}>
              {JSON.stringify(dailyLogs, null, 2)}
            </Text>
          </ScrollView>
          <Button onPress={() => setShowLogModal(false)}>閉じる</Button>
        </ModalScreen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  jsonText: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 12,
  },
});
