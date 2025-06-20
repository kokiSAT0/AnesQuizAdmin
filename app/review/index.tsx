import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { Button, Text, useTheme } from 'react-native-paper';
import { fetchDueList, saveReviewResult } from '@/src/utils/db/index';
import type { ReviewQuestion } from '@/src/utils/db/index';

export default function ReviewScreen() {
  const theme = useTheme();
  const [list, setList] = useState<ReviewQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const rows = await fetchDueList();
      setList(rows);
      setLoaded(true);
    })();
  }, []);

  const onQuality = async (q: number) => {
    const question = list[current];
    await saveReviewResult(question.id, q);
    const next = current + 1;
    if (next < list.length) {
      setCurrent(next);
    } else {
      router.replace('/review/summary');
    }
  };

  if (!loaded) {
    return (
      <Screen
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <AppHeader title="復習モード" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text>読み込み中...</Text>
        </View>
      </Screen>
    );
  }

  if (list.length === 0) {
    return (
      <Screen
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <AppHeader title="復習モード" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text>今日は復習すべき問題はありません</Text>
          <Button
            onPress={() => router.replace('/select')}
            style={styles.marginTop}
          >
            通常モード
          </Button>
        </View>
      </Screen>
    );
  }

  const q = list[current];

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title={`復習 ${current + 1} / ${list.length}`}
        onBack={() => router.back()}
      />
      <View style={styles.center}>
        <Text style={styles.question}>{q.question}</Text>
        <Button
          mode="contained"
          onPress={() => onQuality(2)}
          style={styles.btn}
        >
          Hard
        </Button>
        <Button
          mode="contained"
          onPress={() => onQuality(4)}
          style={styles.btn}
        >
          Good
        </Button>
        <Button
          mode="contained"
          onPress={() => onQuality(5)}
          style={styles.btn}
        >
          Easy
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 画面全体
  screen: {
    flex: 1,
  },
  // 余白用
  marginTop: { marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  question: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  btn: { marginVertical: 4, width: 200 },
});
