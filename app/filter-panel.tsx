import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function FilterPanelModal() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Filters</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for Filter Controls]</Text>
      <Button title="Apply" onPress={() => router.back()} />
      <View style={{ marginTop: 10 }}>
        <Button title="Clear All" color="#666" onPress={() => router.back()} />
      </View>
    </View>
  );
}
