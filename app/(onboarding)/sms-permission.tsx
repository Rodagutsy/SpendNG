import { View, Text, Button, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function SMSPermissionScreen() {
  const router = useRouter();

  // In a real app, we'd check Platform.OS here and skip if not Android
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>SMS Permission</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>Let SpendNG read your bank alerts automatically. (Android Only)</Text>
      <Button title="Allow Access" onPress={() => router.push('/(onboarding)/email-connection')} />
      <View style={{ marginTop: 10 }}>
        <Button title="Set Up Later" color="#666" onPress={() => router.push('/(onboarding)/email-connection')} />
      </View>
    </View>
  );
}
