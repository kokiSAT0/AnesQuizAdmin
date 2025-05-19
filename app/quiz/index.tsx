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
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (typeof ids === 'string') {
      const list = ids.split(',').filter(Boolean);
      setQuestionIds(list);
      if (list[0]) {
        loadQuestion(list[0]);
      }
    }
  }, [ids]);

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
        pathname: '/result',
        params: { correct: String(correct) },
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
  const current = 1; // 今回は1問目のみ表示

  return (
    <SafeAreaView style={styles.root}>
      {/* ───────── ヘッダ ───────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={28} color="#333" />
        </Pressable>
        <Text
          style={styles.headerTitle}
        >{`クイズ（${current} / ${total}）`}</Text>
        <AntDesign name="user" size={28} color="#333" />
      </View>

      {/* 進捗バー */}
      <View style={styles.progressBg}>
        <View
          style={[styles.progressFg, { width: `${(current / total) * 100}%` }]}
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
