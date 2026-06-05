import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={[styles.body, { color: theme.onBackground }]}>
        {'Last updated: June 2026\n\n'}
        {'SpendNG ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.\n\n'}
        {'Information We Collect\n'}
        {'We collect information you provide directly, such as your name, email address, and financial transaction data you enter into the app. We also collect usage data automatically, including app interactions, device information, and crash reports.\n\n'}
        {'How We Use Your Information\n'}
        {'We use your information to provide, maintain, and improve our services; to personalise your experience; to send you notifications you have opted into; and to comply with legal obligations.\n\n'}
        {'Data Storage and Security\n'}
        {'Your financial data is stored locally on your device and synchronised securely with our servers. We implement industry-standard encryption and security measures to protect your data. However, no method of transmission over the Internet is 100%% secure.\n\n'}
        {'Data Sharing\n'}
        {'We do not sell your personal information. We may share anonymised, aggregated data for analytics purposes. We may disclose information if required by law or to protect our rights.\n\n'}
        {'Your Rights\n'}
        {'You can access, update, or delete your personal data at any time through the app settings. You may contact us to request a copy of or deletion of your data.\n\n'}
        {'Changes to This Policy\n'}
        {'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app. Continued use of the app after changes constitutes acceptance of the updated policy.\n\n'}
        {'Contact Us\n'}
        {'If you have questions about this Privacy Policy, please contact us at support@spendng.app.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: Spacing[8] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[6],
    paddingTop: Spacing[8],
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
    fontSize: Typography.sizes.titleM,
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 24,
    paddingHorizontal: Spacing[6],
  },
});
