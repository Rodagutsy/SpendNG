import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    // Optional: Auto-navigate after 2 seconds
    const timer = setTimeout(() => {
      router.push('/(onboarding)/value-prop');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: theme.primary }]} 
      onPress={() => router.push('/(onboarding)/value-prop')}
    >
      <StatusBar barStyle="light-content" />
      <Text style={[styles.appName, { color: theme.onPrimary }]}>SpendNG</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontFamily: Typography.fonts.display,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
});
