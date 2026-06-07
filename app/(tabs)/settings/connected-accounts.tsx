import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { EmailService } from '@/lib/email-service';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [, response, promptAsync] = useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: SCOPES,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const { accessToken, refreshToken } = response.authentication;
      EmailService.storeTokens({ accessToken, refreshToken });
      setConnectedEmail('Gmail');
      Alert.alert('Connected', 'Gmail account linked successfully.');
    }
  }, [response]);

  const checkConnection = async () => {
    setLoading(true);
    const tokens = await EmailService.getStoredTokens();
    setConnectedEmail(tokens ? 'Gmail' : null);
    setLoading(false);
  };

  const handleConnect = () => {
    promptAsync();
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Gmail',
      'This will stop email import. You can reconnect anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await EmailService.clearTokens();
            setConnectedEmail(null);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Connected Accounts</Text>
          <View style={{ width: 32 }} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.accountRow}>
              <View style={styles.accountLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FDECEB' }]}>
                  <IconSymbol name="envelope.fill" size={16} color="#dc2626" />
                </View>
                <View>
                  <Text style={[styles.accountLabel, { color: theme.onBackground }]}>Gmail</Text>
                  <Text style={[styles.accountStatus, { color: theme.outline }]}>
                    {connectedEmail ? 'Connected' : 'Not connected'}
                  </Text>
                </View>
              </View>
              {connectedEmail ? (
                <TouchableOpacity
                  style={[styles.disconnectBtn, { borderColor: theme.error }]}
                  onPress={handleDisconnect}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.disconnectBtnText, { color: theme.error }]}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: theme.primary }]}
                  onPress={handleConnect}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.connectBtnText, { color: theme.onPrimary }]}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[8],
    marginBottom: Spacing[4],
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
  },
  loadingBox: {
    padding: Spacing[8],
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing[6],
    gap: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  accountStatus: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    marginTop: 2,
  },
  connectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
  },
  connectBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  disconnectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  disconnectBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
});
