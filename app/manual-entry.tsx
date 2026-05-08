import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ManualEntryModal() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add Transaction</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for Transaction Form]</Text>
      <Button title="Save" onPress={() => router.back()} />
      <View style={{ marginTop: 10 }}>
        <Button title="Cancel" color="#666" onPress={() => router.back()} />
      </View>
    </View>
  );
}
