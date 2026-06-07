import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { EmailService } from '@/lib/email-service';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export default function EmailConnectionScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'importing' | 'done'>('idle');

  const [request, response, promptAsync] = useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: SCOPES,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const { accessToken, refreshToken } = response.authentication;
      runImport(accessToken, refreshToken);
    } else if (response?.type === 'error') {
      setStatus('idle');
      Alert.alert('Connection Failed', response.params?.error_description || 'Google sign-in failed.');
    }
  }, [response]);

  const runImport = async (accessToken: string, refreshToken?: string) => {
    setStatus('importing');
    try {
      await EmailService.storeTokens({ accessToken, refreshToken });
      const result = await EmailService.pollNewEmails(accessToken);
      setStatus('done');
      Alert.alert(
        'Email Connected',
        `Processed ${result.processed} transaction email(s).`,
        [{ text: 'Continue', onPress: () => router.replace('/(onboarding)/import-progress') }],
      );
    } catch (err: any) {
      setStatus('idle');
      Alert.alert('Import Error', err.message || 'Failed to import emails.');
    }
  };

  const handleConnect = () => {
    setStatus('connecting');
    promptAsync();
  };

  const handleSkip = () => {
    router.push('/(onboarding)/import-progress');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Connect Email</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>
        Link your Gmail to automatically import transaction receipts from your banks.
      </Text>

      {status === 'connecting' || status === 'importing' ? (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" />
          <Text>{status === 'connecting' ? 'Opening Google sign-in...' : 'Importing emails...'}</Text>
        </View>
      ) : (
        <>
          <Button
            title="Connect Gmail"
            onPress={handleConnect}
            disabled={!request}
          />
          <View style={{ marginTop: 10 }}>
            <Button title="Skip for now" color="#666" onPress={handleSkip} />
          </View>
        </>
      )}
    </View>
  );
}
