// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { getQuestionById, writeAnswerLog } from '@/lib/firebase'; // パスはエイリアスに合わせて調整

export default function FirestoreTest() {
  const [msg, setMsg] = useState('Loading…');

  // an0000001 を読んで表示
  useEffect(() => {
    (async () => {
      const q = await getQuestionById('an0000001');
      setMsg(q ? q.question : 'Question not found');
    })();
  }, []);

  // 正解ログを書き込む
  const handlePress = async () => {
    await writeAnswerLog('an0000001', true);
    setMsg('writeAnswerLog() → committed!');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginBottom: 16 }}>{msg}</Text>
      <Button title="Write Log" onPress={handlePress} />
    </View>
  );
}
