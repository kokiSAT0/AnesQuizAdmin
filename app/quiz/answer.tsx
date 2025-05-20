import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { getQuestionById, updateFavorite } from '@/src/utils/db';

export default function AnswerScreen() {
  // questionId: 今表示する解説対象のID
  // ids/current: 次の問題を出すための情報
  // selected: ユーザーが選んだ選択肢の番号一覧（カンマ区切り）
  const { questionId, ids, current, selected } = useLocalSearchParams<{
    correct: string;
    questionId: string;
    ids?: string;
    current?: string;
    selected?: string;
  }>();

  const [explanation, setExplanation] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [correct, setCorrect] = useState(false);

  const toggleFavorite = async () => {
    if (!questionId) return;
    const newFlag = !favorite;
    await updateFavorite(questionId, newFlag);
    setFavorite(newFlag);
  };

  useEffect(() => {
    // useEffect は画面表示後に実行される React の仕組みです
    // DB から解説文を読み込み、state に保存します
    (async () => {
      if (questionId) {
        const q = await getQuestionById(questionId);
        setExplanation(q?.explanation ?? '');
        setFavorite(q?.is_favorite ?? false);
        if (q) {
          const ans = selected
            ? selected
                .split(',')
                .filter(Boolean)
                .map((n) => parseInt(n, 10))
            : [];
          const sort = (arr: number[]) => [...arr].sort((a, b) => a - b);
          const isCorrect =
            sort(ans).join(',') === sort(q.correct_answers).join(',');
          setCorrect(isCorrect);
        }
      }
    })();
  }, [questionId, selected]);

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
      {/*
        画面上部に戻るボタンを配置します。
        押すと選択画面へ移動し、クイズを途中で終了できます。
      */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/select')}>
          <Feather name="arrow-left" size={28} color="#333" />
        </Pressable>
      </View>
      <Pressable onPress={toggleFavorite} style={styles.starIcon}>
        {favorite ? (
          <AntDesign name="star" size={24} color="#facc15" />
        ) : (
          <AntDesign name="staro" size={24} color="#333" />
        )}
      </Pressable>
      <Text style={styles.result}>{correct ? '正解！🎉' : '残念…'}</Text>
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
    position: 'relative',
  },
  // ヘッダ用スタイル。戻るボタンを左上に配置します
  header: { position: 'absolute', top: 24, left: 16 },
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
  starIcon: { position: 'absolute', top: 24, right: 24 },
});
