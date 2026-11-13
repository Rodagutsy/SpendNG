import React, { useEffect, useState, Component } from 'react';
import { View, Text, TouchableOpacity, AppState, AppStateStatus, StyleSheet } from 'react-native';
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
import { AlertProvider } from '@/context/AlertContext';
import { useAppLockStore } from '@/lib/stores/appLockStore';
import { Colors, Typography, Radius } from '@/constants/Tokens';

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
          <Text style={{ color: 'red', fontSize: 16, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: '#333', textAlign: 'center' }}>
            {__DEV__ ? this.state.error.message : 'An unexpected error occurred. Please restart the app.'}
          </Text>
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
  const biometricEnabled = useAppLockStore((s) => s.biometricEnabled);
  const locked = useAppLockStore((s) => s.locked);
  const hydrateAppLock = useAppLockStore((s) => s.hydrate);
  const lockApp = useAppLockStore((s) => s.lock);
  const unlockWithBiometrics = useAppLockStore((s) => s.unlockWithBiometrics);

  useEffect(() => {
    hydrateAppLock();
  }, [hydrateAppLock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' && biometricEnabled) {
        lockApp();
      }
    });
    return () => sub.remove();
  }, [biometricEnabled, lockApp]);

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
        <AlertProvider>
          <View style={{ flex: 1 }}>
            <Slot />
            {biometricEnabled && locked && (
              <View style={lockStyles.overlay}>
                <Text style={lockStyles.title}>SpendNG Locked</Text>
                <Text style={lockStyles.subtitle}>Authenticate to access your financial data</Text>
                <TouchableOpacity
                  style={lockStyles.btn}
                  onPress={() => unlockWithBiometrics()}
                  activeOpacity={0.8}
                >
                  <Text style={lockStyles.btnText}>Unlock</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </AlertProvider>
      </AuthProvider>
    </ErrorHandler>
  );
}

const lockStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    color: Colors.light.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.outline,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: Colors.main.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  btnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
