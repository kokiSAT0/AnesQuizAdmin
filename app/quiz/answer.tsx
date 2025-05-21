import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, ScrollView, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text, Button } from 'react-native-paper';
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
    <Screen className="bg-white">
      {/*
        画面上部の戻るボタン。押すと選択画面へ戻ります。
        「Pressable」はタップを検知するためのコンポーネントです。
      */}
      <View className="absolute top-6 left-4">
        <Pressable onPress={() => router.replace('/select')}>
          <Feather name="arrow-left" size={28} color="#333" />
        </Pressable>
      </View>

      {/* お気に入り切り替えアイコン */}
      <Pressable onPress={toggleFavorite} className="absolute top-6 right-4">
        {favorite ? (
          <AntDesign name="star" size={24} color="#facc15" />
        ) : (
          <AntDesign name="staro" size={24} color="#333" />
        )}
      </Pressable>

      <View className="flex-1 justify-center">
        {/* 正解・不正解の表示 */}
        <Text variant="headlineMedium" className="text-center mb-6">
          {correct ? '正解！🎉' : '残念…'}
        </Text>

        {/* 解説文。長い場合にスクロールできるよう ScrollView を使用 */}
        <ScrollView className="mb-8">
          <Text className="text-base leading-6">{explanation}</Text>
        </ScrollView>

        {/* 次の問題へ進むボタン */}
        <Button
          mode="contained"
          onPress={goNext}
          className="self-center w-full max-w-sm"
        >
          次の問題へ
        </Button>
      </View>
    </Screen>
  );
}
