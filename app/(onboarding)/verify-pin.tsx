import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { sendOtp, verifyOtp, consumePendingPassword } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const RESEND_COOLDOWN = 30;
const PIN_LENGTH = 6;

export default function VerifyPinScreen() {
  const router = useRouter();
  const { email, mode, name } = useLocalSearchParams<{ email: string; mode: string; name?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const pinRef = useRef<TextInput>(null);

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    pinRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (pin.length !== PIN_LENGTH || loading) return;
    setLoading(true);
    try {
      await verifyOtp(email, pin);
      if (mode === 'signup') {
        const password = consumePendingPassword(email);
        if (password) {
          await supabase.auth.updateUser({
            password,
            data: { full_name: name || '' },
          });
        }
        router.replace('/(onboarding)/connect-source');
      } else {
        router.replace(`/(onboarding)/set-password?email=${encodeURIComponent(email)}&mode=${mode}${name ? `&name=${encodeURIComponent(name)}` : ''}`);
      }
    } catch (err: any) {
      showAlert({ title: 'Invalid Code', message: err?.message || 'The code you entered is incorrect or expired. Please try again.' });
      setPin('');
      pinRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await sendOtp(email, mode !== 'reset');
      showAlert({ title: 'Code Sent', message: 'A new verification code has been sent to your email.' });
      setCountdown(RESEND_COOLDOWN);
      setPin('');
      pinRef.current?.focus();
    } catch (err: any) {
      showAlert({ title: 'Error', message: err?.message || 'Failed to resend code.' });
    } finally {
      setResending(false);
    }
  };

  const pinDigits = pin.padEnd(PIN_LENGTH, ' ').split('').slice(0, PIN_LENGTH);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
        <MaterialIcons name={mode === 'reset' ? 'lock-outline' : 'mail-outline'} size={40} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.onBackground }]}>
        {mode === 'reset' ? 'Reset Password' : 'Check your email'}
      </Text>

      <Text style={[styles.message, { color: theme.outline }]}>
        {'Enter the 6-digit code sent to'}
      </Text>
      <Text style={[styles.emailText, { color: theme.onBackground }]}>
        {email || 'your email'}
      </Text>

      <View style={styles.pinRow}>
        {pinDigits.map((digit, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={1}
            onPress={() => pinRef.current?.focus()}
            style={[
              styles.pinBox,
              { backgroundColor: theme.surfaceContainer, borderColor: i === pin.length ? theme.primary : theme.outlineVariant },
            ]}
          >
            <Text style={[styles.pinDigit, { color: theme.onBackground }]}>
              {digit === ' ' ? '' : digit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        ref={pinRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={(v) => {
          const digits = v.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
          setPin(digits);
          if (digits.length === PIN_LENGTH) {
            setTimeout(() => handleVerify(), 300);
          }
        }}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.verifyBtn, { backgroundColor: pin.length === PIN_LENGTH && !loading ? theme.primary : theme.outlineVariant }]}
        onPress={handleVerify}
        disabled={pin.length !== PIN_LENGTH || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.onPrimary} />
        ) : (
          <Text style={[styles.verifyBtnText, { color: pin.length === PIN_LENGTH ? theme.onPrimary : theme.outline }]}>
            Verify
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendBtn}
        onPress={handleResend}
        disabled={countdown > 0 || resending}
        activeOpacity={0.7}
      >
        <MaterialIcons name="refresh" size={16} color={countdown > 0 ? theme.outline : theme.primary} />
        <Text style={[styles.resendText, { color: countdown > 0 ? theme.outline : theme.primary }]}>
          {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending...' : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    marginBottom: 32,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },
  pinBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigit: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  verifyBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  resendText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyM,
  },
});
