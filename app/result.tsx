import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { useTheme } from 'react-native-paper';

export default function Result() {
  const theme = useTheme();
  const { correct } = useLocalSearchParams<{ correct: string }>();

  return (
    <Screen
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={styles.result}>
        {correct === 'true' ? '正解！🎉' : '残念…'}
      </Text>

      {/* 解説は実際のデータで置換 */}
      <Text style={styles.explain}>▼ 解説：プロポフォールは…</Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.replace('/select')}
      >
        <Text style={[styles.btnTxt, { color: theme.colors.onPrimary }]}>
          次の問題を選ぶ
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  result: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  explain: { fontSize: 16, lineHeight: 22, marginBottom: 40 },
  btn: { padding: 16, borderRadius: 8 },
  btnTxt: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
