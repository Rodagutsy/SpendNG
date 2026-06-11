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
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useCategoryDefaultStore } from '@/lib/stores/categoryDefaultStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import { TaxClassSheet } from '@/components/tax/TaxClassSheet';
import { StepIncomeReview } from '@/components/tax/StepIncomeReview';
import { StepExpenseReview } from '@/components/tax/StepExpenseReview';
import { StepWhtReview } from '@/components/tax/StepWhtReview';
import { StepTaxSummary } from '@/components/tax/StepTaxSummary';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type TaxFilter = 'all' | 'unclassified' | string;
type BatchAction = string | null;

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
  const getDefaultForCategory = useCategoryDefaultStore((s) => s.getDefaultForCategory);
  const categoryDefaults = useCategoryDefaultStore((s) => s.defaults);
  const { classifications: taxClasses, getById: getTaxClassById } = useTaxClassificationStore();

  const taxSteps = useTaxStore((s) => s.steps);
  const stepsDone = taxSteps.filter((s) => s.done).length;

  const [activeFilter, setActiveFilter] = useState<TaxFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | null>(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const [showBatchSheet, setShowBatchSheet] = useState(false);

  const filteredTransactions = useMemo(() => {
    const base = transactions.filter((t) => !t.isDuplicate);
    if (activeFilter === 'all') return base;
    if (activeFilter === 'unclassified') return base.filter((t) => !t.taxClassificationId);
    return base.filter((t) => t.taxClassificationId === activeFilter);
  }, [transactions, activeFilter]);

  const unclassifiedCount = useMemo(
    () => transactions.filter((t) => !t.isDuplicate && !t.taxClassificationId).length,
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

  const handleBatchClassify = useCallback(async (classificationId: string) => {
    if (selectedIds.size === 0) return;
    setApplying(true);
    const label = getTaxClassById(classificationId)?.name ?? classificationId;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateTransaction(id, { taxClassificationId: classificationId } as any)
        )
      );
      setSelectedIds(new Set());
      showAlert({ title: 'Done', message: `${selectedIds.size} transaction(s) classified as ${label}.` });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message });
    } finally {
      setApplying(false);
    }
  }, [selectedIds, updateTransaction, showAlert, getTaxClassById]);

  const handleClearClassification = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setApplying(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateTransaction(id, { taxClassificationId: null } as any)
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
    const unclassified = transactions.filter((t) => !t.isDuplicate && !t.taxClassificationId);
    if (unclassified.length === 0) return;
    setApplying(true);
    let count = 0;
    try {
      await Promise.all(
        unclassified.map(async (t) => {
          const def = getDefaultForCategory(t.categoryId);
          if (def?.defaultTaxClassificationId) {
            await updateTransaction(t.id, { taxClassificationId: def.defaultTaxClassificationId } as any);
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
  }, [transactions, getDefaultForCategory, updateTransaction, showAlert]);

  const handleStartReview = useCallback(() => {
    const firstIncomplete = taxSteps.findIndex((s) => !s.done);
    setActiveStep(Math.max(0, firstIncomplete) as 0 | 1 | 2 | 3);
  }, [taxSteps]);

  const handleStepComplete = useCallback(() => {
    if (activeStep === null) return;
    const next = activeStep + 1;
    if (next <= 3) {
      setActiveStep(next as 0 | 1 | 2 | 3);
    } else {
      setActiveStep(null);
    }
  }, [activeStep]);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Unknown';

  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.colorHex ?? theme.outline;

  const taxClassColor = (id: string | null | undefined) => {
    const tc = id ? getTaxClassById(id) : undefined;
    return tc?.direction === 'income' ? Colors.main.primary : Colors.main.warning;
  };

  const mappedCategories = useMemo(
    () => Array.from(new Map(categories.map((c) => [c.id, c])).values()).filter((cat) => getDefaultForCategory(cat.id)),
    [categories, categoryDefaults],
  );

  const FILTER_TABS: { key: TaxFilter; label: string; count: number }[] = useMemo(() => {
    const visible = transactions.filter((t) => !t.isDuplicate);
    const base = [
      { key: 'all' as TaxFilter, label: 'All', count: visible.length },
      { key: 'unclassified' as TaxFilter, label: 'Unclassified', count: unclassifiedCount },
    ];
    const classTabs = taxClasses.map((tc) => ({
      key: tc.id as TaxFilter,
      label: tc.name,
      count: visible.filter((t) => t.taxClassificationId === tc.id).length,
    }));
    return [...base, ...classTabs];
  }, [transactions, unclassifiedCount, taxClasses]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={22} color={theme.onBackground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Tax Prep</Text>
        </View>

        {/* Tax Review Progress */}
        <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Tax Review Progress</Text>
            <Text style={[styles.progressCount, { color: theme.outline }]}>{stepsDone}/4</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={[styles.progressFill, { width: `${(stepsDone / 4) * 100}%`, backgroundColor: Colors.main.warning }]} />
          </View>
          <View style={styles.stepsRow}>
            {['Income', 'Expenses', 'WHT', 'Summary'].map((label, i) => (
              <View key={i} style={styles.stepIndicator}>
                <View style={[styles.stepDot, taxSteps[i]?.done && { backgroundColor: Colors.main.success }]}>
                  {taxSteps[i]?.done ? (
                    <MaterialIcons name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepDotText}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: taxSteps[i]?.done ? theme.onBackground : theme.outline }]}>{label}</Text>
                {(taxSteps[i]?.flaggedCount ?? 0) > 0 && (
                  <View style={[styles.flagBadge, { backgroundColor: Colors.main.error }]}>
                    <Text style={styles.flagBadgeText}>{taxSteps[i]!.flaggedCount}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: Colors.main.primary }]}
            onPress={handleStartReview}
            activeOpacity={0.8}
          >
            <MaterialIcons name={stepsDone === 0 ? 'play-arrow' : 'arrow-forward'} size={20} color="#FFFFFF" />
            <Text style={styles.startBtnText}>
              {stepsDone === 0 ? 'Start Review' : stepsDone === 4 ? 'Review Complete' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Defaults */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.defaultsHeader} onPress={() => setShowDefaults(!showDefaults)} activeOpacity={0.7}>
            <View style={styles.defaultsHeaderLeft}>
              <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Category Defaults</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.outline }]}>
                {showDefaults ? 'Tap to collapse' : `${mappedCategories.length} categories — tap to view`}
              </Text>
            </View>
            <MaterialIcons name={showDefaults ? 'expand-less' : 'expand-more'} size={22} color={theme.outline} />
          </TouchableOpacity>

          {showDefaults && (
            <View style={styles.defaultsBody}>
              {mappedCategories.map((cat) => {
                const def = getDefaultForCategory(cat.id)!;
                return (
                  <View key={cat.id} style={[styles.defaultRow, { borderBottomColor: theme.outlineVariant }]}>
                    <View style={styles.defaultRowLeft}>
                      <View style={[styles.catDot, { backgroundColor: cat.colorHex }]} />
                      <Text style={[styles.defaultRowLabel, { color: theme.onBackground }]}>{cat.name}</Text>
                    </View>
                    <View style={styles.defaultRowRight}>
                      <View style={[styles.taxOptionChip, { backgroundColor: taxClassColor(def.defaultTaxClassificationId) + '1A', borderColor: taxClassColor(def.defaultTaxClassificationId) }]}>
                        <Text style={[styles.taxOptionChipText, { color: taxClassColor(def.defaultTaxClassificationId) }]}>
                          {getTaxClassById(def.defaultTaxClassificationId)?.name ?? def.defaultTaxClassificationId}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
                  {applying ? 'Applying...' : 'Apply Defaults'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {FILTER_TABS.map((tab) => (
              <Chip
                key={tab.key}
                label={`${tab.label} (${tab.count})`}
                selected={activeFilter === tab.key}
                onPress={() => { setActiveFilter(tab.key); setSelectedIds(new Set()); }}
              />
            ))}
          </ScrollView>

          {/* Selection Actions */}
          {selectedIds.size > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: theme.surfaceContainerLow }]}>
              <Text style={[styles.selectionCount, { color: theme.onBackground }]}>
                {selectedIds.size} selected
              </Text>
              <View style={styles.selectionActions}>
                <Button
                  title="Classify"
                  size="xs"
                  style={{ backgroundColor: Colors.main.warning }}
                  onPress={() => setShowBatchSheet(true)}
                />
                <Button
                  title="Clear"
                  size="xs"
                  variant="outline"
                  style={{ borderColor: theme.outlineVariant }}
                  textStyle={{ color: theme.outline }}
                  onPress={handleClearClassification}
                />
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
                      {tx.isDuplicate ? '[Duplicate] ' : ''}{tx.merchantName ?? 'Unknown'}
                    </Text>
                    <Text style={[styles.txMeta, { color: theme.outline }]}>
                      {getCategoryName(tx.categoryId)} • {new Date(tx.transactionDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.transactionType === 'credit' ? Colors.main.success : Colors.main.error }]}>
                      {tx.transactionType === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </Text>
                    <Chip
                      label={tx.taxClassificationId ? getTaxClassById(tx.taxClassificationId)?.name ?? tx.taxClassificationId : 'Unset'}
                      size="sm"
                      selected={!!tx.taxClassificationId}
                      color={tx.taxClassificationId ? taxClassColor(tx.taxClassificationId) : undefined}
                      onPress={undefined}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <StepIncomeReview
        visible={activeStep === 0}
        onClose={() => setActiveStep(null)}
        onComplete={handleStepComplete}
      />
      <StepExpenseReview
        visible={activeStep === 1}
        onClose={() => setActiveStep(null)}
        onComplete={handleStepComplete}
      />
      <StepWhtReview
        visible={activeStep === 2}
        onClose={() => setActiveStep(null)}
        onComplete={handleStepComplete}
      />
      <StepTaxSummary
        visible={activeStep === 3}
        onClose={() => setActiveStep(null)}
        onComplete={handleStepComplete}
      />
      <TaxClassSheet
        visible={showBatchSheet}
        onClose={() => setShowBatchSheet(false)}
        onSelect={(id) => { handleBatchClassify(id); setShowBatchSheet(false); }}
      />
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
  defaultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultsHeaderLeft: {
    flex: 1,
  },
  defaultsBody: {
    marginTop: 16,
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
  progressCard: {
    marginHorizontal: Spacing[5],
    borderRadius: Radius.md,
    padding: Spacing[4],
    gap: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCount: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.outlineVariant,
  },
  stepDotText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 10,
    color: Colors.light.outline,
  },
  stepLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 10,
  },
  flagBadge: {
    position: 'absolute',
    top: -6,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  flagBadgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 9,
    color: '#FFFFFF',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    gap: 6,
  },
  startBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
