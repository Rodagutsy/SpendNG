import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { EmailService } from '@/lib/email-service';
import { SMSService } from '@/lib/sms-service';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const googleRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'spendngapp',
  path: 'oauth/gmail',
});

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [smsConnected, setSmsConnected] = useState(false);
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [smsConnecting, setSmsConnecting] = useState(false);

  const [, response, promptAsync] = useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: SCOPES,
    redirectUri: googleRedirectUri,
  });

  useEffect(() => {
    checkConnections();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const { accessToken, refreshToken } = response.authentication;
      (async () => {
        try {
          await EmailService.storeTokens({ accessToken, refreshToken });
          setConnectedEmail('Gmail');
          showAlert({ title: 'Connected', message: 'Gmail account linked successfully.' });
        } catch (e: any) {
          showAlert({ title: 'Error', message: e.message || 'Failed to link Gmail.' });
        } finally {
          setEmailConnecting(false);
        }
      })();
    } else if (response?.type === 'error') {
      setEmailConnecting(false);
      showAlert({ title: 'Connection Failed', message: response.params?.error_description || 'Google sign-in failed.' });
    }
  }, [response]);

  const checkConnections = async () => {
    setLoading(true);
    const [tokens, smsStatus] = await Promise.all([
      EmailService.getStoredTokens().catch(() => null),
      SMSService.getConnectionStatus().catch(() => ({ hasPermissions: false })),
    ]);
    setConnectedEmail(tokens ? 'Gmail' : null);
    setSmsConnected(smsStatus.hasPermissions);
    setLoading(false);
  };

  const handleConnect = () => {
    setEmailConnecting(true);
    promptAsync();
  };

  const handleDisconnect = () => {
    showAlert({
      title: 'Disconnect Gmail',
      message: 'This will stop email import. You can reconnect anytime.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await EmailService.clearTokens();
              setConnectedEmail(null);
            } catch (e: any) {
              showAlert({ title: 'Error', message: e.message || 'Failed to disconnect.' });
            }
          },
        },
      ],
    });
  };

  const handleSmsConnect = async () => {
    if (Platform.OS === 'ios') return;
    setSmsConnecting(true);
    try {
      const result = await SMSService.requestAndScan();
      if (result.permissionsGranted) {
        setSmsConnected(true);
        showAlert({ title: 'Connected', message: 'SMS import is now active.' });
      } else {
        showAlert({ title: 'Permission Denied', message: 'SMS access was denied. You can enable it later in Settings.' });
      }
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'Failed to connect SMS.' });
    } finally {
      setSmsConnecting(false);
      checkConnections();
    }
  };

  const handleSmsDisconnect = () => {
    showAlert({
      title: 'Disconnect SMS',
      message: 'This will stop SMS import. You can reconnect anytime.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await SMSService.clearConnection();
              setSmsConnected(false);
            } catch (e: any) {
              showAlert({ title: 'Error', message: e.message || 'Failed to disconnect.' });
            }
          },
        },
      ],
    });
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
                  style={[styles.disconnectBtn, { borderColor: Colors.main.error }]}
                  onPress={handleDisconnect}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.disconnectBtnText, { color: Colors.main.error }]}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: theme.primary }]}
                  onPress={handleConnect}
                  disabled={emailConnecting}
                  activeOpacity={0.7}
                >
                  {emailConnecting ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <Text style={[styles.connectBtnText, { color: theme.onPrimary }]}>Connect</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* SMS Row — Android only */}
            {Platform.OS === 'android' && (
              <View style={styles.accountRow}>
                <View style={styles.accountLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#E6EEFF' }]}>
                    <IconSymbol name="message.fill" size={16} color="#0B5CFF" />
                  </View>
                  <View>
                    <Text style={[styles.accountLabel, { color: theme.onBackground }]}>SMS</Text>
                    <Text style={[styles.accountStatus, { color: theme.outline }]}>
                      {smsConnected ? 'Connected' : 'Not connected'}
                    </Text>
                  </View>
                </View>
                {smsConnected ? (
                  <TouchableOpacity
                    style={[styles.disconnectBtn, { borderColor: Colors.main.error }]}
                    onPress={handleSmsDisconnect}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.disconnectBtnText, { color: Colors.main.error }]}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSmsConnect}
                    disabled={smsConnecting}
                    activeOpacity={0.7}
                  >
                    {smsConnecting ? (
                      <ActivityIndicator size="small" color={theme.onPrimary} />
                    ) : (
                      <Text style={[styles.connectBtnText, { color: theme.onPrimary }]}>Connect</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    gap: 12,
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
