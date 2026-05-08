import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ZIndex } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { Skeleton, TransactionSkeleton } from '@/components/ui/Skeleton';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { CategoryBreakdownBar } from '@/components/dashboard/CategoryBreakdownBar';
import { useHomeData } from '@/hooks/useHomeData';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { 
    thisMonthIncome, 
    thisMonthSpending, 
    incomeDelta, 
    spendingDelta, 
    recentTransactions, 
    categoryBreakdown,
    isLoading 
  } = useHomeData();

  const currentMonth = format(new Date(), 'MMMM yyyy');

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.greeting, { color: theme.onBackground }]}>
        Good Morning, User!
      </Text>
      
      <DashboardSummaryCard 
        income={thisMonthIncome}
        spending={thisMonthSpending}
        incomeDelta={incomeDelta}
        spendingDelta={spendingDelta}
        monthName={currentMonth}
      />

      <CategoryBreakdownBar data={categoryBreakdown} />

      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>
          Recent Transactions
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.listContent}>
          <Skeleton width="70%" height={32} style={{ marginTop: Spacing[4], marginBottom: Spacing[4] }} />
          <Skeleton height={160} radius={Radius.lg} style={{ marginBottom: Spacing[6] }} />
          <Skeleton height={80} style={{ marginBottom: Spacing[6] }} />
          <Skeleton width="50%" height={24} style={{ marginBottom: Spacing[4] }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: any }) => (
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.outline }]}>
              No transactions found for this month.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.outlineVariant }]} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/manual-entry')}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={24} color={theme.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: 100, // Space for FAB
  },
  header: {
    paddingTop: Spacing[4],
  },
  greeting: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
    marginBottom: Spacing[2],
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[6],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleS,
    fontWeight: '600',
  },
  seeAll: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
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
    marginLeft: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    zIndex: ZIndex.nav,
  },
});
