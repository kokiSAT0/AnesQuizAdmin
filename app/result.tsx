import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Result() {
  const { correct } = useLocalSearchParams<{ correct: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.result}>
        {correct === 'true' ? '正解！🎉' : '残念…'}
      </Text>

      {/* 解説は実際のデータで置換 */}
      <Text style={styles.explain}>▼ 解説：プロポフォールは…</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/select')}
      >
        <Text style={styles.btnTxt}>次の問題を選ぶ</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  result: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  explain: { fontSize: 16, lineHeight: 22, marginBottom: 40 },
  btn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 8 },
  btnTxt: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
