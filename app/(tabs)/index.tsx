import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography, Shadows, Spacing, Colors, Palette } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BellIcon } from '@/components/ui/CustomSvgIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMonthlyBalances, useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useAuth } from '@/context/AuthContext';
import { TransactionModal } from '@/components/TransactionModal';



interface CustomTransactionProps {
  merchant: string;
  bankAndDate: string;
  amount: string;
  category: string;
  isDebit: boolean;
  onPress?: () => void;
}

const CustomTransactionItem = ({
  merchant,
  bankAndDate,
  amount,
  category,
  isDebit,
  onPress
}: CustomTransactionProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <TouchableOpacity
      style={styles.transactionContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar Letter */}
      <View style={[styles.iconCircle, { backgroundColor: isDebit ? Colors.main.error : Colors.main.success }]}>
        <Text style={styles.avatarLetter}>
          {(merchant || '?')[0].toUpperCase()}
        </Text>
      </View>

      {/* Middle Content */}
      <View style={styles.transactionMiddle}>
        <Text style={[styles.merchantText, { color: theme.onSurface }]} numberOfLines={1}>
          {merchant}
        </Text>
        <Text style={[styles.detailText, { color: theme.outline }]} numberOfLines={1}>
          {bankAndDate}
        </Text>
      </View>

      {/* Right Content */}
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.amountText,
            { color: isDebit ? Colors.main.error : Colors.main.success }
          ]}
        >
          {isDebit ? '-' : '+'}
          <Text style={styles.nairaSymbol}>₦</Text>
          {amount}
        </Text>
        <Text style={[styles.categoryText, { color: theme.outline }]} numberOfLines={1}>
          {category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { moneyIn, moneyOut, netBalance, transactionCount } = useMonthlyBalances();
  const transactions = useTransactionStore((s) => s.transactions);
  const { user } = useAuth();

  const bellRef = useRef<View>(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const recentTransactions = transactions.slice(0, 10);
  const flaggedCount = transactions.filter((tx) => tx.isFlaggedForReview).length;

  const formatNaira = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs > 999_999) {
      if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
      return `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    return abs.toLocaleString('en-US');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getCategoryName = (categoryId: string) => {
    const cat = useCategoryStore.getState().getCategoryById(categoryId);
    return cat?.name || categoryId;
  };

  const getAccountLabel = (tx: (typeof transactions)[0]) => {
    return tx.accountName || 'Account';
  };

  const openNotifications = useCallback(() => {
    router.push('/transactions' as any);
  }, [router]);

  const headerElement = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Blue Header Section */}
      <View style={[styles.blueHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeLabel}>Hello,</Text>
            <Text style={styles.welcomeName}>{userName}</Text>
          </View>
          <TouchableOpacity
            ref={bellRef}
            style={[styles.notificationBtn, Shadows.sm]}
            onPress={openNotifications}
            activeOpacity={0.8}
          >
            <BellIcon size={24} color={theme.onSurface} />
            {flaggedCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{flaggedCount > 9 ? '9+' : flaggedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Net Balance Pill */}
        <View style={[styles.netBalancePill, Shadows.sm]}>
          <Text style={styles.netBalanceText}>Net Balance</Text>
        </View>

        {/* Balance Amount */}
        <Text style={styles.balanceValue}>
          <Text style={styles.nairaSymbol}>₦</Text>{formatNaira(netBalance)}
        </Text>

        {/* Subtitle */}
        <Text style={styles.balanceSubtitle}>{transactionCount} transactions this month</Text>
      </View>

      {/* Money In / Money Out Side-by-Side Cards */}
      <View style={styles.moneyContainer}>
        {/* Money In Card */}
        <View style={[styles.moneyHalf, styles.moneyInHalf]}>
          <Text style={styles.moneyLabelGreen}>Money In</Text>
          <Text style={styles.moneyInvalue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyIn)}</Text>
        </View>

        {/* Money Out Card */}
        <View style={[styles.moneyHalf, styles.moneyOutHalf]}>
          <Text style={styles.moneyLabelRed}>Money Out</Text>
          <Text style={styles.moneyOutvalue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyOut)}</Text>
        </View>
      </View>

      {/* Tax Filing Alert */}
      <ImageBackground
        source={require('@/assets/images/dashboard_overview.png')}
        style={[styles.taxAlert, Shadows.sm]}
        imageStyle={styles.taxAlertImage}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 26, 77, 0.88)', borderRadius: 12 }]} />
        <Text style={styles.taxAlertText}>
          Ready to review and export your record for tax filing?
        </Text>
        <TouchableOpacity
          style={styles.taxFileBtn}
          onPress={() => router.push('/transactions' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.taxFileBtnText}>Review Now!</Text>
        </TouchableOpacity>
      </ImageBackground>

    </View>
  ), [insets.top, router, moneyIn, moneyOut, netBalance, transactionCount, userName, openNotifications]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {headerElement}

          <View style={[styles.recentActivityContainer, { backgroundColor: theme.onPrimary }]}>
            <View style={styles.recentActivityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/transactions' as any)}>
                <Text style={styles.seeAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the + button to add your first transaction</Text>
              </View>
            ) : recentTransactions.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.separator} />}
                <CustomTransactionItem
                  merchant={item.merchantName || 'Unknown'}
                  bankAndDate={`${getAccountLabel(item)} • ${formatDate(item.transactionDate)}`}
                  amount={formatNaira(item.amount)}
                  category={getCategoryName(item.categoryId)}
                  isDebit={item.transactionType === 'debit'}
                  onPress={() => router.push(`/transactions/${item.id}` as any)}
                />
              </React.Fragment>
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button (FAB) exactly as in image */}
        <TouchableOpacity
          style={[styles.fab, Shadows.large]}
          onPress={() => setShowTxModal(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={24} color={theme.onPrimary} />
        </TouchableOpacity>

        <TransactionModal visible={showTxModal} onClose={() => setShowTxModal(false)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 110 : 90,
  },
  headerContainer: {
    backgroundColor: Colors.light.background,
  },
  blueHeader: {
    backgroundColor: Colors.main.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  welcomeLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    color: Colors.light.primaryContainer,
    opacity: 0.8,
  },
  welcomeName: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    color: Colors.light.onPrimary,
    marginTop: -8,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netBalancePill: {
    backgroundColor: Colors.light.primaryContainer,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 16,
  },
  netBalanceText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.light.onSurface,
  },
  balanceValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 44,
    color: Colors.light.onPrimary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  balanceSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.primaryContainer,
    opacity: 0.65,
    textAlign: 'center',
    marginTop: -8,
  },
  moneyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    height: 104,
  },
  moneyHalf: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  moneyInHalf: {
    backgroundColor: Colors.light.onPrimary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  moneyOutHalf: {
    backgroundColor: Colors.light.onPrimary,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  moneyLabelGreen: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  moneyLabelRed: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  moneyInvalue: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    color: Colors.main.success,
    marginTop: 1
  },
  moneyOutvalue: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    color: Colors.main.error,
    marginTop: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  trendTextGreen: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: Colors.main.success,
  },
  trendTextRed: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: Colors.main.error,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: Colors.light.onSurface,
  },
  taxAlert: {
    marginHorizontal: 20,
    height: 'auto',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'hidden',
    marginTop: 24,
  },
  taxAlertImage: {
    borderRadius: 12,
  },
  taxAlertText: {
    flex: 1,
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: Colors.light.onPrimary,
    lineHeight: 20,
    marginRight: 12,
  },
  taxFileBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.main.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taxFileBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.onPrimary,
  },
  recentActivityContainer: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 4,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAllText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.primary,
  },
  transactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    height: 76,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLetter: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleM,
    color: Colors.light.onPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: Colors.light.onSurface,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.outline,
    textAlign: 'center',
  },
  transactionMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantText: {
    fontFamily: Typography.fonts.title,
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  detailText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.outline,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
  },
  categoryText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.light.outline,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.surfaceContainer,
    marginLeft: 84,
    marginRight: 20,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: Colors.light.surface,
  },
  notifOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  notifDropdown: {
    position: 'absolute',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  notifHeader: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.light.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notifItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notifItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceContainer,
  },
  notifText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.onSurface,
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.outline,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing[6],
    right: Spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nairaSymbol: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '500',
  },
  // notification styles - Keep if you intend to add a proper notification section later
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 10,
    color: Colors.light.surface,
  },
});
