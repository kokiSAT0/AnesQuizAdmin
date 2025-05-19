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
import { getQuestionById } from '@/src/utils/db';
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
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

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
    if (q) setQuestion(q);
  };

  const onSubmit = () => {
    if (selected === null || !question) return;
    const correct = question.correct_answers.includes(selected);
    setIsAnswered(true);
    setTimeout(() => {
      router.push({
        pathname: '/quiz/answer',
        params: {
          correct: String(correct),
          // 今回答えた問題のIDと次に表示する情報を渡す
          questionId: question.id,
          ids: ids ?? '',
          current: String(currentIndex),
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
        <Pressable onPress={() => router.back()}>
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
        <AntDesign name="star" size={24} color="#333" style={styles.starIcon} />
      </View>

      {/* ───────── 選択肢 ───────── */}
      {question.options.map((opt, idx) => {
        const chosen = selected === idx;
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.optionBtn, chosen && styles.optionChosen]}
            onPress={() => setSelected(idx)}
            disabled={isAnswered}
          >
            <Text style={styles.optionTxt}>{opt}</Text>
          </TouchableOpacity>
        );
      })}

      {/* ───────── 解答ボタン ───────── */}
      <TouchableOpacity
        style={[styles.submitBtn, selected === null && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={selected === null}
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
