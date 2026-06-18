import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography, Shadows, Spacing, Colors, Palette, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency } from '@/lib/utils';
import { BellIcon } from '@/components/ui/CustomSvgIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMonthlyBalances, useTransactionStore } from '@/lib/stores/transactionStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CashflowEngine } from '@/lib/cashflow-engine';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import { useAuth } from '@/context/AuthContext';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { SMSService } from '@/lib/sms-service';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText, extractTransactionInfo } from '@/lib/ocr';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { moneyIn, moneyOut, netBalance, transactionCount } = useMonthlyBalances();
  const transactions = useTransactionStore((s) => s.homeTransactions);
  const fetchHomeTransactions = useTransactionStore((s) => s.fetchHomeTransactions);
  const storeLoading = useTransactionStore((s) => s.loading);
  const { user } = useAuth();

  const bellRef = useRef<View>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 });
  const [showTxModal, setShowTxModal] = useState(false);
  const [txModalPrefill, setTxModalPrefill] = useState<{ receiptUri?: string; type?: 'credit' | 'debit'; amount?: string; merchant?: string } | null>(null);
  const [bannerDismissedAt, setBannerDismissedAt] = useState<number | null>(null);
  const clearedNotificationIds = useNotificationStore((s) => s.clearedIds);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);

  useEffect(() => {
    fetchHomeTransactions();
    (async () => {
      const smsStatus = await SMSService.getConnectionStatus().catch(() => ({ hasPermissions: false }));
      if (!smsStatus.hasPermissions) {
        setShowConnectPrompt(true);
      }
    })();
  }, []);

  const closeNotifications = () => setShowNotifications(false);

  const taxSteps = useTaxStore((s) => s.steps);
  const stepsDone = taxSteps.filter((s) => s.done).length;
  const hasStartedReview = stepsDone > 0;
  const now = new Date();
  const month = now.getMonth();
  const isFilingSeason = month >= 0 && month <= 2;
  const bannerVisible = !bannerDismissedAt || (Date.now() - bannerDismissedAt > 30 * 86400000);

  let bannerTitle: string;
  let bannerCta: string;
  let bannerOverlayColor: string;

  if (hasStartedReview) {
    bannerTitle = `Tax review ${stepsDone} of 4 steps complete`;
    bannerCta = 'Continue';
    bannerOverlayColor = 'rgba(0, 26, 77, 0.88)';
  } else if (isFilingSeason) {
    bannerTitle = 'Filing season is here. Prepare your tax file now.';
    bannerCta = 'Prepare Tax File';
    bannerOverlayColor = 'rgba(107, 78, 255, 0.88)';
  } else {
    bannerTitle = 'Your records are building up. Start your tax review anytime.';
    bannerCta = 'Review Now!';
    bannerOverlayColor = 'rgba(0, 26, 77, 0.88)';
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const recentTransactions = transactions.filter((t) => !t.isDuplicate).sort((a, b) => b.transactionDate - a.transactionDate).slice(0, 4);
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

  const summaries = useMemo(() => CashflowEngine.monthlySummaries(transactions, 2), [transactions]);
  const currentSummary = summaries[1] || { income: 0, expense: 0, net: 0, transactionCount: 0, monthStart: 0 };
  const prevSummary = summaries[0] || { income: 0, expense: 0, net: 0, transactionCount: 0, monthStart: 0 };

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

  const notificationItems = useMemo(() => {
    const seen = new Set<string>();
    const items: { id: string; text: string; time: string; transactionId: string }[] = [];
    const push = (tx: typeof transactions[0], text: string) => {
      if (seen.has(tx.id)) return;
      seen.add(tx.id);
      items.push({ id: tx.id, text, time: formatDate(tx.transactionDate), transactionId: tx.id });
    };
    transactions.filter((tx) => tx.isFlaggedForReview).forEach((tx) =>
      push(tx, `${tx.merchantName || 'Unknown'} — ${formatCurrency(tx.amount, tx.currency)} requires review`)
    );
    transactions.filter((tx) => tx.isDuplicate).forEach((tx) =>
      push(tx, `Duplicate detected${tx.merchantName ? ` — ${tx.merchantName}` : ''}`)
    );
    return items.filter((n) => !clearedNotificationIds.includes(n.id));
  }, [transactions, clearedNotificationIds]);

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
              {notificationItems.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{notificationItems.length > 9 ? '9+' : notificationItems.length}</Text>
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
            <Text style={styles.trendText}>{calcTrend(moneyIn, prevSummary.income)} vs last month</Text>
          </View>
        </View>

        {/* Money Out Card */}
        <View style={[styles.moneyHalf, styles.moneyOutHalf, { width: cardWidth }]}>
          <Text style={styles.moneyLabelRed}>Money Out</Text>
          <Text style={styles.moneyOutvalue}><Text style={styles.nairaSymbol}>₦</Text>{formatNaira(moneyOut)}</Text>
          <View style={styles.trendRow}>
            <Text style={styles.trendText}>{calcTrend(moneyOut, prevSummary.expense)} vs last month</Text>
          </View>
        </View>
      </View>

      {/* Tax Filing Alert */}
      {bannerVisible && (
        <ImageBackground
          source={require('@/assets/images/dashboard_overview.png')}
          style={[styles.taxAlert, Shadows.sm]}
          imageStyle={styles.taxAlertImage}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bannerOverlayColor, borderRadius: 12 }]} />
          <View style={styles.taxAlertInner}>
            {/* Close button row */}
            <View style={styles.taxCloseRow}>
              <TouchableOpacity
                onPress={() => setBannerDismissedAt(Date.now())}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            {/* Content row: text left, button right */}
            <View style={styles.taxContentRow}>
              <Text style={styles.taxAlertText}>{bannerTitle}</Text>
              <TouchableOpacity
                style={[styles.taxFileBtn, hasStartedReview && { backgroundColor: Colors.main.warning }]}
                onPress={() => router.push('/(tabs)/tax-prep')}
                activeOpacity={0.8}
              >
                <Text style={styles.taxFileBtnText}>{bannerCta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      )}

    </View>
  ), [insets.top, router, moneyIn, moneyOut, netBalance, transactionCount, userName, openNotifications, bannerVisible, bannerOverlayColor, bannerTitle, bannerCta, hasStartedReview, bannerDismissedAt]);

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
            {storeLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : recentResolved.length === 0 ? (
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
                  isDuplicate={item.isDuplicate}
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
                {notificationItems.map((n, i) => (
                  <TouchableOpacity
                    key={n.id + n.transactionId}
                    onPress={() => {
                      closeNotifications();
                      router.push(`/transactions/${n.transactionId}` as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.notifItem, i < notificationItems.length - 1 && styles.notifItemBorder]}>
                      <Text style={styles.notifText}>{n.text}</Text>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.notifClearBtn} onPress={() => { useNotificationStore.getState().clearAll(notificationItems.map((n) => n.id)); closeNotifications(); }} activeOpacity={0.7}>
                <Text style={styles.notifClearText}>Clear all notifications</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity
          style={[styles.fab, Shadows.large]}
          onPress={() => setShowFabMenu(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={24} color={theme.onPrimary} />
        </TouchableOpacity>

        <TransactionModal visible={showTxModal} onClose={() => { setShowTxModal(false); setTxModalPrefill(null); }} initialReceiptUri={txModalPrefill?.receiptUri} />

        {/* FAB Menu */}
        {showFabMenu && (
          <TouchableOpacity style={styles.fabOverlay} activeOpacity={1} onPress={() => setShowFabMenu(false)}>
            <View style={[styles.fabMenu, { backgroundColor: theme.surface }]}>
              <Text style={[styles.fabMenuTitle, { color: theme.onSurface }]}>Add Transaction</Text>

              <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setShowFabMenu(false); setShowTxModal(true); }} activeOpacity={0.7}>
                <View style={[styles.fabMenuIcon, { backgroundColor: theme.primaryContainer }]}>
                  <MaterialIcons name="edit" size={20} color={theme.primary} />
                </View>
                <View style={styles.fabMenuTextWrap}>
                  <Text style={[styles.fabMenuLabel, { color: theme.onSurface }]}>Manual Entry</Text>
                  <Text style={[styles.fabMenuDesc, { color: theme.outline }]}>Type in transaction details</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fabMenuItem} onPress={async () => {
                setShowFabMenu(false);
                setScanningReceipt(true);
                try {
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                  });
                  if (!result.canceled && result.assets[0]) {
                    const uri = result.assets[0].uri;
                    const recognizedText = await recognizeText(uri);
                    const info = extractTransactionInfo(recognizedText);
                    setTxModalPrefill({
                      receiptUri: uri,
                      type: info.transactionType ?? 'debit',
                      amount: info.amount ? info.amount.toFixed(2) : undefined,
                      merchant: info.merchant ?? undefined,
                    });
                    setShowTxModal(true);
                  }
                } catch {
                  // fallback to blank modal
                  setTxModalPrefill({ receiptUri: undefined });
                  setShowTxModal(true);
                } finally {
                  setScanningReceipt(false);
                }
              }} activeOpacity={0.7}>
                <View style={[styles.fabMenuIcon, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialIcons name="camera-alt" size={20} color="#E65100" />
                </View>
                <View style={styles.fabMenuTextWrap}>
                  <Text style={[styles.fabMenuLabel, { color: theme.onSurface }]}>Scan Receipt</Text>
                  <Text style={[styles.fabMenuDesc, { color: theme.outline }]}>Snap a photo to auto-fill</Text>
                </View>
                {scanningReceipt && <ActivityIndicator size="small" color={theme.primary} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setShowFabMenu(false); router.push('/statement-import' as any); }} activeOpacity={0.7}>
                <View style={[styles.fabMenuIcon, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialIcons name="description" size={20} color="#2E7D32" />
                </View>
                <View style={styles.fabMenuTextWrap}>
                  <Text style={[styles.fabMenuLabel, { color: theme.onSurface }]}>Upload Statement</Text>
                  <Text style={[styles.fabMenuDesc, { color: theme.outline }]}>Import CSV or PDF bank statement</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Connect source prompt */}
        <Modal visible={showConnectPrompt} transparent animationType="fade" onRequestClose={() => setShowConnectPrompt(false)}>
          <View style={styles.connectOverlay}>
            <View style={[styles.connectCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.connectIconCircle, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="link" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.connectTitle, { color: theme.onSurface }]}>Import Your Transactions</Text>
              <Text style={[styles.connectMessage, { color: theme.outline }]}>
                Enable SMS import or upload bank statements to automatically track your finances.
              </Text>
              <View style={styles.connectActions}>
                <TouchableOpacity
                  style={[styles.connectPrimaryBtn, { backgroundColor: theme.primary }]}
                  onPress={() => { setShowConnectPrompt(false); router.push('/settings/connected-accounts' as any); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.connectPrimaryBtnText, { color: theme.onPrimary }]}>Connect Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.connectSkipBtn}
                  onPress={() => setShowConnectPrompt(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.connectSkipText, { color: theme.outline }]}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
    position: 'relative',
  },
  taxAlertImage: {
    borderRadius: 12,
  },
  taxAlertInner: {
    padding: 16,
  },
  taxCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  taxContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxAlertText: {
    flex: 1,
    fontFamily: Typography.fonts.medium,
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
  fabOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fabMenu: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    gap: 4,
  },
  fabMenuTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    marginBottom: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.sm,
    gap: 12,
  },
  fabMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuTextWrap: {
    flex: 1,
  },
  fabMenuLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
  },
  fabMenuDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    marginTop: 1,
  },
  connectOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 32,
  },
  connectCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  connectIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  connectTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  connectMessage: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectActions: {
    width: '100%',
    gap: 10,
  },
  connectPrimaryBtn: {
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectPrimaryBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
  },
  connectSkipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  connectSkipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
});
