import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Pressable, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text, Button, useTheme } from 'react-native-paper';
import { AntDesign, Feather } from '@expo/vector-icons';
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
    await updateFavorite(question.id, newFlag);
    setQuestion({ ...question, is_favorite: newFlag });
  };

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
    const q = await getQuestionById(id);
    if (q) {
      setQuestion(q);
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

    // 初回解答なら SQLite と Firestore の統計を更新
    if (question.first_attempt_correct === null) {
      // SQLite 側には初回正誤と日時を記録
      void recordFirstAttempt(question.id, correct);
      // Firestore の statistics も増加させる
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
    <Screen style={{ backgroundColor: theme.colors.background }}>
      {/* ───────── ヘッダ ───────── */}
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 戻るボタン。router.replace を使い履歴を残さない */}
        <Pressable onPress={() => router.replace('/select')}>
          <Feather
            name="arrow-left"
            size={28}
            color={theme.colors.onBackground}
          />
        </Pressable>
        <Text variant="titleMedium">{`クイズ（${currentNo} / ${total}）`}</Text>
        <AntDesign name="user" size={28} color={theme.colors.onBackground} />
      </View>

      {/* 進捗バー */}
      <View
        style={{
          height: 4,
          backgroundColor: theme.colors.surfaceVariant,
          marginBottom: 12,
          marginHorizontal: 16,
          borderRadius: 4,
        }}
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
      <View
        style={{
          margin: 16,
          padding: 24,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 16,
          minHeight: 140,
          justifyContent: 'center',
        }}
      >
        <Text style={{ textAlign: 'center', lineHeight: 24 }}>
          {question.question}
        </Text>
        <Pressable
          onPress={toggleFavorite}
          style={{ position: 'absolute', top: 12, right: 12 }}
        >
          {question.is_favorite ? (
            <AntDesign name="star" size={24} color={theme.colors.tertiary} />
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
            style={{
              width: width * 0.9,
              alignSelf: 'center',
              paddingVertical: 16,
              marginVertical: 8,
              borderRadius: 9999,
              alignItems: 'center',
              backgroundColor: chosen
                ? theme.colors.primary
                : theme.colors.secondaryContainer,
            }}
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

      {/* ───────── 解答ボタン ───────── */}
      <Button
        mode="contained"
        style={{ width: width * 0.9, alignSelf: 'center', marginTop: 16 }}
        onPress={onSubmit}
        disabled={selected.length === 0}
      >
        解答する
      </Button>
    </Screen>
  );
}
