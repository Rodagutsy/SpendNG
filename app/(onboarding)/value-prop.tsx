import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ValuePropScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Value Propositions</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for 3 slides: Automatic Capture, Everything in One Place, Tax-Ready Records]</Text>
      <Button title="Continue" onPress={() => router.push('/(onboarding)/account-creation')} />
    </View>
  );
}
