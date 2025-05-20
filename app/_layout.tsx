import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" backgroundColor="#fff" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#fff' }, // 下地色を統一
          }}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
