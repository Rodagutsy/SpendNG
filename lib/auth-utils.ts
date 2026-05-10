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

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  // This is a placeholder for the Google OAuth flow using Expo Auth Session
  // Requires configuration in Supabase dashboard (Google Provider) 
  // and Google Cloud Console (Client IDs)
  
  const redirectUri = AuthSession.makeRedirectUri();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (res.type === 'success') {
    const fragment = res.url.split('#')[1];
    const params = Object.fromEntries(new URLSearchParams(fragment).entries());
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return sessionData;
  }
};
