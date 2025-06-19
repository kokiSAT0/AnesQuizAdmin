import React, { useState } from 'react';
import { View, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Text, Button, useTheme } from 'react-native-paper';
import {
  getQuestionsCount,
  getQuestionsLimit5,
  getLatestLearningLogs,
} from '@/src/utils/db';

export default function Settings() {
  const theme = useTheme();
  const [showDataModal, setShowDataModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchedRows, setFetchedRows] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  const appendLog = (msg: string) => {
    console.log(msg);
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

  return (
    <Screen style={{ backgroundColor: theme.colors.background }}>
      <AppHeader title="設定" onBack={() => router.back()} />
      <View style={{ marginTop: 24 }}>
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
