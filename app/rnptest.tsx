import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card, Button, TextInput, Text, useTheme } from 'react-native-paper';

// react-native-paper の表示確認用ページ
// それぞれのコンポーネントが表示されれば環境構築は成功しています
export default function PaperNativewindTest() {
  // 入力された文字列を保持するステート
  // 「ステート」とは、コンポーネント内で変化する値を保持する仕組みです
  const [value, setValue] = useState('');
  const theme = useTheme();

  return (
    <Screen
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      {/* Card はカード型の表示コンポーネントです */}
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Card.Title title="テストページ" />
        <Card.Content>
          {/* TextInput は入力欄を表示します */}
          <TextInput
            label="入力してみてください"
            value={value}
            onChangeText={setValue}
            style={{ marginBottom: 16 }}
          />
          {/* Button は押せるボタンを表示します */}
          <Button mode="contained" onPress={() => {}}>
            Paper ボタン
          </Button>
        </Card.Content>
      </Card>
      {/* 入力内容を表示する例 */}
      <Text style={{ marginTop: 16 }}>現在の入力: {value}</Text>
    </Screen>
  );
}
