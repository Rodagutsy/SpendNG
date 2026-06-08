import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography, Shadows, Spacing } from '@/constants/Tokens';
import { BellIcon, ExportIcon, LightningIcon } from '@/components/ui/CustomSvgIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMonthlyBalances, useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useAuth } from '@/context/AuthContext';
import { TransactionModal } from '@/components/TransactionModal';
import { ExportModal } from '@/components/ExportModal';

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const QuickActionButton = ({ label, icon, onPress }: QuickActionButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.actionButton, Shadows.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

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
  return (
    <TouchableOpacity
      style={styles.transactionContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon Circle */}
      {isDebit ? (
        <View style={[styles.iconCircle, { backgroundColor: '#E31B23' }]}>
          <MaterialIcons name="shopping-cart" size={22} color="#FFFFFF" />
        </View>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: '#E8F8EE' }]}>
          <MaterialIcons name="arrow-downward" size={22} color="#007D3A" />
        </View>
      )}

      {/* Middle Content */}
      <View style={styles.transactionMiddle}>
        <Text style={styles.merchantText} numberOfLines={1}>
          {merchant}
        </Text>
        <Text style={styles.detailText} numberOfLines={1}>
          {bankAndDate}
        </Text>
      </View>

      {/* Right Content */}
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.amountText,
            { color: isDebit ? '#D30000' : '#00BD00' }
          ]}
        >
          {isDebit ? '-' : '+'}
          <Text style={styles.nairaSymbol}>₦</Text>
          {amount}
        </Text>
        <Text style={styles.categoryText} numberOfLines={1}>
          {category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moneyIn, moneyOut, netBalance, transactionCount } = useMonthlyBalances();
  const transactions = useTransactionStore((s) => s.transactions);
  const { user } = useAuth();

  const bellRef = useRef<View>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const recentTransactions = transactions.slice(0, 10);

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
    // Notification feature to be implemented
  }, []);

  const headerElement = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Blue Header Section */}
      <View style={[styles.blueHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeLabel}>Welcome</Text>
            <Text style={styles.welcomeName}>{userName}</Text>
          </View>
          <TouchableOpacity
            ref={bellRef}
            style={[styles.notificationBtn, Shadows.sm]}
            onPress={openNotifications}
            activeOpacity={0.8}
          >
            <BellIcon size={24} color="#001133" />
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
          <Text style={styles.moneyValue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyIn)}</Text>
        </View>

        {/* Money Out Card */}
        <View style={[styles.moneyHalf, styles.moneyOutHalf]}>
          <Text style={styles.moneyLabelRed}>Money Out</Text>
          <Text style={styles.moneyValue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyOut)}</Text>
        </View>
      </View>

      {/* Quick Actions Header */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      {/* Quick Actions Buttons */}
      <View style={styles.quickActionsRow}>
        <QuickActionButton
          label="Insight"
          icon={<LightningIcon size={20} color="#001133" />}
          onPress={() => router.push('/insights' as any)}
        />
        <QuickActionButton
          label="Export"
          icon={<ExportIcon size={20} color="#001133" />}
          onPress={() => setShowExportModal(true)}
        />
      </View>

      {/* Recent Activity Header */}
      <View style={styles.recentActivityHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/transactions' as any)}>
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [insets.top, router, moneyIn, moneyOut, netBalance, transactionCount, userName, openNotifications]);

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <FlatList
          data={recentTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomTransactionItem
              merchant={item.merchantName || 'Unknown'}
              bankAndDate={`${getAccountLabel(item)} • ${formatDate(item.transactionDate)}`}
              amount={formatNaira(item.amount)}
              category={getCategoryName(item.categoryId)}
              isDebit={item.transactionType === 'debit'}
              onPress={() => router.push(`/transactions/${item.id}` as any)}
            />
          )}
          ListHeaderComponent={headerElement}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add your first transaction</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Action Button (FAB) exactly as in image */}
        <TouchableOpacity
          style={[styles.fab, Shadows.large]}
          onPress={() => setShowTxModal(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TransactionModal visible={showTxModal} onClose={() => setShowTxModal(false)} />
        <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 110 : 90,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  blueHeader: {
    backgroundColor: '#EBF2FC', // Light blue header exactly like image
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
    color: '#001133',
    opacity: 0.8,
  },
  welcomeName: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
    color: '#001133',
    marginTop: -2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netBalancePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 16,
  },
  netBalanceText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#001133',
  },
  balanceValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 44,
    color: '#001133',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: -0.5,
  },
  balanceSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#001133',
    opacity: 0.65,
    textAlign: 'center',
    marginTop: 0,
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
    backgroundColor: '#E8F8EE', // Light green
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  moneyOutHalf: {
    backgroundColor: '#FDECEB', // Light pink
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  moneyLabelGreen: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: '#007D3A',
  },
  moneyLabelRed: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: '#D30000',
  },
  moneyValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    color: '#001133',
    marginTop: 4,
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
    color: '#007D3A',
  },
  trendTextRed: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: '#D30000',
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#001133',
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F2F6', // Light gray Action Button background
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontFamily: Typography.fonts.title,
    fontSize: 15,
    color: '#001133',
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  seeAllText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: '#0B5CFF',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#001133',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#7B786F',
    textAlign: 'center',
  },
  transactionMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantText: {
    fontFamily: Typography.fonts.title,
    fontSize: 16,
    color: '#001133',
  },
  detailText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: '#7B786F',
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
    color: '#7B786F',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
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
    backgroundColor: '#D30000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  notifOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  notifDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
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
    color: '#001133',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notifItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notifItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notifText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: '#001133',
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: '#7B786F',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing[6], // Above custom tab bar height
    right: Spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B5CFF', // Premium blue FAB exactly like image
    justifyContent: 'center',
    alignItems: 'center',
  },
  nairaSymbol: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '500',
  },
});
