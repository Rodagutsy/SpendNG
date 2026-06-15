import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { EmailService } from '@/lib/email-service';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const googleRedirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
});

export default function EmailConnectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [status, setStatus] = useState<'idle' | 'connecting' | 'importing' | 'done'>('idle');

  const { showAlert } = useAlert();
  const [request, response, promptAsync] = useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: SCOPES,
    redirectUri: googleRedirectUri,
    extraParams: { prompt: 'consent', access_type: 'offline' },
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const { accessToken, refreshToken, expiresIn, issuedAt } = response.authentication;
      const expiryTime = expiresIn && issuedAt ? (issuedAt + expiresIn) * 1000 : undefined;
      runImport(accessToken, refreshToken, expiryTime);
    } else if (response?.type === 'error') {
      setStatus('idle');
      showAlert({ title: 'Connection Failed', message: response.params?.error_description || 'Google sign-in failed.' });
    }
  }, [response]);

  const runImport = async (accessToken: string, refreshToken?: string, expiryTime?: number) => {
    setStatus('importing');
    try {
      await EmailService.storeTokens({ accessToken, refreshToken, expiryTime });
      const result = await EmailService.pollNewEmails(accessToken);
      setStatus('done');
      showAlert({
        title: 'Email Connected',
        message: `Processed ${result.processed} transaction email(s).`,
        buttons: [{ text: 'Continue', onPress: () => router.replace('/(onboarding)/import-progress') }],
      });
    } catch (err: any) {
      setStatus('idle');
      showAlert({ title: 'Import Error', message: err.message || 'Failed to import emails.' });
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
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {status === 'connecting' || status === 'importing' ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.onSurface }]}>
              {status === 'connecting' ? 'Opening Google sign-in...' : 'Importing emails...'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.onBackground }]}>Import Alerts from Gmail</Text>
            <Text style={[styles.subtitle, { color: theme.outline }]}>
              Link your Gmail to automatically import bank transaction receipts.
            </Text>

            <TouchableOpacity
              style={[styles.connectBtn, { backgroundColor: theme.primary, opacity: request ? 1 : 0.5 }, Shadows.sm]}
              onPress={handleConnect}
              disabled={!request}
              activeOpacity={0.8}
            >
              <Text style={[styles.connectBtnText, { color: theme.onPrimary }]}>Connect Gmail</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtnWrapper} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={[styles.skipText, { color: theme.outline }]}>Skip for now</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  connectBtn: {
    width: '80%',
    height: 50,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[8],
    marginBottom: 12,
  },
  connectBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 16,
  },
  skipBtnWrapper: {
    paddingVertical: 8,
    marginTop: Spacing[2],
  },
  skipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
});
