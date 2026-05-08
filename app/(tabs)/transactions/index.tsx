import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function TransactionsScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Transactions</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for Transaction List]</Text>
      <Button title="View Detail (Sample)" onPress={() => router.push('/(tabs)/transactions/sample-id')} />
    </View>
  );
}
