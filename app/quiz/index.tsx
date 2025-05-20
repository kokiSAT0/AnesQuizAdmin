import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import {
  getQuestionById,
  updateLearningDailyLog,
  recordAnswer,
  updateFavorite,
} from '@/src/utils/db';

import type { Question } from '@/types/firestore';

const { width } = Dimensions.get('window');

export default function Quiz() {
  // ids: 出題する問題IDの一覧
  // current: 現在の問題番号（0始まり）をクエリから取得
  const { ids, current } = useLocalSearchParams<{
    ids?: string;
    current?: string;
  }>();
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 今何問目かを記憶
  const [question, setQuestion] = useState<Question | null>(null);
  // 選択した選択肢の番号を保持します
  const [selected, setSelected] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);

  // 選択肢をタップした時の処理
  const toggleSelect = (idx: number) => {
    if (!question) return;
    if (question.type === 'multiple_choice') {
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((n) => n !== idx) : [...prev, idx],
      );
    } else {
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
      // クエリ文字列からID一覧を配列に変換
      const list = ids.split(',').filter(Boolean);
      setQuestionIds(list);

      // current が無ければ 0 (最初の問題) を採用
      const idx = current ? parseInt(current, 10) : 0;
      setCurrentIndex(idx);

      // その番号の問題を読み込む
      if (list[idx]) {
        loadQuestion(list[idx]);
      }
    }
  }, [ids, current]);

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
    // 選択された番号と正解番号を昇順で比較し、完全一致なら正解とする
    const sort = (arr: number[]) => [...arr].sort((a, b) => a - b);
    const correct =
      sort(selected).join(',') === sort(question.correct_answers).join(',');
    setIsAnswered(true);
    // 日次ログに解答結果を保存（失敗してもアプリは続行）
    void updateLearningDailyLog(question.id, correct);
    // 問題テーブルの統計も更新
    void recordAnswer(question.id, correct);
    setTimeout(() => {
      router.push({
        pathname: '/quiz/answer',
        params: {
          // 今回答えた問題のIDと次に表示する情報を渡す
          questionId: question.id,
          ids: ids ?? '',
          current: String(currentIndex),
          // ユーザーが選んだ選択肢を文字列で渡す
          selected: selected.join(','),
        },
      });
    }, 500);
  };

  if (!question) {
    return (
      <View style={styles.loading}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  const total = questionIds.length;
  // 表示用の番号。0 始まりの currentIndex に 1 を足す
  // 変数名が上のクエリと被らないよう currentNo にしています
  const currentNo = currentIndex + 1;

  return (
    <SafeAreaView style={styles.root}>
      {/* ───────── ヘッダ ───────── */}
      <View style={styles.header}>
        {/*
          戻るボタンを押したら選択画面へ遷移させます。
          router.replace を使うと履歴が残らないため、
          ユーザーが無駄に戻る操作をしなくて済みます。
        */}
        <Pressable onPress={() => router.replace('/select')}>
          <Feather name="arrow-left" size={28} color="#333" />
        </Pressable>
        <Text
          style={styles.headerTitle}
        >{`クイズ（${currentNo} / ${total}）`}</Text>
        <AntDesign name="user" size={28} color="#333" />
      </View>

      {/* 進捗バー */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFg,
            { width: `${(currentNo / total) * 100}%` },
          ]}
        />
      </View>

      {/* ───────── 問題カード ───────── */}
      <View style={styles.card}>
        <Text style={styles.questionTxt}>{question.question}</Text>
        <Pressable onPress={toggleFavorite} style={styles.starIcon}>
          {question.is_favorite ? (
            <AntDesign name="star" size={24} color="#facc15" />
          ) : (
            <AntDesign name="staro" size={24} color="#333" />
          )}
        </Pressable>
      </View>

      {/* ───────── 選択肢 ───────── */}
      {question.options.map((opt, idx) => {
        const chosen = selected.includes(idx);
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.optionBtn, chosen && styles.optionChosen]}
            onPress={() => toggleSelect(idx)}
            disabled={isAnswered}
          >
            <Text style={styles.optionTxt}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {/* ───────── 解答ボタン ───────── */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          selected.length === 0 && styles.submitDisabled,
        ]}
        onPress={onSubmit}
        disabled={selected.length === 0}
      >
        <Text style={styles.submitTxt}>解答する</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const baseBtn = {
  width: width * 0.9,
  alignSelf: 'center' as const,
  paddingVertical: 18,
  borderRadius: 9999,
  marginVertical: 8,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  progressBg: {
    height: 4,
    backgroundColor: '#eee',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressFg: { height: 4, backgroundColor: '#3b82f6', borderRadius: 2 },
  card: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    minHeight: 140,
    justifyContent: 'center',
  },
  questionTxt: { fontSize: 18, textAlign: 'center', lineHeight: 26 },
  optionBtn: { ...baseBtn, backgroundColor: '#cffafe' },
  optionChosen: { backgroundColor: '#7dd3fc' },
  optionTxt: { fontSize: 18, color: '#fff', fontWeight: '600' },
  submitBtn: { ...baseBtn, backgroundColor: '#86efac', marginTop: 16 },
  submitDisabled: { backgroundColor: '#d1d5db' },
  submitTxt: { fontSize: 18, color: '#fff', fontWeight: '700' },
  starIcon: { position: 'absolute', top: 12, right: 12 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
