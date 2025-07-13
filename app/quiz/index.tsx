// app/quiz/index.tsx
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Text, Button, useTheme } from 'react-native-paper';
import { PaperPressable } from '@/components/PaperPressable';
import { ResponsiveText } from '@/components/ResponsiveText';
import { createQuestionTextStyle } from '@/components/TextStyles';
import { AntDesign } from '@expo/vector-icons';
import {
  getQuestionById,
  updateLearningDailyLog,
  recordAnswer,
  recordFirstAttempt,
} from '@/src/utils/db/index';
import { useQuestionActions } from '@/hooks/useQuestionActions';
// 問題データの型
import type { Question } from '@/types/question';

const { width } = Dimensions.get('window');
const FOOTER_HEIGHT = 64;

// カード枠色を決める関数
const getCardBorderColor = (
  type: Question['type'],
  theme: ReactNativePaper.Theme,
) => {
  return type === 'multiple_choice'
    ? theme.colors.error // MD3 の error (赤系)
    : theme.colors.outline; // 既定（グレー）
};

export default function Quiz() {
  const theme = useTheme();
  const tStyles = createQuestionTextStyle(theme);
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
  // ユーザーが選択した選択肢の「元の」番号を保存
  const [selected, setSelected] = useState<number[]>([]);
  // 表示用にシャッフルした選択肢を保持
  const [shuffledOptions, setShuffledOptions] = useState<
    { idx: number; text: string }[]
  >([]);
  const [isAnswered, setIsAnswered] = useState(false);

  // 選択肢をタップした時の処理
  const toggleSelect = (origIdx: number) => {
    if (!question) return;
    if (question.type === 'multiple_choice') {
      // multiple_choice は複数選択できる形式です
      setSelected((prev) =>
        prev.includes(origIdx)
          ? prev.filter((n) => n !== origIdx)
          : [...prev, origIdx],
      );
    } else {
      // 単一選択の場合は 1 つだけ保持します
      setSelected([origIdx]);
    }
  };

  // 共通処理をカスタムフックに委譲
  const { toggleFavorite, toggleUsed } = useQuestionActions({
    question,
    setQuestion,
  });

  useEffect(() => {
    if (typeof ids === 'string') {
      // クエリ文字列 "1,2,3" を ["1", "2", "3"] のような配列に変換
      const list = ids.split(',').filter(Boolean);
      setQuestionIds(list);

      // current が無ければ 0 (最初の問題) を使います
      const idx = current ? parseInt(current, 10) : 0;
      setCurrentIndex(idx);

      // その番号の問題を読み込み
      if (list[idx]) {
        loadQuestion(list[idx]);
      }
    }
  }, [ids, current]);

  // SQLite から指定IDの問題を読み込む
  const loadQuestion = async (id: string) => {
    // 指定IDの問題を読み込み
    const q = await getQuestionById(id);
    if (q) {
      setQuestion(q);
      // 選択肢を表示用にシャッフル
      const opts = q.options.map((text, idx) => ({ idx, text }));
      // sort() にランダム値を返す関数を渡して順序を入れ替え
      opts.sort(() => Math.random() - 0.5);
      setShuffledOptions(opts); // シャッフル済みの配列を保持
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
    setIsAnswered(true);
    // 解答結果を DB に保存します。void で非同期実行
    void updateLearningDailyLog(question.id, correct);

    // 初回解答なら SQLite の記録を行います
    if (question.first_attempt_correct === null) {
      // SQLite 側に初回正誤と日時を登録
      void recordFirstAttempt(question.id, correct);
      // 既存関数を使って統計(解答数/正解数)も更新
      void recordAnswer(question.id, correct);

      // 状態も更新して画面に反映
      setQuestion({
        ...question,
        first_attempt_correct: correct,
        first_attempted_at: new Date().toISOString(),
      });
    } else {
      // 2 回目以降は単に統計を更新
      void recordAnswer(question.id, correct);
    }
    // 少し待ってから解説画面へ
    setTimeout(() => {
      // 解説画面に渡すパラメータを準備
      router.push({
        pathname: '/quiz/answer',
        params: {
          questionId: question.id,
          ids: ids ?? '',
          current: String(currentIndex),
          selected: selected.join(','),
          // シャッフル後の順番を文字列化して渡す
          order: shuffledOptions.map((o) => o.idx).join(','),
        },
      });
    }, 500);
  };

  if (!question) {
    return (
      <View style={styles.center}>
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
        // 戻るボタンでホーム画面へ遷移
        onBack={() => router.replace('/')}
        rightIcon="cog"
        onRightPress={() => router.push('/settings')}
      />
      {/* ───────── 固定ヘッダー ここまで───────── */}

      {/* ───────── スクロール可能コンテンツ ───────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: FOOTER_HEIGHT + insets.bottom },
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
            style={[
              styles.progressBar,
              {
                width: `${(currentNo / total) * 100}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>

        {/* ───────── 問題カード ───────── */}
        <View
          style={[
            styles.card,
            { borderColor: getCardBorderColor(question.type, theme) },
          ]}
        >
          {/* ─ カテゴリ表示 ─ */}
          <View style={styles.categoryRow}>
            {question.categories.map((cat) => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>

          <ResponsiveText text={question.question} style={tStyles.question} />
          <PaperPressable onPress={toggleUsed} style={styles.usedBtn}>
            {question.is_used ? (
              <AntDesign
                name="checkcircle"
                size={24}
                color={theme.colors.onBackground}
              />
            ) : (
              <AntDesign
                name="closecircleo"
                size={24}
                color={theme.colors.onBackground}
              />
            )}
          </PaperPressable>
          <PaperPressable onPress={toggleFavorite} style={styles.favoriteBtn}>
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
          </PaperPressable>
        </View>

        {/* ───────── 選択肢 ───────── */}
        {shuffledOptions.map((opt) => {
          const chosen = selected.includes(opt.idx);
          // ❶ Material 3 既存トークンで色セットを決める
          const bg = chosen
            ? theme.colors.primary
            : theme.colors.secondaryContainer; // 少し濃いグレー
          const fg = chosen
            ? theme.colors.onPrimary
            : theme.colors.onSecondaryContainer; // ⿊に近い文字⾊
          return (
            <PaperPressable
              key={opt.idx}
              style={[
                styles.choice,
                { width: width * 0.9, backgroundColor: bg },
              ]}
              onPress={() => toggleSelect(opt.idx)}
              disabled={isAnswered}
            >
              <ResponsiveText
                text={opt.text}
                style={[styles.choiceText, { color: fg }]}
              />
            </PaperPressable>
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
  // ローディング時中央寄せ
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // 進捗バー外枠
  progressBarTrack: {
    borderRadius: 4,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  // 進捗バー本体
  progressBar: {
    height: 4,
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

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 8,
    left: 8,
    right: 48,
  },
  categoryChip: {
    backgroundColor: '#E0E0E0', // お好みで
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#444', // テーマに無ければ '#fff' など
  },

  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  usedBtn: {
    position: 'absolute',
    top: 12,
    right: 48,
  },
  choice: {
    alignSelf: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  choiceText: {
    fontSize: 18,
    fontWeight: '400',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  answerBtn: {
    alignSelf: 'center',
    marginTop: 16,
  },
});
