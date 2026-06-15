import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useCategoryDefaultStore } from '@/lib/stores/categoryDefaultStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import { TaxClassSheet } from '@/components/tax/TaxClassSheet';
import { TransactionReviewSheet } from '@/components/tax/TransactionReviewSheet';
import { TransactionFilterSheet, TransactionFilters } from '@/components/tax/TransactionFilterSheet';
import { StepIncomeReview } from '@/components/tax/StepIncomeReview';
import { StepExpenseReview } from '@/components/tax/StepExpenseReview';
import { StepWhtReview } from '@/components/tax/StepWhtReview';
import { StepTaxSummary } from '@/components/tax/StepTaxSummary';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TaxPrepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();

  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const categories = useCategoryStore((s) => s.categories);
  const getDefaultForCategory = useCategoryDefaultStore((s) => s.getDefaultForCategory);
  const categoryDefaults = useCategoryDefaultStore((s) => s.defaults);
  const { classifications: taxClasses, getById: getTaxClassById } = useTaxClassificationStore();

  const taxSteps = useTaxStore((s) => s.steps);
  const stepsDone = taxSteps.filter((s) => s.done).length;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | null>(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const [showBatchSheet, setShowBatchSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({ status: 'all', taxClassId: null, dateRange: null });
  const [reviewTx, setReviewTx] = useState<TransactionRecord | null>(null);

  const filteredTransactions = useMemo(() => {
    let base = transactions.filter((t) => !t.isDuplicate);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((t) =>
        t.merchantName?.toLowerCase().includes(q) ||
        t.originalMessage?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    if (filters.status === 'high') base = base.filter((t) => t.confidenceLevel === 'high');
    else if (filters.status === 'medium') base = base.filter((t) => t.confidenceLevel === 'medium');
    else if (filters.status === 'low') base = base.filter((t) => t.confidenceLevel === 'low' || !t.confidenceLevel);
    else if (filters.status === 'needs_review') base = base.filter((t) => !t.taxClassificationId);

    if (filters.taxClassId) {
      base = base.filter((t) => t.taxClassificationId === filters.taxClassId);
    }

    if (filters.dateRange === 'this_week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      base = base.filter((t) => t.transactionDate >= weekAgo);
    } else if (filters.dateRange === 'this_month') {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      base = base.filter((t) => t.transactionDate >= monthAgo);
    }

    return base.sort((a, b) => b.transactionDate - a.transactionDate);
  }, [transactions, searchQuery, filters]);

  const unclassifiedCount = useMemo(
    () => transactions.filter((t) => !t.isDuplicate && !t.taxClassificationId).length,
    [transactions]
  );

  const summary = useMemo(() => {
    const all = transactions.filter((t) => !t.isDuplicate);
    const needsReview = all.filter((t) => !t.taxClassificationId);
    const highConfidence = all.filter((t) => t.confidenceLevel === 'high');
    return {
      total: all.length,
      needsReview: needsReview.length,
      highConfidence: highConfidence.length,
    };
  }, [transactions]);

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

  const taxClassColor = (id: string | null | undefined) => {
    if (!id) return theme.outline;
    const tc = getTaxClassById(id);
    if (!tc) return theme.outline;
    if (id === 'non-taxable-receipt') return theme.outline;
    return tc.direction === 'income' ? theme.primary : Colors.main.warning;
  };

  const mappedCategories = useMemo(
    () => Array.from(new Map(categories.map((c) => [c.id, c])).values()).filter((cat) => getDefaultForCategory(cat.id)),
    [categories, categoryDefaults],
  );

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
          {/* Section Header */}
          <View style={styles.txSectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Transactions</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowSearch(!showSearch)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name={showSearch ? 'close' : 'search'} size={22} color={theme.onBackground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilterSheet(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="filter-list" size={22} color={theme.onBackground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <View style={[styles.searchBar, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
              <MaterialIcons name="search" size={18} color={theme.outline} />
              <TextInput
                style={[styles.searchInput, { color: theme.onSurface }]}
                placeholder="Search transactions..."
                placeholderTextColor={theme.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={theme.outline} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Summary Strip */}
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.onSurface }]}>{summary.total}</Text>
                <Text style={[styles.summaryLabel, { color: theme.outline }]}>Total</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.outlineVariant }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.main.warning }]}>{summary.needsReview}</Text>
                <Text style={[styles.summaryLabel, { color: theme.outline }]}>Needs review</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.outlineVariant }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.main.success }]}>{summary.highConfidence}</Text>
                <Text style={[styles.summaryLabel, { color: theme.outline }]}>High confidence</Text>
              </View>
            </View>
          </View>

          {/* Apply Defaults — shown when there are unclassified transactions */}
          {unclassifiedCount > 0 && (
            <TouchableOpacity style={[styles.applyDefaultsBtn, { backgroundColor: Colors.main.primary + '0D', borderColor: Colors.main.primary + '33' }]} onPress={handleApplyCategoryDefaults} disabled={applying} activeOpacity={0.7}>
              <MaterialIcons name="auto-awesome" size={16} color={Colors.main.primary} />
              <Text style={[styles.applyDefaultsText, { color: Colors.main.primary }]}>
                {applying ? 'Applying...' : `Auto-classify ${unclassifiedCount} unclassified`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Bulk Action Bar (selection mode) */}
          {selectionMode && selectedIds.size > 0 && (
            <View style={[styles.selectionBar, { backgroundColor: theme.surfaceContainerLow }]}>
              <TouchableOpacity onPress={() => { setSelectedIds(new Set()); setSelectionMode(false); }}>
                <MaterialIcons name="close" size={20} color={theme.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.selectionCount, { color: theme.onSurface }]}>
                {selectedIds.size} selected
              </Text>
              <View style={styles.selectionActions}>
                <TouchableOpacity style={[styles.bulkActionBtn, { backgroundColor: Colors.main.warning + '1A' }]} onPress={() => setShowBatchSheet(true)}>
                  <Text style={[styles.bulkActionText, { color: Colors.main.warning }]}>Classify</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bulkActionBtn, { backgroundColor: Colors.main.success + '1A' }]} onPress={async () => {
                  setApplying(true);
                  try {
                    await Promise.all(Array.from(selectedIds).map((id) => updateTransaction(id, { isFlaggedForReview: false } as any)));
                    setSelectedIds(new Set()); setSelectionMode(false);
                    showAlert({ title: 'Done', message: `${selectedIds.size} transaction(s) confirmed.` });
                  } catch (err: any) { showAlert({ title: 'Error', message: err.message }); }
                  finally { setApplying(false); }
                }} disabled={applying}>
                  <Text style={[styles.bulkActionText, { color: Colors.main.success }]}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bulkActionBtn, { backgroundColor: theme.outlineVariant }]} onPress={() => { setSelectedIds(new Set()); setSelectionMode(false); }}>
                  <Text style={[styles.bulkActionText, { color: theme.outline }]}>Cancel</Text>
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
              const confidence = tx.confidenceLevel || 'low';
              const confidenceColor = confidence === 'high' ? Colors.main.success : confidence === 'medium' ? Colors.main.warning : Colors.main.error;
              const catName = getCategoryName(tx.categoryId);

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.txRowNew,
                    { backgroundColor: theme.surface },
                    selectionMode && isSelected && { backgroundColor: Colors.main.primary + '0D', borderColor: Colors.main.primary, borderWidth: 1 },
                  ]}
                  onPress={() => {
                    if (selectionMode) {
                      toggleSelect(tx.id);
                    } else {
                      setReviewTx(tx);
                    }
                  }}
                  onLongPress={() => {
                    if (!selectionMode) {
                      setSelectionMode(true);
                      setSelectedIds(new Set([tx.id]));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {selectionMode && (
                    <View style={[styles.checkboxSmall, { borderColor: isSelected ? Colors.main.primary : theme.outlineVariant, backgroundColor: isSelected ? Colors.main.primary : 'transparent' }]}>
                      {isSelected && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
                    </View>
                  )}
                  <View style={styles.txRowNewContent}>
                    <View style={styles.txRowNewLeft}>
                      <Text style={[styles.txRowNewMerchant, { color: theme.onSurface }]} numberOfLines={1}>
                        {tx.isDuplicate ? '[Duplicate] ' : ''}{tx.merchantName ?? 'Unknown'}
                      </Text>
                      <View style={styles.txRowNewMeta}>
                        <View style={[styles.categoryChip, { backgroundColor: catName === 'Unknown' ? theme.outlineVariant : Colors.main.primary + '0D' }]}>
                          <Text style={[styles.categoryChipText, { color: catName === 'Unknown' ? theme.outline : Colors.main.primary }]}>{catName}</Text>
                        </View>
                        <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                        <Text style={[styles.confidenceLabel, { color: theme.outline }]}>
                          {confidence === 'high' ? 'High confidence' : confidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.txRowNewRight}>
                      <Text style={[styles.txRowNewAmount, { color: tx.transactionType === 'credit' ? Colors.main.success : Colors.main.error }]}>
                        {tx.transactionType === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </Text>
                    </View>
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
      <TransactionReviewSheet
        visible={!!reviewTx}
        onClose={() => setReviewTx(null)}
        transaction={reviewTx}
        onUpdate={updateTransaction}
      />
      <TransactionFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        current={filters}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    padding: 0,
  },
  summaryCard: {
    borderRadius: Radius.sm,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
  },
  summaryLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
  },
  summaryDivider: {
    width: 1,
    height: 28,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    gap: 8,
  },
  selectionCount: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    flex: 1,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 6,
  },
  bulkActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  bulkActionText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
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
  applyDefaultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  applyDefaultsText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },
  txRowNew: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  checkboxSmall: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  txRowNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing[3],
    gap: 8,
  },
  txRowNewLeft: {
    flex: 1,
    gap: 4,
  },
  txRowNewMerchant: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
  },
  txRowNewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChip: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  categoryChipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
  },
  txRowNewRight: {
    alignItems: 'flex-end',
  },
  txRowNewAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
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
