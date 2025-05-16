import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';

import {
  initializeDatabaseIfNeeded,
  getQuestionsCount,
  getQuestionsLimit5,
} from '../src/utils/db';
import { syncFirestoreToSQLite } from '../src/utils/firestoreSync';

export default function IndexScreen() {
  const [isSyncing, setIsSyncing] = useState(false); // 同期中フラグ（複数連打防止）
  const [isConnected, setIsConnected] = useState(true); // ネットワーク接続状態
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // SQLite 表示用
  const [showDataModal, setShowDataModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchedRows, setFetchedRows] = useState<any[]>([]);

  // 起動時に DB 初期化
  useEffect(() => {
    (async () => {
      try {
        await initializeDatabaseIfNeeded();
        appendLog('DB initialization complete');
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


export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>AnesQuiz α版</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="🔄 Firestore → SQLite 同期"
          onPress={handleSync}
          disabled={!isConnected || isSyncing}
        />
        <Button title="📂 SQLite の内容表示" onPress={handleShowData} />
        <Button title="クイズを始める" onPress={() => router.push('/select')} />
      </View>

      {/* 結果・ログ表示 */}
      <View style={styles.logContainer}>
        <ScrollView>
          {logMessages.map((msg, idx) => (
            <Text key={idx} style={styles.logText}>
              {msg}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* 同期中スピナー */}
      {isSyncing && (
        <View style={styles.syncOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* SQLite の内容を JSON 表示するモーダル */}
      <Modal
        visible={showDataModal}
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>SQLite レコード内容</Text>
          <Text>合計件数: {totalRecords}</Text>
          <ScrollView style={styles.jsonArea}>
            <Text selectable style={styles.jsonText}>
              {JSON.stringify(fetchedRows, null, 2)}
            </Text>
          </ScrollView>
          <Button title="閉じる" onPress={() => setShowDataModal(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  logContainer: {
    flex: 1,
    marginTop: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    padding: 8,
  },
  logText: {
    fontSize: 12,
    marginVertical: 2,
  },
  syncOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  jsonArea: {
    flex: 1,
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
  },
  jsonText: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 12,
  },
});
