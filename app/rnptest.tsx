import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card, Button, TextInput, Text } from 'react-native-paper';

// react-native-paper と nativewind の組み合わせ確認用ページ
// それぞれのコンポーネントが表示されれば環境構築は成功しています
export default function PaperNativewindTest() {
  // 入力された文字列を保持するステート
  // 「ステート」とは、コンポーネント内で変化する値を保持する仕組みです
  const [value, setValue] = useState('');

  return (
    // className に Tailwind CSS のクラスを指定
    <Screen className="items-center justify-center bg-blue-50">
      {/* Card はカード型の表示コンポーネントです */}
      <Card className="w-full max-w-md">
        <Card.Title title="テストページ" />
        <Card.Content>
          {/* TextInput は入力欄を表示します */}
          <TextInput
            label="入力してみてください"
            value={value}
            onChangeText={setValue}
            className="mb-4"
          />
          {/* Button は押せるボタンを表示します */}
          <Button mode="contained" onPress={() => {}}>
            Paper ボタン
          </Button>
        </Card.Content>
      </Card>
      {/* 入力内容を表示する例 */}
      <Text className="mt-4">現在の入力: {value}</Text>
    </Screen>
  );
}
