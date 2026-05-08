import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function EmailConnectionScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Connect Email</Text>
      <Button title="Connect Gmail" onPress={() => router.push('/(onboarding)/import-progress')} />
      <View style={{ marginTop: 10 }}>
        <Button title="Connect Outlook" onPress={() => router.push('/(onboarding)/import-progress')} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button title="Skip for now" color="#666" onPress={() => router.push('/(onboarding)/import-progress')} />
      </View>
    </View>
  );
}
