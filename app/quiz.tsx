import React, { useState } from 'react';
import { router } from 'expo-router';
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

const { width } = Dimensions.get('window');

/* ===  仮データ  ====================== */
const total = 30;
const questionObj = {
  text: '一般的な全身麻酔導入に用いられる\n鎮静薬を1つ選べ',
  options: ['フェンタニル', 'プロポフォール', 'ロクロニウム', '生ける屍の水薬'],
  correctIndex: 1,
};
/* ==================================== */

export default function Quiz() {
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const current = 2; // ←本来はパラメータなどから取得

  /* 解答確定 */
  const onSubmit = () => {
    if (selected === null) return;

    const correct = selected === questionObj.correctIndex;
    setIsAnswered(true);

    // 0.5 s 後に解説画面へ遷移（UX のためワンテンポ置く）
    setTimeout(() => {
      router.push({
        pathname: '/result',
        params: { correct: String(correct) },
      });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ───────── ヘッダ ───────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="menu" size={28} color="#333" />
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
        <Text style={styles.questionTxt}>{questionObj.text}</Text>
        <AntDesign
          name="star"
          size={24}
          color="#333"
          style={{ position: 'absolute', top: 12, right: 12 }}
        />
      </View>

      {/* ───────── 選択肢 ───────── */}
      {questionObj.options.map((opt, idx) => {
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
});
