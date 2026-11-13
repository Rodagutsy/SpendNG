import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isMock = !supabaseUrl || !supabaseAnonKey;

type MockUser = {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
};

type MockSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: MockUser;
};

const mockUser: MockUser = {
  id: 'mock-user-id',
  email: 'dev@spendng.app',
  user_metadata: { full_name: 'Dev User' },
};

const mockSession: MockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

function makeMockClient() {
  const listeners: Array<(event: string, session: any) => void> = [];

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    single: () => mockQuery,
    maybeSingle: () => mockQuery,
    then: (resolve: any) => Promise.resolve({ data: [], error: null }),
    values: () => mockQuery,
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      updateUser: async (attributes: any) => {
        if (attributes.data) {
          mockUser.user_metadata = { ...mockUser.user_metadata, ...attributes.data };
        }
        return { data: { user: mockUser }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback);
        // Trigger initial sign-in callback so auth context initializes correctly
        setTimeout(() => callback('SIGNED_IN', mockSession), 0);
        return {
          data: { subscription: { unsubscribe: () => {} } },
          error: null,
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const session = { ...mockSession, user: { ...mockUser, email } };
        listeners.forEach((cb) => cb('SIGNED_IN', session));
        return { data: { user: session.user, session }, error: null };
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        return { data: { user: mockUser, session: null }, error: null };
      },
      signInWithOAuth: async ({ provider }: { provider: string }) => {
        return { data: { url: 'https://mock.redirect', provider }, error: null };
      },
      setSession: async ({ access_token, refresh_token }: { access_token: string; refresh_token: string }) => {
        const session = { ...mockSession, access_token, refresh_token };
        return { data: { session }, error: null };
      },
      signOut: async () => {
        listeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },
      resetPasswordForEmail: async (email: string) => {
        return { data: {}, error: null };
      },
      startAutoRefresh: async () => {},
      stopAutoRefresh: () => {},
    },
    from: (_table: string) => mockQuery,
    functions: {
      invoke: async (name: string, _args: any) => {
        if (name === 'extract-receipt') {
          return {
            data: {
              merchant: 'Mock Store',
              amount: 5000,
              currency: 'NGN',
              transaction_date: '2026-06-19',
              tax_amount: null,
            },
            error: null,
          };
        }
        return { data: null, error: new Error('Mock mode — configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY') };
      },
    },
      storage: {
        from: (_bucket: string) => ({
          upload: async (path: string, _file: any, _opts?: any) => {
            return { data: { path }, error: null };
          },
          createSignedUrl: async (_path: string, _expiresIn: number) => {
            return { data: { signedUrl: 'https://mock.signed.url/receipt.jpg' }, error: null };
          },
        }),
      },
  };
}

let supabase: any;

if (isMock) {
  console.log('[Supabase] No credentials found — using mock client');
  supabase = makeMockClient();
} else {
  const { createClient } = require('@supabase/supabase-js');
  const ssrSafeStorage = {
    getItem: (key: string) =>
      typeof window === 'undefined' ? Promise.resolve(null) : AsyncStorage.getItem(key),
    setItem: (key: string, value: string) =>
      typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.setItem(key, value),
    removeItem: (key: string) =>
      typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.removeItem(key),
  };
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
