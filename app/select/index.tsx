import React, { useState, useEffect } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Text, Button, Switch, Checkbox } from 'react-native-paper';
import { router } from 'expo-router';
import {
  getQuestionIdsByDifficulty,
  countQuestionsByDifficulty,
} from '@/src/utils/db';

// 選択可能な難易度のリスト
const LEVELS = ['初級', '中級', '上級'] as const;
type Level = (typeof LEVELS)[number];

// チェックボックス付きの行を表示するコンポーネント
// "コンポーネント" とは画面の部品をまとめた再利用可能な要素のことです
function CheckBoxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable className="flex-row items-center my-1" onPress={onToggle}>
      {/* react-native-paper の Checkbox を使用 */}
      <Checkbox status={checked ? 'checked' : 'unchecked'} onPress={onToggle} />
      <Text className="ml-2 text-lg">{label}</Text>
    </Pressable>
  );
}

export default function SelectScreen() {
  const [selected, setSelected] = useState<Level[]>([]);
  const [random, setRandom] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);

  // 選択が変わるたびに件数を再計算する
  useEffect(() => {
    (async () => {
      const count = await countQuestionsByDifficulty(selected);
      setMatchCount(count);
    })();
  }, [selected]);

  const toggleLevel = (level: Level) => {
    setSelected((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const startQuiz = async () => {
    try {
      const ids = await getQuestionIdsByDifficulty(selected);
      if (ids.length === 0) {
        Alert.alert('該当する問題がありません');
        return;
      }
      if (random) {
        ids.sort(() => Math.random() - 0.5);
      }
      router.push({ pathname: '/quiz', params: { ids: ids.join(',') } });
    } catch (e) {
      // eslint-disable-next-line no-console
      if (__DEV__) console.error('ID 取得失敗', e);
      Alert.alert('データ取得エラー', '問題一覧を読み込めませんでした。');
    }
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text variant="titleLarge" className="text-center mb-3">
        クイズ選択画面
      </Text>
      {LEVELS.map((lv) => (
        <CheckBoxRow
          key={lv}
          label={lv}
          checked={selected.includes(lv)}
          onToggle={() => toggleLevel(lv)}
        />
      ))}
      <View className="flex-row items-center my-2">
        <Text className="mr-2 text-base">ランダムに出題する</Text>
        <Switch value={random} onValueChange={setRandom} />
      </View>
      {/* 選択条件に合致する問題数を表示 */}
      <Text className="my-2 text-base">該当問題数: {matchCount} 件</Text>
      <View className="items-center space-y-2">
        <Button
          mode="contained"
          onPress={startQuiz}
          className="w-full max-w-sm"
        >
          クイズ開始
        </Button>
        {/* router.back() で前の画面へ戻ります */}
        <Button
          mode="outlined"
          onPress={() => router.back()}
          className="w-full max-w-sm"
        >
          戻る
        </Button>
      </View>
    </View>
  );
}
