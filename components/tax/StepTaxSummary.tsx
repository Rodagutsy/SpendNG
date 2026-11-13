import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Alert, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import { useTaxProfileStore } from '@/lib/stores/taxProfileStore';
import { computePersonalIncomeTax } from '@/lib/tax-engine';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { ExportService } from '@/lib/export-service';

interface StepTaxSummaryProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const StepTaxSummary: React.FC<StepTaxSummaryProps> = ({ visible, onClose, onComplete }) => {
  const { translateY, panResponder } = useSwipeToClose(onClose);
  const transactions = useTransactionStore((s) => s.transactions);
  const getCategoryById = useCategoryStore((s) => s.getCategoryById);
  const { classifications: taxClasses } = useTaxClassificationStore();
  const whtCredits = useTaxStore((s) => s.whtCredits);
  const taxYear = useTaxStore((s) => s.taxYear);
  const profile = useTaxProfileStore((s) => s.profile);
  const assets = useTaxProfileStore((s) => s.assets);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState(false);

  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || 'User';

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    transactions.forEach(t => {
      if (!map[t.categoryId]) {
        const cat = getCategoryById(t.categoryId);
        map[t.categoryId] = cat?.name || t.categoryId;
      }
    });
    return map;
  }, [transactions, getCategoryById]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const incomeTxs = useMemo(
    () =>
      transactions.filter(
        (t) =>
          !t.isDuplicate &&
          t.transactionType === 'credit' &&
          new Date(t.transactionDate).getFullYear() === taxYear
      ),
    [transactions, taxYear]
  );
  const expenseTxs = useMemo(
    () =>
      transactions.filter(
        (t) =>
          !t.isDuplicate &&
          t.transactionType === 'debit' &&
          new Date(t.transactionDate).getFullYear() === taxYear
      ),
    [transactions, taxYear]
  );

  const taxResult = useMemo(
    () =>
      computePersonalIncomeTax({
        transactions,
        assets,
        whtCredits,
        profile,
        config: { taxYear },
      }),
    [transactions, assets, whtCredits, profile, taxYear]
  );

  const incomeTaxClasses = useMemo(() => taxClasses.filter((tc) => tc.direction === 'income'), [taxClasses]);
  const expenseTaxClasses = useMemo(() => taxClasses.filter((tc) => tc.direction === 'expense'), [taxClasses]);

  const incomeByClass = useMemo(() => {
    return incomeTaxClasses.map((tc) => ({
      id: tc.id,
      name: tc.name,
      transactions: incomeTxs.filter((t) => t.taxClassificationId === tc.id),
    }));
  }, [incomeTaxClasses, incomeTxs]);

  const expenseByClass = useMemo(() => {
    return expenseTaxClasses.map((tc) => ({
      id: tc.id,
      name: tc.name,
      transactions: expenseTxs.filter((t) => t.taxClassificationId === tc.id),
    }));
  }, [expenseTaxClasses, expenseTxs]);

  const foreignTxns = useMemo(
    () => incomeTxs.filter((t) => t.originalCurrency && t.originalCurrency !== 'NGN'),
    [incomeTxs]
  );

  const generateAndShare = async (_title: string) => {
    setPdfLoading(true);
    try {
      const uri = await ExportService.generateTaxFilingPackPDF({
        taxYear,
        userName,
        profile,
        result: taxResult,
        transactions,
        assets,
        whtCredits,
        categoryNames,
      });
      await ExportService.shareFile(uri);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate Tax Filing Pack PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const renderCollapsibleCard = (title: string, total: number, items: { name: string; amount: number }[], sectionKey: string) => (
    <View style={[styles.card, { backgroundColor: Colors.light.surface }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => toggleSection(sectionKey)} activeOpacity={0.7}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardTotal}>₦{total.toLocaleString()}</Text>
          <MaterialIcons name={expandedSections[sectionKey] ? 'expand-less' : 'expand-more'} size={20} color={Colors.light.outline} />
        </View>
      </TouchableOpacity>
      {expandedSections[sectionKey] && (
        <View style={styles.cardBody}>
          {items.length === 0 ? (
            <Text style={styles.emptyItems}>No items</Text>
          ) : (
            items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemAmount}>₦{item.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} {...panResponder.panHandlers} />
          <View style={styles.header}>
            <Text style={styles.title}>Tax Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.light.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Primary Tax Liability Hero */}
            <View style={[styles.taxableCard, { backgroundColor: Colors.main.primary }]}>
              <View style={styles.regimeRow}>
                <Text style={styles.taxableLabel}>
                  {taxResult.taxRefundable > 0 ? 'Estimated Tax Refundable' : 'Estimated Net Tax Payable'}
                </Text>
                <View style={styles.regimeBadge}>
                  <Text style={styles.regimeBadgeText}>
                    {taxResult.regime === 'NTA_2025' ? 'NTA 2025' : 'PITA'} • {taxYear}
                  </Text>
                </View>
              </View>
              <Text style={styles.taxableValue}>
                ₦{(taxResult.taxRefundable > 0 ? taxResult.taxRefundable : taxResult.netTaxPayable).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.taxableSub}>
                Effective Rate: {(taxResult.effectiveTaxRate * 100).toFixed(2)}%
                {taxResult.minimumWageExempt ? ' • Minimum Wage Exempt' : ''}
                {taxResult.minimumTaxApplied ? ' • 1% Minimum Tax Applied' : ''}
              </Text>
              <Text style={styles.taxableDisclaimer}>
                Estimated computation for self-assessment prep and review with a tax professional — not formal tax advice.
              </Text>
            </View>

            {/* Warnings */}
            {taxResult.warnings.length > 0 && (
              <View style={[styles.warningBox, { backgroundColor: Colors.main.warning + '14' }]}>
                <Text style={styles.warningTitle}>Review Notes ({taxResult.warnings.length})</Text>
                {taxResult.warnings.map((w, idx) => (
                  <Text key={idx} style={styles.warningItem}>• {w}</Text>
                ))}
              </View>
            )}

            {/* Statutory Computation Waterfall */}
            <View style={[styles.card, { backgroundColor: Colors.light.surface }]}>
              <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Statutory Computation Waterfall</Text>
              {[
                { label: 'Gross Reportable Income', val: taxResult.grossReportableIncome },
                { label: 'Less: Allowable Business Expenses', val: -taxResult.allowableBusinessExpenses },
                { label: 'Less: Capital Allowances (Table I)', val: -taxResult.capitalAllowancesTotal },
                { label: 'Net Business Profit', val: taxResult.netBusinessProfit, bold: true },
                { label: 'Total Income (All Streams)', val: taxResult.totalIncome, bold: true },
                { label: 'Less: Eligible Reliefs & Deductions', val: -taxResult.eligibleDeductions.total },
                { label: 'Chargeable Income', val: taxResult.chargeableIncome, bold: true },
                { label: 'Gross Tax Liability', val: taxResult.grossTaxLiability },
                { label: 'Less: PAYE / WHT / Foreign Tax Credits', val: -taxResult.credits.totalCredits },
              ].map((row, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={[styles.itemName, row.bold && { fontFamily: Typography.fonts.medium, color: Colors.light.onSurface }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.itemAmount, row.bold && { color: Colors.main.primary }]}>
                    {row.val < 0 ? `-₦${Math.abs(row.val).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `₦${row.val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tax Band Breakdown */}
            {renderCollapsibleCard(
              'Tax Band Breakdown',
              taxResult.grossTaxLiability,
              taxResult.bandBreakdown.map((b) => ({
                name: `${b.label} (${(b.rate * 100).toFixed(0)}%) on ₦${b.taxableInBand.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                amount: Math.round(b.taxInBand),
              })),
              'band-breakdown'
            )}

            {/* Non-Taxable & Disallowed Summary */}
            <View style={[styles.card, { backgroundColor: Colors.light.surface }]}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Excluded Non-Taxable Inflows</Text>
                <Text style={styles.itemAmount}>₦{taxResult.excludedNonTaxableTotal.toLocaleString()}</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Disallowed Expenses (No VAT s.21(p))</Text>
                <Text style={[styles.itemAmount, taxResult.disallowedVatExpenseTotal > 0 && { color: Colors.main.error }]}>
                  ₦{taxResult.disallowedVatExpenseTotal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Credits (PAYE + WHT + Foreign)</Text>
                <Text style={styles.itemAmount}>₦{taxResult.credits.totalCredits.toLocaleString()}</Text>
              </View>
            </View>

            {incomeByClass
              .filter((g) => g.transactions.length > 0)
              .map((g) =>
                renderCollapsibleCard(
                  g.name,
                  g.transactions.reduce((s, t) => s + t.amount, 0),
                  g.transactions.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
                  `income-${g.id}`
                )
              )}

            {expenseByClass
              .filter((g) => g.transactions.length > 0)
              .map((g) =>
                renderCollapsibleCard(
                  g.name,
                  g.transactions.reduce((s, t) => s + t.amount, 0),
                  g.transactions.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
                  `expense-${g.id}`
                )
              )}

            {foreignTxns.length > 0 && (
              <View style={[styles.foreignNote, { backgroundColor: Colors.main.primary + '0D' }]}>
                <View style={styles.foreignNoteRow}>
                  <MaterialIcons name="language" size={16} color={Colors.main.primary} />
                  <Text style={styles.foreignNoteText}>
                    {foreignTxns.length} foreign income transaction(s) auto-converted to NGN
                  </Text>
                </View>
                {foreignTxns.map((ft) => (
                  <Text key={ft.id} style={styles.foreignDetailText}>
                    {ft.originalCurrency} {ft.originalAmount?.toLocaleString()} → ₦{ft.amount.toLocaleString()}
                    {ft.exchangeRate ? ` (rate: ${ft.exchangeRate})` : ''}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={() => generateAndShare('Share Tax Report')} disabled={pdfLoading}>
                <MaterialIcons name="ios-share" size={18} color={Colors.light.onPrimary} />
                <Text style={styles.shareBtnText}>{pdfLoading ? 'Generating…' : 'Share Filing Pack'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => generateAndShare('Save Tax Report')} disabled={pdfLoading}>
                <MaterialIcons name="download" size={18} color={Colors.main.primary} />
                <Text style={styles.downloadBtnText}>{pdfLoading ? 'Generating…' : 'Download PDF'}</Text>
              </TouchableOpacity>
            </View>

            {onComplete && (
              <TouchableOpacity style={styles.finishBtn} onPress={onComplete} activeOpacity={0.8}>
                <Text style={styles.finishBtnText}>Finish Review</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.outlineVariant,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: Colors.light.onSurface,
  },
  body: {
    paddingHorizontal: Spacing[5],
    maxHeight: 500,
    gap: 10,
  },
  card: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  cardTotal: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  cardBody: {
    marginTop: Spacing[2],
    gap: 6,
  },
  emptyItems: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.light.outline,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.outline,
    flex: 1,
  },
  itemAmount: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.onSurface,
  },
  foreignNote: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[2],
  },
  foreignNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  foreignNoteText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.main.primary,
  },
  foreignDetailText: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.outline,
    paddingLeft: 22,
    lineHeight: 18,
  },
  taxableCard: {
    borderRadius: Radius.sm,
    padding: Spacing[4],
    marginTop: Spacing[2],
    marginBottom: Spacing[2],
    alignItems: 'center',
  },
  taxableLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.onPrimary,
    opacity: 0.9,
  },
  taxableValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 28,
    color: Colors.light.onPrimary,
    marginVertical: Spacing[2],
  },
  taxableDisclaimer: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.onPrimary,
    opacity: 0.7,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.main.primary,
    marginTop: Spacing[2],
  },
  shareBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.light.onPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.main.primary,
  },
  downloadBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.main.primary,
  },
  finishBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: Colors.main.primary,
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  finishBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.main.primary,
  },
  regimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regimeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  regimeBadgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  taxableSub: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  warningBox: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: 8,
    gap: 4,
  },
  warningTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 13,
    color: Colors.main.warning,
  },
  warningItem: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.onSurface,
    lineHeight: 16,
  },
});
