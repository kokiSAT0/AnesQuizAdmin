import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Pressable,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import {
  getQuestionIdsByDifficulty,
  countQuestionsByDifficulty,
} from '@/src/utils/db';

// 選択可能な難易度のリスト
const LEVELS = ['初級', '中級', '上級'] as const;
type Level = (typeof LEVELS)[number];

// 簡易チェックボックスコンポーネント
function CheckBox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <View style={[styles.checkBox, checked && styles.checked]} />
      <Text style={styles.checkLabel}>{label}</Text>
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
    <View style={styles.container}>
      <Text style={styles.title}>クイズ選択画面</Text>
      {LEVELS.map((lv) => (
        <CheckBox
          key={lv}
          label={lv}
          checked={selected.includes(lv)}
          onToggle={() => toggleLevel(lv)}
        />
      ))}
      <View style={styles.randomRow}>
        <Text style={styles.randomLabel}>ランダムに出題する</Text>
        <Switch value={random} onValueChange={setRandom} />
      </View>
      {/* 選択条件に合致する問題数を表示 */}
      <Text style={styles.countText}>該当問題数: {matchCount} 件</Text>
      <Button title="クイズ開始" onPress={startQuiz} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#60a5fa',
  },
  checkLabel: {
    fontSize: 18,
  },
  randomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  randomLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  countText: {
    marginVertical: 8,
    fontSize: 16,
  },
});
