import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ExportModal } from '@/components/ExportModal';
import { FilterModal } from '@/components/FilterModal';
import { format } from 'date-fns';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    filters,
    clearFilters,
    setFilters,
  } = useTransactionStore();
  const { categories, fetchCategories, getCategoryById } = useCategoryStore();

  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim()) {
        setFilters({ ...filters, keyword: searchText.trim() });
      } else if (filters.keyword) {
        const rest = { ...filters };
        delete rest.keyword;
        setFilters(rest);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  const TX_TYPE_PILLS = [
    { key: 'all', label: 'All' },
    { key: 'credit', label: 'Money In' },
    { key: 'debit', label: 'Money Out' },
  ] as const;

  const resolvedTransactions = useMemo(() => {
    const mapped = transactions.map((t) => {
      const cat = getCategoryById(t.categoryId);
      return {
        ...t,
        categoryName: cat?.name ?? 'Uncategorized',
        categoryIcon: cat?.iconIdentifier ?? 'help-circle',
        categoryColor: cat?.colorHex ?? '#ADAAA4',
      };
    });
    if (txTypeFilter === 'all') return mapped;
    return mapped.filter((t) => t.transactionType === txTypeFilter);
  }, [transactions, categories, txTypeFilter]);

  const renderItem = ({ item }: any) => (
    <TransactionItem
      merchant={item.merchantName ?? 'Unknown'}
      category={item.categoryName}
      account={item.accountName ?? ''}
      icon={item.categoryIcon}
      color={item.categoryColor}
      amount={item.amount}
      type={item.transactionType}
      date={format(new Date(item.transactionDate), 'd MMM yyyy')}
      onPress={() => router.push(`/(tabs)/transactions/${item.id}`)}
    />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="info.circle.fill" size={48} color={theme.error} />
          <Text style={[styles.emptyTitle, { color: theme.onBackground }]}>Error loading transactions</Text>
          <Text style={[styles.emptySubtitle, { color: theme.outline }]}>{error}</Text>
          <TouchableOpacity onPress={() => fetchTransactions()} style={[styles.retryBtn, { backgroundColor: theme.primary }]}>
            <Text style={[styles.retryText, { color: theme.onPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="list.bullet" size={48} color={theme.outline} />
        <Text style={[styles.emptyTitle, { color: theme.onBackground }]}>No transactions</Text>
        <Text style={[styles.emptySubtitle, { color: theme.outline }]}>
          {hasActiveFilters ? 'Try adjusting your filters' : 'Your transactions will appear here after importing'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.onBackground }]}>Activity</Text>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.surface,
                borderColor: searchFocused ? theme.primary : theme.outlineVariant,
                borderWidth: 1,
              },
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={searchFocused ? theme.primary : theme.outlineVariant}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.onBackground }]}
              placeholder="Search transactions..."
              placeholderTextColor={theme.outline}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol name="plus" size={18} color={theme.outlineVariant} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.85}
          >
            <IconSymbol name="square.and.arrow.up" size={16} color={theme.onPrimary} />
            <Text style={[styles.exportBtnText, { color: theme.onPrimary }]}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.listCard, { backgroundColor: theme.surface }]}>
        <View style={styles.pillsFilterRow}>
          <View style={styles.typePillsRow}>
            {TX_TYPE_PILLS.map((pill) => (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: txTypeFilter === pill.key ? theme.primary : theme.background,
                    borderColor: txTypeFilter === pill.key ? theme.primary : theme.outlineVariant,
                  },
                ]}
                onPress={() => setTxTypeFilter(pill.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typePillText,
                    { color: txTypeFilter === pill.key ? theme.onPrimary : theme.onBackground },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={[styles.filterBtn, { backgroundColor: theme.background }]}>
            <IconSymbol name="line.3.horizontal.decrease" size={18} color={theme.onBackground} />
            {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearRow}>
            <Text style={[styles.clearText, { color: theme.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={resolvedTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[styles.listContent, resolvedTransactions.length === 0 && styles.listEmpty]}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.outlineVariant }]} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
      <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 32,
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleL
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
  },
  exportBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonM,
  },
  pillsFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typePillsRow: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  typePillText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    height: 48,
    borderRadius: Radius.sm,
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    height: 48,
  },
  clearRow: {
    alignItems: 'flex-end',
    marginTop: Spacing[2],
  },
  clearText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
  },
  listCard: {
    flex: 1,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    marginBottom: Spacing[3],
    borderRadius: Radius.lg,
    padding: Spacing[3],
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: Spacing[4],
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[16],
  },
  emptyTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  emptySubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing[4],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[6],
    borderRadius: Radius.md,
  },
  retryText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
    fontWeight: '600',
  },
});
