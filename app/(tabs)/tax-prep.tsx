import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type TaxFilter = 'all' | 'unclassified' | 'personal' | 'business' | 'shared';
type BatchAction = 'personal' | 'business' | 'shared' | null;

const TAX_LABELS: Record<string, string> = {
  personal: 'Personal',
  business: 'Business',
  shared: 'Shared',
};

const TAX_OPTIONS: { key: TaxFilter | BatchAction; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'business', label: 'Business' },
  { key: 'shared', label: 'Shared' },
];

export default function TaxPrepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();

  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const categories = useCategoryStore((s) => s.categories);
  const updateDefaultTaxClassification = useCategoryStore((s) => s.updateDefaultTaxClassification);

  const [activeFilter, setActiveFilter] = useState<TaxFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    if (activeFilter === 'unclassified') return transactions.filter((t) => !t.taxClassification);
    return transactions.filter((t) => t.taxClassification === activeFilter);
  }, [transactions, activeFilter]);

  const unclassifiedCount = useMemo(
    () => transactions.filter((t) => !t.taxClassification).length,
    [transactions]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
  }, [filteredTransactions]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchClassify = useCallback(async (classification: 'personal' | 'business' | 'shared') => {
    if (selectedIds.size === 0) return;
    setApplying(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateTransaction(id, { taxClassification: classification } as any)
        )
      );
      setSelectedIds(new Set());
      showAlert({ title: 'Done', message: `${selectedIds.size} transaction(s) classified as ${TAX_LABELS[classification]}.` });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message });
    } finally {
      setApplying(false);
    }
  }, [selectedIds, updateTransaction, showAlert]);

  const handleClearClassification = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setApplying(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateTransaction(id, { taxClassification: null } as any)
        )
      );
      setSelectedIds(new Set());
      showAlert({ title: 'Done', message: `${selectedIds.size} transaction(s) cleared.` });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message });
    } finally {
      setApplying(false);
    }
  }, [selectedIds, updateTransaction, showAlert]);

  const handleApplyCategoryDefaults = useCallback(async () => {
    const unclassified = transactions.filter((t) => !t.taxClassification);
    if (unclassified.length === 0) return;
    setApplying(true);
    let count = 0;
    try {
      await Promise.all(
        unclassified.map(async (t) => {
          const cat = categories.find((c) => c.id === t.categoryId);
          if (cat?.defaultTaxClassification) {
            await updateTransaction(t.id, { taxClassification: cat.defaultTaxClassification } as any);
            count++;
          }
        })
      );
      showAlert({ title: 'Done', message: `${count} transaction(s) auto-classified from category defaults.` });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message });
    } finally {
      setApplying(false);
    }
  }, [transactions, categories, updateTransaction, showAlert]);

  const handleUpdateCategoryDefault = useCallback(async (categoryId: string, value: 'personal' | 'business' | 'shared' | null) => {
    try {
      await updateDefaultTaxClassification(categoryId, value);
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message });
    }
  }, [updateDefaultTaxClassification, showAlert]);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Unknown';

  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.colorHex ?? theme.outline;

  const FILTER_TABS: { key: TaxFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: transactions.length },
    { key: 'unclassified', label: 'Unclassified', count: unclassifiedCount },
    { key: 'personal', label: 'Personal', count: transactions.filter((t) => t.taxClassification === 'personal').length },
    { key: 'business', label: 'Business', count: transactions.filter((t) => t.taxClassification === 'business').length },
    { key: 'shared', label: 'Shared', count: transactions.filter((t) => t.taxClassification === 'shared').length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={22} color={theme.onBackground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Tax Prep</Text>
        </View>

        {/* Category Defaults */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Category Defaults</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.outline }]}>
            Set default tax treatment per category. New transactions will inherit these values.
          </Text>

          {/* Legend */}
          <View style={[styles.legendBox, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendPill, { backgroundColor: Colors.main.warning + '1A' }]}>
                <Text style={[styles.legendPillText, { color: Colors.main.warning }]}>Per</Text>
              </View>
              <Text style={[styles.legendText, { color: theme.outline }]}>Personal — not deductible, excluded from filing</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendPill, { backgroundColor: Colors.main.warning + '1A' }]}>
                <Text style={[styles.legendPillText, { color: Colors.main.warning }]}>Biz</Text>
              </View>
              <Text style={[styles.legendText, { color: theme.outline }]}>Business — fully deductible / reportable income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendPill, { backgroundColor: Colors.main.warning + '1A' }]}>
                <Text style={[styles.legendPillText, { color: Colors.main.warning }]}>Sha</Text>
              </View>
              <Text style={[styles.legendText, { color: theme.outline }]}>Shared — mixed-use, requires pro-rated calculation</Text>
            </View>
          </View>

          {categories.map((cat) => (
            <View key={cat.id} style={[styles.defaultRow, { borderBottomColor: theme.outlineVariant }]}>
              <View style={styles.defaultRowLeft}>
                <View style={[styles.catDot, { backgroundColor: cat.colorHex }]} />
                <Text style={[styles.defaultRowLabel, { color: theme.onBackground }]}>{cat.name}</Text>
              </View>
              <View style={styles.defaultRowRight}>
                {TAX_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.taxOptionChip,
                      {
                        backgroundColor: cat.defaultTaxClassification === opt.key ? Colors.main.warning + '1A' : theme.surfaceContainerLow,
                        borderColor: cat.defaultTaxClassification === opt.key ? Colors.main.warning : theme.outlineVariant,
                      },
                    ]}
                    onPress={() => handleUpdateCategoryDefault(cat.id, cat.defaultTaxClassification === opt.key ? null : opt.key as 'personal' | 'business' | 'shared')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.taxOptionChipText,
                        { color: cat.defaultTaxClassification === opt.key ? Colors.main.warning : theme.outline },
                      ]}
                    >
                      {opt.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Transactions Section */}
        <View style={styles.txSection}>
          <View style={styles.txSectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Transactions</Text>
            {unclassifiedCount > 0 && (
              <TouchableOpacity
                style={[styles.applyDefaultsBtn, { backgroundColor: Colors.main.warning + '1A' }]}
                onPress={handleApplyCategoryDefaults}
                disabled={applying}
                activeOpacity={0.7}
              >
                <Text style={[styles.applyDefaultsText, { color: Colors.main.warning }]}>
                  {applying ? 'Applying...' : 'Apply Category Defaults'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: activeFilter === tab.key ? theme.primary : theme.surfaceContainerLow,
                  },
                ]}
                onPress={() => { setActiveFilter(tab.key); setSelectedIds(new Set()); }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === tab.key ? theme.onPrimary : theme.outline },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selection Actions */}
          {selectedIds.size > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: theme.surfaceContainerLow }]}>
              <Text style={[styles.selectionCount, { color: theme.onBackground }]}>
                {selectedIds.size} selected
              </Text>
              <View style={styles.selectionActions}>
                {TAX_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.actionChip, { backgroundColor: Colors.main.warning + '1A' }]}
                    onPress={() => handleBatchClassify(opt.key as 'personal' | 'business' | 'shared')}
                    disabled={applying}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionChipText, { color: Colors.main.warning }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.actionChip, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant, borderWidth: 1 }]}
                  onPress={handleClearClassification}
                  disabled={applying}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionChipText, { color: theme.outline }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="report" size={32} color={theme.outline} />
              <Text style={[styles.emptyText, { color: theme.outline }]}>No transactions found</Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => {
              const isSelected = selectedIds.has(tx.id);
              const catColor = getCategoryColor(tx.categoryId);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.txRow,
                    { backgroundColor: isSelected ? theme.primaryContainer + '33' : theme.surface },
                    isSelected && { borderColor: theme.primary, borderWidth: 1 },
                  ]}
                  onPress={() => toggleSelect(tx.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, { borderColor: isSelected ? theme.primary : theme.outlineVariant, backgroundColor: isSelected ? theme.primary : 'transparent' }]}>
                    {isSelected && <MaterialIcons name="check" size={14} color={theme.onPrimary} />}
                  </View>
                  <View style={[styles.catDot, { backgroundColor: catColor }]} />
                  <View style={styles.txInfo}>
                    <Text style={[styles.txMerchant, { color: theme.onBackground }]} numberOfLines={1}>
                      {tx.merchantName ?? 'Unknown'}
                    </Text>
                    <Text style={[styles.txMeta, { color: theme.outline }]}>
                      {getCategoryName(tx.categoryId)} • {new Date(tx.transactionDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.transactionType === 'credit' ? Colors.main.success : Colors.main.error }]}>
                      {tx.transactionType === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.txTaxPill,
                        { backgroundColor: tx.taxClassification ? Colors.main.warning + '1A' : theme.surfaceContainerLow },
                      ]}
                    >
                      <Text
                        style={[
                          styles.txTaxPillText,
                          { color: tx.taxClassification ? Colors.main.warning : theme.outline },
                        ]}
                      >
                        {tx.taxClassification ? TAX_LABELS[tx.taxClassification] : 'Unset'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
  },
  sectionCard: {
    marginHorizontal: Spacing[5],
    borderRadius: Radius.md,
    padding: Spacing[4],
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
  },
  sectionSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    marginTop: -4,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  defaultRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  defaultRowLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  defaultRowRight: {
    flexDirection: 'row',
    gap: 4,
  },
  taxOptionChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  taxOptionChipText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
  },
  txSection: {
    paddingHorizontal: Spacing[5],
    gap: 12,
  },
  txSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyDefaultsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  applyDefaultsText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    marginRight: 8,
  },
  filterTabText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    gap: 8,
  },
  selectionCount: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  actionChipText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    gap: 10,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txMerchant: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  txMeta: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
  },
  txTaxPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  txTaxPillText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 10,
  },
  legendBox: {
    padding: Spacing[3],
    borderRadius: Radius.sm,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  legendPillText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 10,
  },
  legendText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    flex: 1,
  },
});
