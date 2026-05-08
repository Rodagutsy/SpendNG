import 'react-native-url-polyfill/auto';
import * as Keychain from 'react-native-keychain';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const ExpoKeychainAdapter = {
  getItem: async (key: string) => {
    const credentials = await Keychain.getGenericPassword({ service: key });
    if (credentials) {
      return credentials.password;
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    await Keychain.setGenericPassword(key, value, { service: key });
  },
  removeItem: async (key: string) => {
    await Keychain.resetGenericPassword({ service: key });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoKeychainAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
