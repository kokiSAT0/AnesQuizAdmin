import React, { useState } from 'react';
import { View, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useDebugStore } from '@/src/store/debug';
import {
  getQuestionsCount,
  getQuestionsLimit5,
  getLatestLearningLogs,
  dropQuestionsTable,
  dropAppInfoTable,
  dropLearningLogsTable,
  initializeDatabaseIfNeeded,
} from '@/src/utils/db';
import { syncFirestoreToSQLite } from '@/src/utils/firestoreSync';

export default function Settings() {
  const theme = useTheme();
  const enabled = useDebugStore((s) => s.enabled);
  const enable = useDebugStore((s) => s.enable);
  const disable = useDebugStore((s) => s.disable);
  const clearLogs = useDebugStore((s) => s.clearLogs);
  const [pass, setPass] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchedRows, setFetchedRows] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  const toggle = () => {
    if (enabled) {
      disable();
      clearLogs();
    } else if (pass === '0604') {
      enable();
    } else {
      alert('パスワードが違います');
    }
    setPass('');
  };

  const appendLog = (msg: string) => {
    console.log(msg);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    appendLog('同期開始');
    try {
      // テーブルが存在しない場合もあるため、毎回初期化を試みる
      await initializeDatabaseIfNeeded();
      const { importedCount } = await syncFirestoreToSQLite();
      appendLog(`同期完了: ${importedCount}件`);
    } catch (err: any) {
      appendLog(`同期エラー: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleShowLogs = async () => {
    try {
      const rows = await getLatestLearningLogs();
      setDailyLogs(rows);
      setShowLogModal(true);
    } catch (err: any) {
      appendLog(`ログ取得エラー: ${err.message}`);
    }
  };

  const handleDropQuestions = async () => {
    try {
      await dropQuestionsTable();
      appendLog('Questions テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  const handleDropAppInfo = async () => {
    try {
      await dropAppInfoTable();
      appendLog('AppInfo テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  const handleDropLogsTbl = async () => {
    try {
      await dropLearningLogsTable();
      appendLog('LearningDailyLogs テーブルを削除しました');
    } catch (err: any) {
      appendLog(`削除エラー: ${err.message}`);
    }
  };

  return (
    <Screen style={{ backgroundColor: theme.colors.background }}>
      <AppHeader title="設定" onBack={() => router.back()} />
      <View style={{ marginTop: 24 }}>
        <Text style={{ marginBottom: 8 }}>
          デバッグモード: {enabled ? 'ON' : 'OFF'}
        </Text>
        <TextInput
          label="パスワード"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
          style={{ marginBottom: 12 }}
        />
        <Button mode="contained" onPress={toggle} style={{ marginBottom: 16 }}>
          {enabled ? 'デバッグを無効化' : 'デバッグを有効化'}
        </Button>
        <Button
          mode="contained"
          onPress={handleSync}
          style={{ marginBottom: 8 }}
        >
          🔄 Firestore → SQLite 同期
        </Button>
        <Button
          mode="contained"
          onPress={handleShowData}
          style={{ marginBottom: 8 }}
        >
          📂 SQLite の内容表示
        </Button>
        <Button
          mode="contained"
          onPress={handleShowLogs}
          style={{ marginBottom: 8 }}
        >
          📜 学習ログ表示
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropQuestions}
          style={{ marginBottom: 8 }}
        >
          Questions 削除
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropAppInfo}
          style={{ marginBottom: 8 }}
        >
          AppInfo 削除
        </Button>
        <Button
          mode="outlined"
          onPress={handleDropLogsTbl}
          style={{ marginBottom: 8 }}
        >
          Logs 削除
        </Button>
        {isSyncing && (
          <ActivityIndicator
            style={{ marginTop: 16 }}
            size="large"
            color={theme.colors.onPrimary}
          />
        )}
      </View>

      <Modal
        visible={showDataModal}
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <Screen style={{ backgroundColor: theme.colors.background }}>
          <Text
            variant="titleMedium"
            style={{ textAlign: 'center', marginBottom: 12 }}
          >
            SQLite レコード内容
          </Text>
          <Text>合計件数: {totalRecords}</Text>
          <ScrollView
            style={{
              flex: 1,
              marginVertical: 8,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              padding: 8,
            }}
          >
            <Text selectable>{JSON.stringify(fetchedRows, null, 2)}</Text>
          </ScrollView>
          <Button onPress={() => setShowDataModal(false)}>閉じる</Button>
        </Screen>
      </Modal>

      <Modal
        visible={showLogModal}
        animationType="slide"
        onRequestClose={() => setShowLogModal(false)}
      >
        <Screen style={{ backgroundColor: theme.colors.background }}>
          <Text
            variant="titleMedium"
            style={{ textAlign: 'center', marginBottom: 12 }}
          >
            最近の学習ログ
          </Text>
          <ScrollView
            style={{
              flex: 1,
              marginVertical: 8,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              padding: 8,
            }}
          >
            <Text selectable>{JSON.stringify(dailyLogs, null, 2)}</Text>
          </ScrollView>
          <Button onPress={() => setShowLogModal(false)}>閉じる</Button>
        </Screen>
      </Modal>
    </Screen>
  );
}
