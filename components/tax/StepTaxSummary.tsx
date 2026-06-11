import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Share } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface StepTaxSummaryProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const StepTaxSummary: React.FC<StepTaxSummaryProps> = ({ visible, onClose, onComplete }) => {
  const transactions = useTransactionStore((s) => s.transactions);
  const getCategoryById = useCategoryStore((s) => s.getCategoryById);
  const whtCredits = useTaxStore((s) => s.whtCredits);
  const setStepDone = useTaxStore((s) => s.setStepDone);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const incomeTxs = useMemo(() => transactions.filter((t) => t.transactionType === 'credit'), [transactions]);
  const expenseTxs = useMemo(() => transactions.filter((t) => t.transactionType === 'debit'), [transactions]);

  const businessIncome = useMemo(() => {
    return incomeTxs.filter((t) => t.taxClassification === 'business');
  }, [incomeTxs]);

  const personalIncome = useMemo(() => {
    return incomeTxs.filter((t) => t.taxClassification === 'personal');
  }, [incomeTxs]);

  const sharedIncome = useMemo(() => {
    return incomeTxs.filter((t) => t.taxClassification === 'shared');
  }, [incomeTxs]);

  const businessExpenses = useMemo(() => {
    return expenseTxs.filter((t) => t.taxClassification === 'business');
  }, [expenseTxs]);

  const personalExpenses = useMemo(() => {
    return expenseTxs.filter((t) => t.taxClassification === 'personal');
  }, [expenseTxs]);

  const totalBusinessIncome = businessIncome.reduce((s, t) => s + t.amount, 0);
  const totalPersonalIncome = personalIncome.reduce((s, t) => s + t.amount, 0);
  const totalSharedIncome = sharedIncome.reduce((s, t) => s + t.amount, 0);
  const totalIncome = totalBusinessIncome + totalPersonalIncome + totalSharedIncome;

  const totalDeductibleExpenses = businessExpenses.reduce((s, t) => s + t.amount, 0);
  const totalPersonalExpenses = personalExpenses.reduce((s, t) => s + t.amount, 0);

  const totalWht = whtCredits.reduce((s, c) => s + c.whtAmount, 0);
  const estimatedTaxableIncome = totalIncome - totalDeductibleExpenses;

  const handleShare = async () => {
    const lines = [
      'Tax Summary Report',
      `Year: ${new Date().getFullYear()}`,
      '',
      `Employment/Personal Income: ₦${totalPersonalIncome.toLocaleString()}`,
      `Business/Freelance Income: ₦${totalBusinessIncome.toLocaleString()}`,
      `Shared/Mixed Income: ₦${totalSharedIncome.toLocaleString()}`,
      `Total Income: ₦${totalIncome.toLocaleString()}`,
      '',
      `Deductible Expenses: ₦${totalDeductibleExpenses.toLocaleString()}`,
      `Personal Expenses: ₦${totalPersonalExpenses.toLocaleString()}`,
      '',
      `WHT Credits: ₦${totalWht.toLocaleString()}`,
      '',
      `Estimated Taxable Income: ₦${estimatedTaxableIncome.toLocaleString()}`,
      '',
      'This is a summary for your accountant, not a tax calculation.',
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {}
  };

  const handleComplete = () => {
    setStepDone(3, true);
    onComplete();
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
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Tax Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.light.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {renderCollapsibleCard(
              'Employment / Personal Income',
              totalPersonalIncome,
              personalIncome.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
              'personalIncome'
            )}
            {renderCollapsibleCard(
              'Business / Freelance Income',
              totalBusinessIncome,
              businessIncome.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
              'businessIncome'
            )}
            {renderCollapsibleCard(
              'Shared / Mixed Income',
              totalSharedIncome,
              sharedIncome.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
              'sharedIncome'
            )}

            {renderCollapsibleCard(
              'Deductible Expenses',
              totalDeductibleExpenses,
              businessExpenses.map((t) => ({ name: t.merchantName ?? 'Unknown', amount: t.amount })),
              'expenses'
            )}

            <View style={[styles.card, { backgroundColor: Colors.light.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>WHT Credits</Text>
                <Text style={styles.cardTotal}>₦{totalWht.toLocaleString()}</Text>
              </View>
            </View>

            <View style={[styles.taxableCard, { backgroundColor: Colors.main.primary }]}>
              <Text style={styles.taxableLabel}>Estimated Taxable Income</Text>
              <Text style={styles.taxableValue}>₦{estimatedTaxableIncome.toLocaleString()}</Text>
              <Text style={styles.taxableDisclaimer}>
                Total income minus deductible expenses. This is a summary for your accountant, not a tax calculation.
              </Text>
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <MaterialIcons name="ios-share" size={18} color={Colors.light.onPrimary} />
              <Text style={styles.shareBtnText}>Share Summary</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleComplete} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  footer: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.main.primary,
    gap: 6,
  },
  nextBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: Colors.light.onPrimary,
  },
});
