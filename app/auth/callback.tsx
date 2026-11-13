import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useAlert } from '@/context/AlertContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        router.replace('/(onboarding)/sign-in');
        return;
      }

      try {
        const parsed = Linking.parse(url);
        const isExpectedCallback =
          parsed.scheme === 'spendngapp' &&
          (parsed.hostname === 'auth' || parsed.path?.startsWith('auth/callback') || parsed.path === 'callback');
        if (!isExpectedCallback) {
          router.replace('/(onboarding)/sign-in');
          return;
        }

        const queryStart = url.indexOf('?');
        const params = queryStart >= 0 ? new URLSearchParams(url.substring(queryStart)) : null;
        if (params?.get('error')) {
          showAlert({ title: 'Authentication failed', message: 'Sign-in was cancelled or denied.' });
          router.replace('/(onboarding)/sign-in');
          return;
        }

        const code = params?.get('code') ?? null;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.replace('/(onboarding)/connect-source');
            return;
          }
        }
      } catch {
        showAlert({ title: 'Authentication failed', message: 'Please try signing in again.' });
      }

      router.replace('/(onboarding)/sign-in');
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
