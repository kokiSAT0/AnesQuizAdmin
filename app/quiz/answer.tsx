// app/quiz/answer.tsx
// useRef を追加して後述の自動お気に入り処理で利用します

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { createQuestionTextStyle } from '@/components/TextStyles';
import { AntDesign } from '@expo/vector-icons';
import { AppHeader } from '@/components/AppHeader';
import { getQuestionById, updateFavorite, updateUsed } from '@/src/utils/db';

const { width } = Dimensions.get('window');
const FOOTER_HEIGHT = 64;

const pickPair = (theme: any, key: keyof typeof theme.colors) => ({
  bg: theme.colors[key],
  fg: theme.colors[
    ('on' + key[0].toUpperCase() + key.slice(1)) as keyof typeof theme.colors
  ],
});

export default function AnswerScreen() {
  const theme = useTheme();
  const tStyles = createQuestionTextStyle(theme);
  const insets = useSafeAreaInsets();

  /* ───── URL パラメータ ───── */
  const { questionId, ids, current, selected, order } = useLocalSearchParams<{
    questionId: string;
    ids?: string;
    current?: string;
    selected?: string;
    order?: string;
  }>();

  /* ───── state ───── */
  const [question, setQuestion] = useState<Awaited<
    ReturnType<typeof getQuestionById>
  > | null>(null);

  /* ───── DB から問題を取得 ───── */
  useEffect(() => {
    if (questionId)
      void (async () => {
        console.info('load answer question', questionId);
        const q = await getQuestionById(questionId);
        setQuestion(q);
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

  // 表示順を index.tsx と合わせるための配列
  const optionOrder = useMemo<number[]>(() => {
    if (!order) return [];
    return order
      .split(',')
      .filter(Boolean)
      .map((n) => parseInt(n, 10));
  }, [order]);

  const isCorrect = useMemo(() => {
    if (!question) return false;
    const sort = (arr: number[]) => [...arr].sort((a, b) => a - b);
    return (
      sort(userChoices).join(',') === sort(question.correct_answers).join(',')
    );
  }, [question, userChoices]);

  // 不正解だった場合は自動でお気に入りに追加します
  const didAutoFavorite = useRef(false);
  useEffect(() => {
    // 問題が存在し、不正解で、まだお気に入り登録されておらず、
    // かつ自動処理が未実行の場合のみ実行します

    if (
      question &&
      !isCorrect &&
      !question.is_favorite &&
      !didAutoFavorite.current
    ) {
      didAutoFavorite.current = true; // 連続実行を防ぐフラグ

      (async () => {
        try {
          await updateFavorite(question.id, true);
          // question ステートを更新して UI を即時反映
          setQuestion((prev) => (prev ? { ...prev, is_favorite: true } : prev));
        } catch (e) {
          console.error('自動お気に入り失敗', e);
        }
      })();
    }
  }, [question, isCorrect]);

  // 正誤でヘッダー背景色を切り替えます
  const headerColor = isCorrect
    ? theme.colors.categoryChipSelected
    : theme.colors.error;

  // 受け取った順序で選択肢を並べ替える
  const orderedOptions = useMemo(() => {
    if (!question) return [];
    // order が無い場合は元の並び
    if (optionOrder.length === 0) {
      return question.options.map((text, idx) => ({ idx, text }));
    }
    // order 配列に従ってオブジェクトを作成
    return optionOrder.map((idx) => ({ idx, text: question.options[idx] }));
  }, [question, optionOrder]);

  /* ───── お気に入り切替 ───── */
  const toggleFavorite = async () => {
    if (!question) return;

    const newFlag = !question.is_favorite;
    console.info('answer toggle favorite', { id: question.id, flag: newFlag });
    try {
      // SQLite に反映し、画面でも即時更新します
      await updateFavorite(question.id, newFlag);
      setQuestion((prev) => (prev ? { ...prev, is_favorite: newFlag } : prev));
    } catch (err) {
      console.error('お気に入り更新失敗', err);
    }
  };

  /* ───── 使用フラグ切替 ───── */
  const toggleUsed = async () => {
    if (!question) return;

    const newFlag = !question.is_used;
    console.info('answer toggle used', { id: question.id, flag: newFlag });
    try {
      await updateUsed(question.id, newFlag);
      setQuestion((prev) => (prev ? { ...prev, is_used: newFlag } : prev));
    } catch (err) {
      console.error('使用フラグ更新失敗', err);
    }
  };

  /* ───── 次の問題へ ───── */
  const goNext = () => {
    console.info('go next question');
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
  const tagChips = question.tags as string[];

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
        additionalStyles={{ backgroundColor: headerColor }}
      />

      {/* ─── スクロール領域 ─── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: FOOTER_HEIGHT + insets.bottom },
        ]}
      >
        {/* ───── 問題カード（位置・サイズは quiz/index と同じ） ───── */}
        <View style={[styles.card, { borderColor: theme.colors.outline }]}>
          {/* ─ カテゴリ表示 ─ */}
          <View style={styles.categoryRow}>
            {question.categories.map((cat) => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>

          <Text style={tStyles.question}>{question.question}</Text>
          <Pressable onPress={toggleUsed} style={styles.usedBtn}>
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
          </Pressable>
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
        {orderedOptions.map((opt) => {
          const isAnswer = question.correct_answers.includes(opt.idx);
          const isUserWrong = userChoices.includes(opt.idx) && !isAnswer;
          const { bg, fg } = isAnswer
            ? pickPair(theme, 'categoryChipSelected')
            : isUserWrong
              ? pickPair(theme, 'error')
              : pickPair(theme, 'secondaryContainer');

          return (
            <View
              key={opt.idx}
              style={[
                styles.choice,
                { width: width * 0.9, backgroundColor: bg },
              ]}
            >
              <Text style={[styles.choiceText, { color: fg }]}>{opt.text}</Text>
            </View>
          );
        })}

        {/* ───── 解説カード ───── */}
        <View
          style={[styles.explainCard, { borderColor: theme.colors.outline }]}
        >
          {/* ① タグを 1 行で横並び表示 */}
          <View style={styles.tagRow}>
            {tagChips.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag} </Text>
              </View>
            ))}
          </View>

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
            borderTopColor: theme.colors.outline,
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

  question: { textAlign: 'center', lineHeight: 24 },

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

  explainCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap', // 折り返させたくない場合
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: { fontSize: 12, color: '#444' },

  explanation: { fontSize: 16, lineHeight: 24 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    alignItems: 'center',
  },

  nextBtn: { alignSelf: 'center', marginTop: 24 },
});
