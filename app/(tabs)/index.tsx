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
  useWindowDimensions,
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
import { TransactionItem } from '@/components/ui/TransactionItem';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { moneyIn, moneyOut, netBalance, transactionCount } = useMonthlyBalances();
  const transactions = useTransactionStore((s) => s.transactions);
  const { user } = useAuth();

  const bellRef = useRef<View>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 });
  const [showTxModal, setShowTxModal] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'New transaction of ₦15,790 at Shoprite', time: '2 min ago' },
    { id: 'n2', text: 'Monthly salary of ₦350,000 received', time: '1 hour ago' },
    { id: 'n3', text: 'Grocery payment of ₦8,500 at Spar', time: '3 hours ago' },
    { id: 'n4', text: 'Airtime recharge of ₦1,000', time: '5 hours ago' },
  ]);

  const closeNotifications = () => setShowNotifications(false);

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const recentTransactions = transactions.slice(0, 10);
  const flaggedCount = transactions.filter((tx) => tx.isFlaggedForReview).length;
  const recentResolved = recentTransactions.map((t) => {
    const cat = useCategoryStore.getState().getCategoryById(t.categoryId);
    return { ...t, categoryName: cat?.name ?? 'Uncategorized', categoryIcon: cat?.iconIdentifier ?? 'help-circle', categoryColor: cat?.colorHex ?? '#ADAAA4' };
  });

  const cardWidth = (screenWidth - 40 - Spacing[1]) / 2;

  const prevMonthStart = new Date();
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  prevMonthStart.setDate(1);
  prevMonthStart.setHours(0, 0, 0, 0);
  const prevMonthEnd = new Date();
  prevMonthEnd.setDate(1);
  prevMonthEnd.setHours(0, 0, 0, 0);

  const prevMonthTxns = transactions.filter(
    (t) => t.transactionDate >= prevMonthStart.getTime() && t.transactionDate < prevMonthEnd.getTime()
  );
  const prevMoneyIn = prevMonthTxns
    .filter((t) => t.transactionType === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMoneyOut = prevMonthTxns
    .filter((t) => t.transactionType === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return 'N/A';
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

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

  const openNotifications = useCallback(() => {
    bellRef.current?.measureInWindow((x, y, width, height) => {
      setBellPos({ top: y + height + 4, right: screenWidth - (x + width / 2) });
      setShowNotifications(true);
    });
  }, [screenWidth]);

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
            style={[styles.notificationBtn]}
            onPress={openNotifications}
            activeOpacity={0.8}
          >
            <View>
              <BellIcon size={24} color={theme.onSurface} />
              {notifications.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{notifications.length > 9 ? '9+' : notifications.length}</Text>
                </View>
              )}
            </View>
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
        <View style={[styles.moneyHalf, styles.moneyInHalf, { width: cardWidth }]}>
          <Text style={styles.moneyLabelGreen}>Money In</Text>
          <Text style={styles.moneyInvalue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyIn)}</Text>
          <View style={styles.trendRow}>
            <Text style={styles.trendText}>{calcTrend(moneyIn, prevMoneyIn)} vs last month</Text>
          </View>
        </View>

        {/* Money Out Card */}
        <View style={[styles.moneyHalf, styles.moneyOutHalf, { width: cardWidth }]}>
          <Text style={styles.moneyLabelRed}>Money Out</Text>
          <Text style={styles.moneyOutvalue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyOut)}</Text>
          <View style={styles.trendRow}>
            <Text style={styles.trendText}>{calcTrend(moneyOut, prevMoneyOut)} vs last month</Text>
          </View>
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
            {recentResolved.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap the + button to add your first transaction</Text>
              </View>
            ) : recentResolved.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.separator} />}
                <TransactionItem
                  merchant={item.merchantName || 'Unknown'}
                  category={item.categoryName}
                  account={item.accountName || ''}
                  icon={item.categoryIcon}
                  color={item.categoryColor}
                  amount={item.amount}
                  type={item.transactionType}
                  date={formatDate(item.transactionDate)}
                  isFlagged={item.isFlaggedForReview}
                  onPress={() => router.push(`/transactions/${item.id}` as any)}
                />
              </React.Fragment>
            ))}
          </View>
        </ScrollView>

        {showNotifications && (
          <TouchableOpacity
            style={styles.notifOverlay}
            activeOpacity={1}
            onPress={closeNotifications}
          >
            <View style={[styles.notifDropdown, { top: bellPos.top, right: bellPos.right, width: screenWidth / 2 }]}>
              <Text style={styles.notifHeader}>Notifications</Text>
              <ScrollView style={{ maxHeight: screenHeight * 0.35 }} nestedScrollEnabled>
                {notifications.map((n, i) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => {
                      closeNotifications();
                      router.push('/transactions' as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.notifItem, i < notifications.length - 1 && styles.notifItemBorder]}>
                      <Text style={styles.notifText}>{n.text}</Text>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.notifClearBtn} onPress={clearAllNotifications} activeOpacity={0.7}>
                <Text style={styles.notifClearText}>Clear all notifications</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

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
    gap: Spacing[1],
  },
  moneyHalf: {
    padding: 16,
    justifyContent: 'center',
  },
  moneyInHalf: {
    backgroundColor: Colors.light.onPrimary,
    borderRadius: 12,
  },
  moneyOutHalf: {
    backgroundColor: Colors.light.onPrimary,
    borderRadius: 12,
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
    marginTop: 1,
    gap: 4,
  },
  trendText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: Colors.light.outline,
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
    paddingVertical: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  notifItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    marginTop: 2,
  },
  notifClearBtn: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceContainer,
    paddingVertical: 8,
    alignItems: 'center',
  },
  notifClearText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.light.primary,
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
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.main.error,
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
