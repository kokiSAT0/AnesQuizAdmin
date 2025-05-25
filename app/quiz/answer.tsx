// app/quiz/answer.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, useTheme } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import { AppHeader } from '@/components/AppHeader';
import { getQuestionById, updateFavorite } from '@/src/utils/db';

const { width } = Dimensions.get('window');

export default function AnswerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  /* ───── URL パラメータ ───── */
  const { questionId, ids, current, selected } = useLocalSearchParams<{
    questionId: string;
    ids?: string;
    current?: string;
    selected?: string;
  }>();

  /* ───── state ───── */
  const [question, setQuestion] = useState<Awaited<
    ReturnType<typeof getQuestionById>
  > | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  /* ───── DB から問題を取得 ───── */
  useEffect(() => {
    if (questionId)
      void (async () => {
        const q = await getQuestionById(questionId);
        setQuestion(q);
        setIsFavorite(q?.is_favorite ?? false);
      })();
  }, [questionId]);

  /* ───── 正解判定／ユーザー選択配列 ───── */
  const userChoices = useMemo<number[]>(() => {
    if (!selected) return [];
    return selected
      .split(',')
      .filter(Boolean)
      .map((n) => parseInt(n, 10));
  }, [selected]);

  const isCorrect = useMemo(() => {
    if (!question) return false;
    const sort = (arr: number[]) => [...arr].sort((a, b) => a - b);
    return (
      sort(userChoices).join(',') === sort(question.correct_answers).join(',')
    );
  }, [question, userChoices]);

  /* ───── お気に入り切替 ───── */
  const toggleFavorite = async () => {
    if (!question) return;
    const next = !isFavorite;
    await updateFavorite(question.id, next);
    setIsFavorite(next);
  };

  /* ───── 次の問題へ ───── */
  const goNext = () => {
    const nextIndex = (current ? parseInt(current, 10) : 0) + 1;
    const list = ids?.split(',').filter(Boolean) ?? [];
    if (nextIndex < list.length) {
      router.replace({
        pathname: '/quiz',
        params: { ids, current: String(nextIndex) },
      });
    } else {
      router.replace('/select');
    }
  };

  if (!question) {
    return (
      <View style={styles.center}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  /* ───── タグ文字列 (#tag1 #tag2) ───── */
  const tagChips = JSON.parse(question.tag_json ?? '[]') as string[];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ─── ヘッダー ─── */}
      <AppHeader
        title={isCorrect ? '正解！' : '不正解'}
        onBack={() => router.replace('/select')}
        rightIcon="cog"
        onRightPress={() => router.push('/settings')}
      />

      {/* ─── スクロール領域 ─── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 56 + insets.top + 12 },
        ]}
      >
        {/* ───── 問題カード（位置・サイズは quiz/index と同じ） ───── */}
        <View style={[styles.card, { borderColor: theme.colors.outline }]}>
          <Text style={styles.question}>{question.question}</Text>
          <Pressable onPress={toggleFavorite} style={styles.favoriteBtn}>
            {question.is_favorite ? (
              <AntDesign
                name="star"
                size={24}
                color={theme.colors.onBackground}
              />
            ) : (
              <AntDesign
                name="staro"
                size={24}
                color={theme.colors.onBackground}
              />
            )}
          </Pressable>
        </View>

        {/* ───── 選択肢 ───── */}
        {question.options.map((opt, idx) => {
          const isAnswer = question.correct_answers.includes(idx);
          const isUserWrong = userChoices.includes(idx) && !isAnswer;
          const bg = isAnswer
            ? '#4CAF50'
            : isUserWrong
              ? '#E53935'
              : theme.colors.secondaryContainer;

          return (
            <View
              key={idx}
              style={[
                styles.choice,
                { width: width * 0.9, backgroundColor: bg },
              ]}
            >
              <Text style={styles.choiceText}>{opt}</Text>
            </View>
          );
        })}

        {/* ───── 解説カード ───── */}
        <View
          style={[styles.explainCard, { borderColor: theme.colors.outline }]}
        >
          {/* タグ表示 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tagChips.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 解説本文 */}
          <Text style={styles.explanation}>解説：{question.explanation}</Text>
        </View>
      </ScrollView>
      {/* ───────── 固定フッター ───────── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        {/* ───── 次の問題ボタン ───── */}
        <Button
          mode="contained"
          onPress={goNext}
          style={[styles.nextBtn, { width: width * 0.9 }]}
        >
          次の問題へ
        </Button>
      </View>
    </View>
  );
}

/* ──────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingBottom: 32 },

  card: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
  question: { textAlign: 'center', lineHeight: 24 },

  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  choice: {
    alignSelf: 'center',
    paddingVertical: 16,
    marginVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  choiceText: { fontSize: 18, fontWeight: '600', color: '#fff' },

  explainCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  tagChip: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 12, color: '#444' },

  explanation: { fontSize: 16, lineHeight: 24 },

  nextBtn: { alignSelf: 'center', marginTop: 24 },
});
