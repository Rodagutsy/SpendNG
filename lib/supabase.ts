import 'react-native-url-polyfill/auto';
import * as Keychain from 'react-native-keychain';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Mobile-specific Keychain adapter
const ExpoKeychainAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return null;
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') return;
    await Keychain.setGenericPassword(key, value, { service: key });
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') return;
    await Keychain.resetGenericPassword({ service: key });
  },
};

// Use Keychain for mobile, and let Supabase handle web (which defaults to localStorage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoKeychainAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
