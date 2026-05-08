import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Transaction Detail</Text>
      <Text style={{ textAlign: 'center', marginBottom: 20 }}>Transaction ID: {id}</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for Detail Content]</Text>
      <Button title="Edit Category" onPress={() => router.push('/recategorization')} />
      <View style={{ marginTop: 20 }}>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    </View>
  );
}
