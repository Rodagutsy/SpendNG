import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const sendOtp = async (email: string, shouldCreateUser: boolean = true) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser },
  });
  if (error) throw error;
};

export const verifyOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;
  return data;
};

const pendingPasswords: Record<string, string> = {};

export const storePendingPassword = (email: string, password: string) => {
  pendingPasswords[email.toLowerCase()] = password;
};

export const consumePendingPassword = (email: string): string | null => {
  const pwd = pendingPasswords[email.toLowerCase()];
  delete pendingPasswords[email.toLowerCase()];
  return pwd ?? null;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'spendngapp://auth/callback',
    },
  });
  if (error) throw error;
  return data;
};

const getRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'spendngapp',
  });
};

export const signInWithGoogle = async () => {
  const redirectUri = getRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
    },
  });

  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (res.type !== 'success') {
    throw new Error('Sign in was cancelled or could not be completed. Please try again.');
  }

  const url = res.url;

  const fragment = url.split('#')[1];
  if (fragment) {
    const params = Object.fromEntries(new URLSearchParams(fragment).entries());
    if (params.access_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) throw sessionError;
      return sessionData;
    }
  }

  const codeMatch = url.match(/[?&]code=([^&]+)/);
  if (codeMatch) {
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
    if (sessionError) throw sessionError;
    return sessionData;
  }

  throw new Error('No authentication data received from Google');
};
