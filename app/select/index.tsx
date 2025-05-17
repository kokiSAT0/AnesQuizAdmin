import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { router } from 'expo-router';
import { getAllQuestionIds } from '@/src/utils/db';

export default function SelectScreen() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getAllQuestionIds();
        setIds(list);
      } catch (e) {
        console.error('ID 取得失敗', e);
      }
    })();
  }, []);

  const startQuiz = () => {
    if (ids.length === 0) return;
    router.push({ pathname: '/quiz', params: { ids: ids.join(',') } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>クイズ選択画面</Text>
      <Button title="クイズ開始" onPress={startQuiz} disabled={ids.length === 0} />
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
});
