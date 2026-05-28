import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { initDatabase } from '@/lib/db/database';
import { seedDatabase } from '@/lib/db/seed';
import { useUIStore } from '@/lib/stores/uiStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    'Poppins': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });
  const dbInitialized = useUIStore((s) => s.dbInitialized);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        await seedDatabase();
        useUIStore.getState().setDbInitialized(true);
        useCategoryStore.getState().fetchCategories();
        useTransactionStore.getState().fetchTransactions();
      } catch (error) {
        console.error('Database init error:', error);
        useUIStore.getState().setDbInitialized(true);
      }
    }
    setup();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading, dbInitialized]);

  if (!fontsLoaded && !fontError) return null;
  if (authLoading || !dbInitialized) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="(onboarding)" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}

        <Stack.Screen
          name="manual-entry"
          options={{ presentation: 'modal', title: 'Add Transaction' }}
        />
        <Stack.Screen
          name="recategorization"
          options={{ presentation: 'modal', title: 'Edit Category' }}
        />
        <Stack.Screen
          name="filter-panel"
          options={{ presentation: 'modal', title: 'Filters' }}
        />
        <Stack.Screen
          name="rule-conflict"
          options={{ presentation: 'modal', title: 'Rule Conflict' }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
