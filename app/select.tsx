import { router } from 'expo-router';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';

const dummy = Array.from({ length: 30 }, (_, i) => i + 1);

export default function Select() {
  return (
    <View style={styles.container}>
      <FlatList
        data={dummy}
        keyExtractor={(n) => n.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/quiz')}
          >
            <Text style={styles.rowText}>{`問題 ${item}`}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#fff' },
  row: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  rowText: { fontSize: 18 },
});
