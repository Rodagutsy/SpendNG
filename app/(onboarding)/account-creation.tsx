import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth-utils';
import { useState } from 'react';

export default function AccountCreationScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { user, session } = await signUpWithEmail(email, password);
      
      if (user && !session) {
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification link to activate your account.'
        );
      }
      // If session exists, root redirect happens automatically via AuthContext
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        placeholder="Min 8 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
        style={{ marginTop: 20 }}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.line} />
      </View>

      <Button
        title="Continue with Google"
        onPress={handleGoogleAuth}
        variant="outline"
        disabled={loading}
      />

      <View style={{ marginTop: 40 }}>
        <Button
          title="Already have an account? Sign In"
          onPress={() => router.push('/(onboarding)/sign-in')}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#22c55e',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#9E9E9E',
    fontWeight: '600',
  },
});
