import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getQuestionById } from '@/src/utils/db';

export default function AnswerScreen() {
  // correct: 問題が正解だったかどうか
  // questionId: 今表示する解説対象のID
  // ids/current: 次の問題を出すための情報
  const { correct, questionId, ids, current } = useLocalSearchParams<{
    correct: string;
    questionId: string;
    ids?: string;
    current?: string;
  }>();

  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    // useEffect は画面表示後に実行される React の仕組みです
    // DB から解説文を読み込み、state に保存します
    (async () => {
      if (questionId) {
        const q = await getQuestionById(questionId);
        setExplanation(q?.explanation ?? '');
      }
    })();
  }, [questionId]);

  const goNext = () => {
    // current は 0 始まりなので次の問題番号を +1 する
    const nextIndex = (current ? parseInt(current, 10) : 0) + 1;
    const list = ids?.split(',').filter(Boolean) ?? [];

    if (nextIndex < list.length) {
      // 問題がまだ残っていれば次の問題へ
      router.replace({
        pathname: '/quiz',
        params: { ids, current: String(nextIndex) },
      });
    } else {
      // すべて解き終わったら選択画面へ戻る
      router.replace('/select');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.result}>
        {correct === 'true' ? '正解！🎉' : '残念…'}
      </Text>
      <Text style={styles.explain}>{explanation}</Text>
      <TouchableOpacity style={styles.btn} onPress={goNext}>
        <Text style={styles.btnTxt}>次の問題へ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  result: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  explain: { fontSize: 16, lineHeight: 22, marginBottom: 40 },
  btn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 8 },
  btnTxt: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
