import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Pressable 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ZIndex } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { TransactionSkeleton } from '@/components/ui/Skeleton';
import { useHomeData, TransactionWithCategory } from '@/hooks/useHomeData';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { 
    thisMonthIncome, 
    thisMonthSpending, 
    incomeDelta,
    spendingDelta,
    topSpendingCategory,
    quickInsights,
    recentTransactions, 
    isLoading 
  } = useHomeData();

  const [showNotifications, setShowNotifications] = useState(false);

  const HeroSection = useMemo(() => (
    <View style={styles.heroRow}>
      <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
        <View style={styles.statHeader}>
          <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(0, 189, 0, 0.1)' }]}>
            <IconSymbol name="arrow.up.right" size={14} color={theme.success} />
          </View>
          <Text style={[styles.statLabel, { color: theme.outline }]}>Income</Text>
        </View>
        <Text style={[styles.statValue, { color: theme.onPrimaryContainer }, Typography.styles.headlineSmallSb]}>
          {formatCurrency(thisMonthIncome)}
        </Text>
        <View style={styles.trendContainer}>
          <IconSymbol name="arrow.up.right" size={10} color={theme.success} />
          <Text style={[styles.trendValue, { color: theme.success }]}>{incomeDelta}% vs last Month</Text>
        </View>
      </Card>

      <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
        <View style={styles.statHeader}>
          <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(211, 0, 0, 0.1)' }]}>
            <IconSymbol name="arrow.down.right" size={14} color={theme.error} />
          </View>
          <Text style={[styles.statLabel, { color: theme.outline }]}>Spending</Text>
        </View>
        <Text style={[styles.statValue, { color: theme.onPrimaryContainer }, Typography.styles.headlineSmallSb]}>
          {formatCurrency(thisMonthSpending)}
        </Text>
        <View style={styles.trendContainer}>
          <IconSymbol name="arrow.down.right" size={10} color={theme.error} />
          <Text style={[styles.trendValue, { color: theme.error }]}>{Math.abs(spendingDelta)}% vs last Month</Text>
        </View>
      </Card>
    </View>
  ), [theme, thisMonthIncome, thisMonthSpending, incomeDelta, spendingDelta]);

  const KeyInsightCard = useMemo(() => {
    const insight = quickInsights[0] || { text: 'Analyzing your spending patterns...' };
    return (
      <TouchableOpacity 
        style={[styles.keyInsightCard, { backgroundColor: theme.primaryContainer }]}
        onPress={() => router.push('/(tabs)/insights')}
      >
        <View style={styles.insightHeader}>
          <Text style={[styles.insightTitle, { color: theme.onPrimaryContainer }]}>Key Insight</Text>
          <IconSymbol name="lightbulb.fill" size={16} color={theme.onPrimaryContainer} />
        </View>
        <Text style={[styles.insightBody, { color: theme.onPrimaryContainer }]}>
          {insight.text}
        </Text>
      </TouchableOpacity>
    );
  }, [theme, quickInsights, router]);

  const headerElement = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.welcomeLabel, { color: theme.outline }]}>Welcome,</Text>
          <Text style={[styles.welcomeName, { color: theme.onBackground }]}>Jeremiah</Text>
        </View>
        <View>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.surface }]}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <IconSymbol name="bell" size={22} color={theme.onBackground} />
            <View style={[styles.badge, { backgroundColor: theme.error }]}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {showNotifications && (
            <View style={[styles.dropdown, { backgroundColor: theme.surface }, Shadows.large]}>
              <Text style={[styles.dropdownHeader, { color: theme.onBackground }]}>Notifications</Text>
              <View style={[styles.dropdownItem, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.dropdownText, { color: theme.onBackground }]}>Salary received: ₦750,000</Text>
              </View>
              <View style={[styles.dropdownItem, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.dropdownText, { color: theme.onBackground }]}>Rent payment due in 2 days</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={[styles.clearAll, { color: theme.primary }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {HeroSection}

      {KeyInsightCard}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.onBackground }, Typography.styles.headlineSmallSb]}>Top Spending</Text>
      </View>
      <Card style={styles.categoryCard}>
        <View style={styles.categoryContent}>
          <View style={[styles.categoryCircle, { borderColor: topSpendingCategory.color }]}>
            <Text style={[styles.categoryPercent, { color: theme.onBackground }]}>{topSpendingCategory.percentage}%</Text>
          </View>
          <View style={styles.categoryDetails}>
            <Text style={[styles.categoryName, { color: theme.onBackground }]}>{topSpendingCategory.name}</Text>
            <Text style={[styles.categoryAmount, { color: theme.onBackground }]}>{formatCurrency(topSpendingCategory.amount)}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.onBackground }, Typography.styles.headlineSmallSb]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, router, HeroSection, KeyInsightCard, topSpendingCategory, showNotifications]);

  return (
    <Pressable style={{ flex: 1 }} onPress={() => setShowNotifications(false)}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        <FlatList
          data={isLoading ? [] : recentTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: TransactionWithCategory }) => (
            <TransactionItem
              merchant={item.merchantName || 'Unknown Merchant'}
              category={item.categoryName}
              account={item.accountName || 'Unknown Account'}
              icon={item.categoryIcon}
              color={item.categoryColor}
              amount={item.amount}
              type={item.transactionType}
              date={format(item.transactionDate, 'MMM dd')}
              onPress={() => router.push(`/(tabs)/transactions/${item.id}`)}
            />
          )}
          ListHeaderComponent={headerElement}
          ListEmptyComponent={
            isLoading ? (
              <View>
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.outline }]}>
                  No transactions found.
                </Text>
              </View>
            )
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.outlineVariant }]} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.primary }, Shadows.normal]}
          onPress={() => router.push('/manual-entry')}
        >
          <IconSymbol name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[24],
  },
  header: {
    paddingTop: Spacing[4],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[8],
    zIndex: ZIndex.overlay,
  },
  welcomeLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: 0,
  },
  welcomeName: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineS,
    fontWeight: '700',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 240,
    borderRadius: Radius.md,
    padding: Spacing[4],
    zIndex: ZIndex.modal,
  },
  dropdownHeader: {
    fontWeight: '700',
    marginBottom: Spacing[2],
  },
  dropdownItem: {
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 12,
  },
  clearAll: {
    textAlign: 'center',
    marginTop: Spacing[2],
    fontSize: 12,
    fontWeight: '600',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing[4],
  },
  statCard: {
    flex: 1,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  statLabel: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.labelM,
    fontWeight: '600',
  },
  statValue: {
    // headlineSmallSb
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyInsightCard: {
    padding: Spacing[5],
    borderRadius: Radius.lg,
    marginTop: Spacing[2],
    marginBottom: Spacing[6],
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  insightTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '700',
  },
  insightBody: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    // headlineSmallSb
  },
  seeAll: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '600',
  },
  categoryCard: {
    padding: Spacing[4],
    marginBottom: Spacing[2],
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: Spacing[10],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    marginVertical: Spacing[2],
  },
  fab: {
    position: 'absolute',
    bottom: Spacing[6],
    right: Spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: ZIndex.raised,
  }
});
