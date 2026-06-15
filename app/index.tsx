import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import React from 'react';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (!session) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  const onboardingCompleted = session.user?.user_metadata?.onboarding_completed;

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/connect-source" />;
  }

  return <Redirect href="/(tabs)" />;
}
