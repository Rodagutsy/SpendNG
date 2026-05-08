import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function RuleConflictModal() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Rule Conflict</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>A rule already exists for this merchant. What would you like to do?</Text>
      <Button title="Replace Existing Rule" onPress={() => router.back()} />
      <View style={{ marginTop: 10 }}>
        <Button title="Keep Both" color="#666" onPress={() => router.back()} />
      </View>
    </View>
  );
}
