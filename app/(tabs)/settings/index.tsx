import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useTransactionStore } from '@/lib/stores/transactionStore';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { signOut, user } = useAuth();
  const clearAllTransactions = useTransactionStore((s) => s.clearAllTransactions);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(onboarding)/sign-in');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              clearAllTransactions();
              await signOut();
              router.replace('/(onboarding)/account-creation');
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
          <IconSymbol name={icon as any} size={16} color={theme.primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: theme.onBackground }]}>
          {label}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={theme.outline} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Settings</Text>
      </View>

      {/* Profile Header Avatar Card */}
      <TouchableOpacity
        style={[styles.profileHeaderCard, { borderBottomColor: theme.outlineVariant }]}
        onPress={() => router.push('/settings/profile')}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}>
          <IconSymbol name="person.fill" size={24} color={theme.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.onBackground }]}>
            {user?.user_metadata?.full_name || 'Obayemi'}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.outline }]}>
            {user?.email || 'obayemi@spendng.app'}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={theme.outline} />
      </TouchableOpacity>

      <View style={styles.section}>
        <MenuItem icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
        <MenuItem icon="arrow.down.doc.fill" label="Data & Export" onPress={() => router.push('/settings/data-export')} />
        <MenuItem icon="lock.fill" label="Security" onPress={() => router.push('/settings/security')} />
        <MenuItem icon="help-circle" label="Help" onPress={() => router.push('/settings/help')} />
      </View>

      <View style={styles.footerActionContainer}>
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutBtnText, { color: theme.error }]}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Text style={[styles.deleteLinkText, { color: theme.outline }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: theme.outline }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[4],
    marginBottom: 32, // 32px bottom spacing
  },
  title: {
    fontFamily: Typography.fonts.medium, // 500 font weight
    fontSize: Typography.sizes.titleS, // 20px similar font size
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing[6],
    marginHorizontal: Spacing[4],
    borderRadius: Radius.md,
    marginBottom: 20, // 20px section spacing
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  profileName: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyL, // 18px
    fontWeight: '600',
  },
  profileEmail: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL, // 14px
  },
  section: {
    paddingHorizontal: Spacing[6],
    gap: 16,
    marginBottom: 20, // 20px section spacing
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 6px spacing
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  footerActionContainer: {
    marginTop: 20, // 20px section spacing
    marginBottom: Spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoutBtn: {
    width: '85%',
    height: 48, // 48px height
    borderWidth: 1.5,
    borderRadius: Radius.sm, // 8px corner radius
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonL,
    fontWeight: '600',
  },
  deleteLink: {
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    marginBottom: Spacing[8],
  },
});
