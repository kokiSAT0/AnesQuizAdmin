import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AnesQuiz α版</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/select')}
      >
        <Text style={styles.btnText}>クイズを始める</Text>
      </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  btn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
