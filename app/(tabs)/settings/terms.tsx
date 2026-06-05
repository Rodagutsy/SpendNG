import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TermsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Terms and Conditions</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={[styles.body, { color: theme.onBackground }]}>
        {'Last updated: June 2026\n\n'}
        {'1. Acceptance of Terms\n'}
        {'By downloading, installing, or using SpendNG ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the App.\n\n'}
        {'2. Description of Service\n'}
        {'SpendNG is a personal finance tracking application that allows you to record, categorise, and analyse your income and expenses. The App is provided for personal, non-commercial use.\n\n'}
        {'3. User Responsibilities\n'}
        {'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and not to use the App for any unlawful purpose.\n\n'}
        {'4. Intellectual Property\n'}
        {'All content, design, and code within the App are the intellectual property of SpendNG. You may not reproduce, distribute, or create derivative works without our express permission.\n\n'}
        {'5. Limitation of Liability\n'}
        {'SpendNG is provided "as is" without warranties of any kind. We are not liable for any financial losses, data loss, or damages arising from your use of the App. You use the App at your own risk.\n\n'}
        {'6. Third-Party Services\n'}
        {'The App may integrate with third-party services. We are not responsible for the content, privacy practices, or availability of these services.\n\n'}
        {'7. Termination\n'}
        {'We reserve the right to suspend or terminate your access to the App at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users or third parties.\n\n'}
        {'8. Changes to Terms\n'}
        {'We may modify these Terms at any time. Changes will be posted in the App. Continued use of the App after changes constitutes acceptance of the new Terms.\n\n'}
        {'9. Governing Law\n'}
        {'These Terms shall be governed by and construed in accordance with the laws of Nigeria. Any disputes shall be resolved in the courts of Nigeria.\n\n'}
        {'10. Contact\n'}
        {'For questions about these Terms, contact us at support@spendng.app.'}
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
    fontSize: Typography.sizes.titleM
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 24,
    paddingHorizontal: Spacing[6],
  },
});
