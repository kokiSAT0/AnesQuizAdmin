import React, { useState } from 'react';
import { View, ScrollView, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Text, Button, useTheme } from 'react-native-paper';
import {
  getQuestionsCount,
  getQuestionsLimit5,
  getLatestLearningLogs,
  deleteDatabase,
  dropQuestionsTable,
  dropAppInfoTable,
  dropLearningLogsTable,
} from '@/src/utils/db/index';
import type { Question } from '@/src/types/question';
import type { LearningDailyLog } from '@/src/types/learningLog';

export default function Settings() {
  const theme = useTheme();
  const [showDataModal, setShowDataModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fetchedRows, setFetchedRows] = useState<Question[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<LearningDailyLog[]>([]);

  const handleShowData = async () => {
    try {
      const total = await getQuestionsCount();
      const rows = await getQuestionsLimit5();
      setTotalRecords(total);
      setFetchedRows(rows);
      setShowDataModal(true);
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  const handleShowLogs = async () => {
    try {
      const rows = await getLatestLearningLogs();
      setDailyLogs(rows);
      setShowLogModal(true);
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  const handleDeleteDb = async () => {
    try {
      await deleteDatabase();
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  const handleDropQuestions = async () => {
    try {
      await dropQuestionsTable();
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  const handleDropAppInfo = async () => {
    try {
      await dropAppInfoTable();
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  const handleDropLogsTbl = async () => {
    try {
      await dropLearningLogsTable();
    } catch (err: any) {
      // エラー内容は一旦無視
    }
  };

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader title="設定" onBack={() => router.back()} />
      <View style={styles.marginTop}>
        <Button
          mode="contained"
          onPress={handleShowData}
          style={styles.marginBottom}
        >
          📂 SQLite の内容表示
        </Button>
        <Button
          mode="contained"
          onPress={handleShowLogs}
          style={styles.marginBottom}
        >
          📜 学習ログ表示
        </Button>
        <Button
          mode="contained"
          onPress={handleDeleteDb}
          style={styles.marginBottom}
        >
          🗑️ DBファイル削除
        </Button>
      </View>

      <Modal
        visible={showDataModal}
        animationType="slide"
        onRequestClose={() => setShowDataModal(false)}
      >
        <Screen
          style={[styles.screen, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            SQLite レコード内容
          </Text>
          <Text>合計件数: {totalRecords}</Text>
          <ScrollView
            style={[
              styles.modalScroll,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
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
        <Screen
          style={[styles.screen, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            最近の学習ログ
          </Text>
          <ScrollView
            style={[
              styles.modalScroll,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text selectable>{JSON.stringify(dailyLogs, null, 2)}</Text>
          </ScrollView>
          <Button onPress={() => setShowLogModal(false)}>閉じる</Button>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 画面全体スタイル
  screen: { flex: 1 },
  // 上余白
  marginTop: { marginTop: 24 },
  // 下余白
  marginBottom: { marginBottom: 8 },
  // モーダルタイトル共通
  modalTitle: { textAlign: 'center', marginBottom: 12 },
  // モーダル内スクロール領域
  modalScroll: {
    flex: 1,
    marginVertical: 8,
    borderRadius: 4,
    padding: 8,
  },
});
