import React, { useEffect, useState, Component } from 'react';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { AuthProvider } from '@/context/AuthContext';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';

SplashScreen.preventAutoHideAsync();

class ErrorHandler extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Root error:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ color: 'red', fontSize: 16, marginBottom: 10 }}>Error</Text>
          <Text style={{ color: '#333' }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await useCategoryStore.getState().fetchCategories();
        await useTransactionStore.getState().fetchTransactions();
      } catch (e) {
        console.error('Data fetch error:', e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!ready) return null;

  return (
    <ErrorHandler>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </ErrorHandler>
  );
}
