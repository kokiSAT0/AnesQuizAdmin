import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 各画面で独自ヘッダを作るため非表示
        animation: 'slide_from_right',
      }}
    />
  );
}
