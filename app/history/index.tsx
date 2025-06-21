import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  useTheme,
  ProgressBar,
  List,
  Button,
  BottomNavigation,
} from 'react-native-paper';
// BottomNavigation を使うことでタブの移動をスワイプ操作にも対応させる
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { LearningCalendar } from '@/components/LearningCalendar';
import {
  getLatestLearningLogs,
  getCategoryStats,
  getLearningStreak,
  getAllBadgesWithStatus,
  getDueReviewItems,
} from '@/src/utils/db/index';

// BottomNavigation 用のルート定義
const routes = [
  { key: 'overview', title: 'Overview', focusedIcon: 'clipboard-text' },
  { key: 'timeline', title: 'Timeline', focusedIcon: 'timeline' },
  { key: 'categories', title: 'Categories', focusedIcon: 'shape' },
  { key: 'badges', title: 'Badges', focusedIcon: 'star' },
  { key: 'review', title: 'Review', focusedIcon: 'book' },
];

const renderScene = BottomNavigation.SceneMap({
  overview: OverviewTab,
  timeline: TimelineTab,
  categories: CategoriesTab,
  badges: BadgesTab,
  review: ReviewTab,
});

export default function HistoryScreen() {
  const theme = useTheme();
  // 表示中タブのインデックスを保持
  const [index, setIndex] = useState(0);

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="学習履歴"
        // router.back() ではなくホームに直接戻る
        onBack={() => router.replace('/')}
      />
      {/* BottomNavigation によりスワイプでのタブ移動に対応 */}
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        sceneAnimationEnabled
      />
    </Screen>
  );
}

function OverviewTab() {
  const theme = useTheme();
  const [streak, setStreak] = useState(0);
  const [todayCorrect, setTodayCorrect] = useState(0);
  const [todayAttempts, setTodayAttempts] = useState(0);
  useEffect(() => {
    (async () => {
      const logs = await getLatestLearningLogs(1);
      const streakCount = await getLearningStreak();
      setStreak(streakCount);
      if (logs.length) {
        const answers = Object.values(logs[0].answers);
        const attempts = answers.reduce((a, c) => a + c.attempts, 0);
        const correct = answers.reduce((a, c) => a + c.correct, 0);
        setTodayAttempts(attempts);
        setTodayCorrect(correct);
      }
    })();
  }, []);
  return (
    <View style={styles.tabContent}>
      <Text>🔥 {streak} day streak</Text>
      <Text>
        今日の成績 {todayCorrect}/{todayAttempts}
      </Text>
      <ProgressBar
        progress={todayAttempts ? todayCorrect / todayAttempts : 0}
        style={styles.marginTop}
        color={theme.colors.primary}
      />
    </View>
  );
}

function TimelineTab() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await getLatestLearningLogs(35);
      setLogs(rows);
    })();
  }, []);

  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of logs) {
      map[log.learning_date] = Object.keys(log.answers).length;
    }
    return map;
  }, [logs]);

  return (
    <FlatList
      style={styles.tabContent}
      data={logs}
      keyExtractor={(item) => item.learning_date}
      ListHeaderComponent={<LearningCalendar logs={countMap} />}
      renderItem={({ item }) => (
        <List.Item
          title={item.learning_date}
          description={`解答数 ${Object.keys(item.answers).length}`}
        />
      )}
    />
  );
}

function CategoriesTab() {
  const [stats, setStats] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await getCategoryStats();
      setStats(rows);
    })();
  }, []);
  return (
    <FlatList
      style={styles.tabContent}
      data={stats}
      keyExtractor={(item) => item.category}
      renderItem={({ item }) => (
        <List.Item
          title={`${item.category}`}
          description={`正答率 ${(item.accuracy * 100).toFixed(0)}%`}
        />
      )}
    />
  );
}

function BadgesTab() {
  const [badges, setBadges] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await getAllBadgesWithStatus();
      setBadges(rows);
    })();
  }, []);
  return (
    <FlatList
      style={styles.tabContent}
      data={badges}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <List.Item
          title={item.name}
          description={item.earned ? '取得済み' : '未取得'}
        />
      )}
    />
  );
}

function ReviewTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const rows = await getDueReviewItems();
      setItems(rows);
    })();
  }, []);
  return (
    <View style={styles.tabContent}>
      <Button mode="contained" style={styles.marginBottom}>
        復習モード開始
      </Button>
      <FlatList
        data={items}
        keyExtractor={(item) => item.question_id}
        renderItem={({ item }) => (
          <List.Item
            title={item.question_id}
            description={`Next: ${item.next_review_at.slice(0, 10)}`}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 画面全体の配置調整
  screen: {
    flex: 1,
  },
  // 上マージン
  marginTop: {
    marginTop: 8,
  },
  // 下マージン
  marginBottom: {
    marginBottom: 8,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
});
