// app/quiz/index.tsx
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Pressable,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Text, Button, useTheme } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import {
  getQuestionById,
  updateLearningDailyLog,
  recordAnswer,
  recordFirstAttempt,
  updateFavorite,
} from '@/src/utils/db';
import { incrementQuestionStatistics } from '@/lib/firebase';
import type { Question } from '@/types/firestore';

const { width } = Dimensions.get('window');

export default function Quiz() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // ids: 出題する問題ID一覧、current: 現在の問題番号（0始まり）
  const { ids, current } = useLocalSearchParams<{
    ids?: string;
    current?: string;
  }>();
  // 問題IDの一覧を保持します
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  // 今何問目を表示しているか記憶します
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  // ユーザーが選択した選択肢の番号を保存
  const [selected, setSelected] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  // 選択肢をタップした時の処理
  const toggleSelect = (idx: number) => {
    if (!question) return;
    console.info('select choice', idx);
    if (question.type === 'multiple_choice') {
      // multiple_choice は複数選択できる形式です
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((n) => n !== idx) : [...prev, idx],
      );
    } else {
      // 単一選択の場合は 1 つだけ保持します
      setSelected([idx]);
    }
  };

  // お気に入り切り替え
  const toggleFavorite = async () => {
    if (!question) return;
    const newFlag = !question.is_favorite;
    console.info('toggle favorite', { id: question.id, flag: newFlag });
    // まずローカル SQLite を更新（await で完了を待つ）
    try {
      await updateFavorite(question.id, newFlag);
    } catch (err) {
      console.error('お気に入り更新失敗', err);
      return;
    }
    setQuestion((prev) => (prev ? { ...prev, is_favorite: newFlag } : prev));
  };

  useEffect(() => {
    if (typeof ids === 'string') {
      // クエリ文字列 "1,2,3" を ["1", "2", "3"] のような配列に変換
      const list = ids.split(',').filter(Boolean);
      setQuestionIds(list);

      console.info('quiz ids', list);

      // current が無ければ 0 (最初の問題) を使います
      const idx = current ? parseInt(current, 10) : 0;
      setCurrentIndex(idx);
      console.info('current index', idx);

      // その番号の問題を読み込み
      if (list[idx]) {
        loadQuestion(list[idx]);
      }
    }
  }, [ids, current]);

  // SQLite から指定IDの問題を読み込む
  const loadQuestion = async (id: string) => {
    console.info('load question', id);
    const q = await getQuestionById(id);
    if (q) {
      setQuestion(q);
      console.info('loaded question data');
      setSelected([]); // 新しい問題では選択をリセット
      setIsAnswered(false);
    }
  };

  // 解答ボタンが押されたときの処理
  const onSubmit = () => {
    if (!question || selected.length === 0) return;
    // 選択された番号と正解番号を昇順で比較し、完全一致なら正解
    const sort = (arr: number[]) => [...arr].sort((a, b) => a - b);
    const correct =
      sort(selected).join(',') === sort(question.correct_answers).join(',');
    console.info('submit answer', {
      id: question.id,
      selected,
      correct,
    });
    setIsAnswered(true);
    // 解答結果を DB に保存します。void で非同期実行
    void updateLearningDailyLog(question.id, correct);

    // 初回解答なら SQLite と Firestore の統計を更新
    if (question.first_attempt_correct === null) {
      // SQLite 側には初回正誤と日時を記録
      void recordFirstAttempt(question.id, correct);
      // Firestore の集計(questionStats)も増加させる
      void incrementQuestionStatistics(question.id, correct);

      // 状態も更新して画面に反映
      setQuestion({
        ...question,
        first_attempt_correct: correct,
        first_attempted_at: new Date().toISOString(),
      });
    }

    void recordAnswer(question.id, correct);
    // 少し待ってから解説画面へ
    setTimeout(() => {
      router.push({
        pathname: '/quiz/answer',
        params: {
          questionId: question.id,
          ids: ids ?? '',
          current: String(currentIndex),
          selected: selected.join(','),
        },
      });
    }, 500);
  };

  if (!question) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  const total = questionIds.length;
  // currentIndex は 0 始まりなので表示用に +1
  const currentNo = currentIndex + 1;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ───────── 固定ヘッダー ───────── */}
      <AppHeader
        title={`クイズ（${currentIndex + 1} / ${questionIds.length}）`}
        onBack={() => router.replace('/select')}
        rightIcon="cog"
        onRightPress={() => router.push('/settings')}
      />
      {/* ───────── 固定ヘッダー ここまで───────── */}

      {/* ───────── スクロール可能コンテンツ ───────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 56 + insets.top + 12 }, // 動的分だけ残す
        ]}
      >
        {/* 進捗バー */}

        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={{
              width: `${(currentNo / total) * 100}%`,
              height: 4,
              backgroundColor: theme.colors.primary,
              borderRadius: 4,
            }}
          />
        </View>

        {/* ───────── 問題カード ───────── */}
        <View style={[styles.card, { borderColor: theme.colors.outline }]}>
          <Text style={{ textAlign: 'center', lineHeight: 24 }}>
            {question.question}
          </Text>
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

        {/* ───────── 選択肢 ───────── */}
        {question.options.map((opt, idx) => {
          const chosen = selected.includes(idx);
          return (
            <Pressable
              key={idx}
              style={[
                styles.choice,
                {
                  width: width * 0.9,
                  backgroundColor: chosen
                    ? theme.colors.primary
                    : theme.colors.secondaryContainer,
                },
              ]}
              onPress={() => toggleSelect(idx)}
              disabled={isAnswered}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.colors.onPrimary,
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
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
        {/* ───────── 解答ボタン ───────── */}
        <Button
          mode="contained"
          style={[styles.answerBtn, { width: width * 0.9 }]}
          onPress={onSubmit}
          disabled={selected.length === 0}
        >
          解答する
        </Button>
      </View>
    </View>
  );
}

// Quiz.tsx 最下部
const styles = StyleSheet.create({
  /** 共通マージン・パディング */
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  progressBar: {
    height: 4,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 4,
  },
  card: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
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
  answerBtn: {
    alignSelf: 'center',
    marginTop: 16,
  },
});
