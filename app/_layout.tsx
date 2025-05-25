import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// デバッグ用オーバーレイと console ラッパーを初期化
import { DebugOverlay } from '@/components/DebugOverlay';
import '@/lib/debugger';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';
import { colors } from '@/theme/tokens';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  // tokens.ts で定義したカラーを React Native Paper のテーマに組み込みます
  // scheme には端末の設定に応じた 'light' か 'dark' が入ります
  const lightTheme = {
    ...MD3LightTheme,
    colors: { ...MD3LightTheme.colors, ...colors.light },
  };
  const darkTheme = {
    ...MD3DarkTheme,
    colors: { ...MD3DarkTheme.colors, ...colors.dark },
  };
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar
          style={scheme === 'dark' ? 'light' : 'dark'}
          backgroundColor={theme.colors.background}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            // 画面遷移時の下地色。Paper テーマの背景色を利用
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        {/* デバッグモード中のみログを表示 */}
        <DebugOverlay />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // デフォルト背景色。tokens.ts のライトテーマを利用
    backgroundColor: colors.light.background,
  },
});
