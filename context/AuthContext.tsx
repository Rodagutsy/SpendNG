import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useCategoryDefaultStore } from '@/lib/stores/categoryDefaultStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { startReadSMS, checkIfHasSMSPermission } from '@maniac-tech/react-native-expo-read-sms';
import { IngestionEngine } from '@/lib/ingestion-engine';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const listenerStartedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      useAuthStore.getState().setUserId(session?.user?.id ?? null);
      setLoading(false);
      if (session?.user) {
        useTransactionStore.getState().fetchHomeTransactions();
        useTransactionStore.getState().fetchTransactions();
        useCategoryStore.getState().fetchCategories();
        useCategoryDefaultStore.getState().fetchDefaults();
        useTaxClassificationStore.getState().fetchClassifications();
        if (Platform.OS === 'android' && !listenerStartedRef.current) {
          listenerStartedRef.current = true;
          checkIfHasSMSPermission().then((hasPermission) => {
            if (!hasPermission) return;
            startReadSMS(
              (address: string, body: string) => {
                IngestionEngine.processAlert(body, address, Date.now(), 'sms').catch((err) =>
                  console.warn('[SMSListener] Failed to process:', err),
                );
              },
              (error: string) => {
                console.warn('[SMSListener] Error:', error);
              },
            );
          });
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      useAuthStore.getState().setUserId(session?.user?.id ?? null);
      if (session?.user) {
        useTransactionStore.getState().fetchHomeTransactions();
        useTransactionStore.getState().fetchTransactions();
      }
    });

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const appState = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
