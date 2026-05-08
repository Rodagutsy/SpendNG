import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from '@/model/database';

import { seedDatabase } from '@/lib/setup';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();

  useEffect(() => {
    seedDatabase().catch(err => console.error('Seeding failed', err));
  }, []);

  if (loading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="(onboarding)" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        
        {/* Modal Routes */}
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
        <Stack.Screen 
          name="components-preview" 
          options={{ title: 'Component Library' }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DatabaseProvider database={database}>
        <RootLayoutNav />
      </DatabaseProvider>
    </AuthProvider>
  );
}
