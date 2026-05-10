import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ZIndex } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { Skeleton, TransactionSkeleton } from '@/components/ui/Skeleton';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { UpcomingPaymentCard } from '@/components/dashboard/UpcomingPaymentCard';
import { useHomeData, TransactionWithCategory } from '@/hooks/useHomeData';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { 
    thisMonthIncome, 
    thisMonthSpending, 
    recentTransactions, 
    isLoading 
  } = useHomeData();

  const totalBalance = thisMonthIncome - thisMonthSpending;

  const headerElement = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greetingLabel, { color: theme.outline }]}>Hello,</Text>
          <Text style={[styles.greetingName, { color: theme.onBackground }]}>Siyam Ahmed!</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerIcon, { backgroundColor: theme.surface }]}>
            <IconSymbol name="magnifyingglass" size={20} color={theme.onBackground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIcon, { backgroundColor: theme.surface }]}>
            <IconSymbol name="bell" size={20} color={theme.onBackground} />
          </TouchableOpacity>
        </View>
      </View>
      
      <BalanceCard 
        balance={formatCurrency(4570.80, 'USD')} // Using image value for demo
        onAddPress={() => router.push('/manual-entry')}
      />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Upcoming payment</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: theme.outline }]}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.horizontalScroll}
      >
        <UpcomingPaymentCard 
          title="Adobe Premium"
          amount="$30/month"
          daysLeft={2}
          icon="a.circle.fill"
          backgroundColor="#6B4EFF"
        />
        <UpcomingPaymentCard 
          title="Apple Premium"
          amount="$30/month"
          daysLeft={2}
          icon="applelogo"
          backgroundColor="#F5F5F5"
          textColor="#191919"
        />
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={[styles.seeAll, { color: theme.outline }]}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, router]);

  return (
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
              <TransactionSkeleton />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.outline }]}>
                No transactions found for this month.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.outlineVariant }]} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false} // Explicitly disable to avoid native view recycling issues on Android
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
  },
  header: {
    paddingTop: Spacing[4],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  greetingLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyL,
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[8],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
    fontWeight: '700',
  },
  seeAll: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingRight: Spacing[4],
    marginBottom: Spacing[2],
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
});
