import { View, Text, Button, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SMSService } from '@/lib/sms-service';

export default function SMSPermissionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const result = await SMSService.requestAndScan();
      if (!result.permissionsGranted) {
        Alert.alert(
          'Permission Denied',
          'SMS access was denied. You can enable it later in Settings.',
        );
      }
    } catch (e) {
      console.warn('SMS setup error:', e);
    }
    setLoading(false);
    router.push('/(onboarding)/email-connection');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>SMS Permission</Text>
          <Text style={{ textAlign: 'center', marginBottom: 40 }}>Let SpendNG read your bank alerts automatically. (Android Only)</Text>
          <Button title="Allow Access" onPress={handleAllow} />
          <View style={{ marginTop: 10 }}>
            <Button
              title="Set Up Later"
              color="#666"
              onPress={() => router.push('/(onboarding)/email-connection')}
            />
          </View>
        </>
      )}
    </View>
  );
}
