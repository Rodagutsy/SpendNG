import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="value-prop" />
      <Stack.Screen name="account-creation" />
      <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sms-permission" />
      <Stack.Screen name="email-connection" />
      <Stack.Screen name="import-progress" />
    </Stack>
  );
}
