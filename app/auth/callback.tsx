import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        router.replace('/(onboarding)/sign-in');
        return;
      }

      try {
        const queryStart = url.indexOf('?');
        const code = queryStart >= 0 ? new URLSearchParams(url.substring(queryStart)).get('code') : null;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.replace('/(onboarding)/connect-source');
            return;
          }
        }
      } catch {}

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
