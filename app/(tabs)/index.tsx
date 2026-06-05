import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Pressable,
  Platform,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Shadows, Radius, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BellIcon, ExportIcon, LightningIcon } from '@/components/ui/CustomSvgIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMonthlyBalances } from '@/lib/stores/transactionStore';
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
  iconType: 'shoprite' | 'salary';
  onPress?: () => void;
}

const CustomTransactionItem = ({
  merchant,
  bankAndDate,
  amount,
  category,
  isDebit,
  iconType,
  onPress
}: CustomTransactionProps) => {
  return (
    <TouchableOpacity
      style={styles.transactionContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon Circle */}
      {iconType === 'shoprite' ? (
        <View style={[styles.iconCircle, { backgroundColor: '#E31B23' }]}>
          {/* Shoprite trolly cart icon */}
          <MaterialIcons name="shopping-cart" size={22} color="#FFFFFF" />
        </View>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: '#E8F8EE' }]}>
          <Text style={styles.salaryIconText}>S</Text>
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
          {amount.startsWith('-') || amount.startsWith('+') ? amount.charAt(0) : ''}
          <Text style={styles.nairaSymbol}>₦</Text>
          {amount.replace(/^[+-]?₦/, '')}
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
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { moneyIn, moneyOut, netBalance, transactionCount } = useMonthlyBalances();

  const [showNotifications, setShowNotifications] = useState(false);
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 });
  const bellRef = useRef<View>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const unreadCount = 2;
  const windowWidth = Dimensions.get('window').width;

  const mockNotifications = [
    { id: 'n1', text: 'New transaction of ₦15,790 at Shoprite', time: '2 min ago' },
    { id: 'n2', text: 'Monthly salary of ₦350,000 received', time: '1 hour ago' },
  ];

  const openNotifications = () => {
    bellRef.current?.measureInWindow((x, y, width, height) => {
      setBellPos({ top: y + height + 4, right: windowWidth - x - width });
      setShowNotifications(true);
    });
  };

  const closeNotifications = () => setShowNotifications(false);

  const formatNaira = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs > 999_999) {
      if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
      return `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    return abs.toLocaleString('en-US');
  };

  // Exact data from Home screen.png
  const mockActivity = [
    {
      id: 'act1',
      merchant: 'Shoprite',
      bankAndDate: 'GT Bank • 24 May 2026',
      amount: '-₦15,790',
      category: 'Shopping',
      isDebit: true,
      iconType: 'shoprite' as const,
    },
    {
      id: 'act2',
      merchant: 'Monthly Salary',
      bankAndDate: 'Kuda MFB • 30 May 2026',
      amount: '+₦15,790',
      category: 'Shopping', // In the screenshot, both Shoprite and Salary seem to have "Shopping" listed under category, or it could be Salary. Let's make it look exactly like image! Wait, looking at the image Shoprite is "Shopping", and Salary has "Shopping" under it as well! Wait, let's look at the image: it says "+₦15,790" and below it is "+₦15,790"? No, below the second amount "+₦15,790", it's partially cut off but it says "Shopping"? Ah, wait, no, the third item is Shoprite with amount -₦15,790 and category Shopping. In the second item "Monthly Salary", the category says "Salary" or "Income" but it is actually obscured by the FAB. Wait, let's keep "Shopping" or "Salary" - let's make it "Shopping" if it matches, or "Salary" to be logical. The image shows the first item's category is "Shopping". The second item's category is cut off by the blue FAB. The third item has "Shopping". Let's write "Salary" for the salary item just to be standard, but actually "Shopping" in the image's third item. Let's make it exactly as shown.
      isDebit: false,
      iconType: 'salary' as const,
    },
    {
      id: 'act3',
      merchant: 'Shoprite',
      bankAndDate: 'GT Bank • 24 May 2026',
      amount: '-₦15,790',
      category: 'Shopping',
      isDebit: true,
      iconType: 'shoprite' as const,
    }
  ];

  const headerElement = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Blue Header Section */}
      <View style={[styles.blueHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeLabel}>Welcome</Text>
            <Text style={styles.welcomeName}>Obayemi!</Text>
          </View>
          <TouchableOpacity
            ref={bellRef}
            style={[styles.notificationBtn, Shadows.sm]}
            onPress={openNotifications}
            activeOpacity={0.8}
          >
            <BellIcon size={24} color="#001133" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
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
          <Text style={styles.moneyValue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyIn)}</Text>
          <View style={styles.trendRow}>
            <MaterialIcons name="trending-up" size={14} color="#007D3A" />
            <Text style={styles.trendTextGreen}>12.5% vs last month</Text>
          </View>
        </View>

        {/* Money Out Card */}
        <View style={[styles.moneyHalf, styles.moneyOutHalf]}>
          <Text style={styles.moneyLabelRed}>Money Out</Text>
          <Text style={styles.moneyValue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyOut)}</Text>
          <View style={styles.trendRow}>
            <MaterialIcons name="trending-down" size={14} color="#D30000" />
            <Text style={styles.trendTextRed}>8% vs last month</Text>
          </View>
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
  ), [insets.top, router, moneyIn, moneyOut, netBalance, transactionCount, showNotifications, openNotifications]);

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        <FlatList
          data={mockActivity}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomTransactionItem
              merchant={item.merchant}
              bankAndDate={item.bankAndDate}
              amount={item.amount}
              category={item.category}
              isDebit={item.isDebit}
              iconType={item.iconType}
              onPress={() => router.push(`/transactions/${item.id}` as any)}
            />
          )}
          ListHeaderComponent={headerElement}
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

      {showNotifications && (
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={closeNotifications}
        >
          <View style={[styles.notifDropdown, { top: bellPos.top, right: bellPos.right, width: windowWidth / 2 }]}>
            <Text style={styles.notifHeader}>Notifications</Text>
            {mockNotifications.map((n, i) => (
              <View key={n.id} style={[styles.notifItem, i < mockNotifications.length - 1 && styles.notifItemBorder]}>
                <Text style={styles.notifText}>{n.text}</Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      )}
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
    paddingBottom: 36,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  salaryIconText: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: '#007D3A',
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
