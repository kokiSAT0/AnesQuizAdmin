import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  useTheme,
  ProgressBar,
  List,
  Button,
  SegmentedButtons,
  // Tab 表示に必要なコンポーネント
  TabView,
  TabBar,
} from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import {
  getLatestLearningLogs,
  getCategoryStats,
  getLearningStreak,
  getAllBadgesWithStatus,
  getDueReviewItems,
} from '@/src/utils/db/index';

export default function HistoryScreen() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'overview', title: 'Overview' },
    { key: 'timeline', title: 'Timeline' },
    { key: 'categories', title: 'Categories' },
    { key: 'badges', title: 'Badges' },
    { key: 'review', title: 'Review' },
  ]);

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'overview':
        return <OverviewTab />;
      case 'timeline':
        return <TimelineTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'badges':
        return <BadgesTab />;
      case 'review':
        return <ReviewTab />;
      default:
        return null;
    }
  };

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader title="学習履歴" onBack={() => router.back()} />

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={[styles.tabBar, { backgroundColor: theme.colors.primary }]}
          />
        )}
      />
      {renderScene({ route: routes[index] })}
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
      const rows = await getLatestLearningLogs(30);
      setLogs(rows);
    })();
  }, []);

  return (
    <FlatList
      style={styles.tabContent}
      data={logs}
      keyExtractor={(item) => item.learning_date}
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
  // TabBar の基本スタイル
  tabBar: {},
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
