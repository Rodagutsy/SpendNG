import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { AuthProvider, useAuth } from '@/context/AuthContext';
function RootLayoutNav() {
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
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
