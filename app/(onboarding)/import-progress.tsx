import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function ImportProgressScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator size="large" color="#0B5CFF" />
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>Building your history</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>Found 247 bank alerts · 183 processed</Text>
      <Button title="Continue to SpendNG" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}
