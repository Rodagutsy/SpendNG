import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>SpendNG</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>Your complete money record, built automatically.</Text>
      <Button title="Get Started" onPress={() => router.push('/(onboarding)/value-prop')} />
    </View>
  );
}
