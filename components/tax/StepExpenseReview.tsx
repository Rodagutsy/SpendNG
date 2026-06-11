import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { useTaxStore } from '@/lib/stores/taxStore';
import { TaxClassSheet } from './TaxClassSheet';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface StepExpenseReviewProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const StepExpenseReview: React.FC<StepExpenseReviewProps> = ({ visible, onClose, onComplete }) => {
  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const getCategoryById = useCategoryStore((s) => s.getCategoryById);
  const { getById: getTaxClassById } = useTaxClassificationStore();
  const setStepFlagged = useTaxStore((s) => s.setStepFlagged);
  const setStepDone = useTaxStore((s) => s.setStepDone);

  const [editTx, setEditTx] = useState<{ id: string; current: string | null } | null>(null);
  const [assetInfo, setAssetInfo] = useState<Record<string, { name: string; value: string }>>({});
  const [showAssetField, setShowAssetField] = useState(false);

  const expenseTxs = useMemo(() => {
    return transactions.filter((t) => t.transactionType === 'debit');
  }, [transactions]);

  const needsAttention = useMemo(() => {
    return expenseTxs.filter((t) => !t.taxClassificationId);
  }, [expenseTxs]);

  const classified = useMemo(() => {
    return expenseTxs.filter((t) => t.taxClassificationId);
  }, [expenseTxs]);

  const flaggedCount = needsAttention.length;

  const handleReassign = async (classificationId: string) => {
    if (!editTx) return;
    await updateTransaction(editTx.id, { taxClassificationId: classificationId } as any);
    if (classificationId === 'business-asset') {
      setShowAssetField(true);
      setAssetInfo((prev) => ({ ...prev, [editTx.id]: prev[editTx.id] ?? { name: '', value: '' } }));
    } else {
      setShowAssetField(false);
    }
    setEditTx(null);
  };

  const handleComplete = () => {
    setStepFlagged(1, flaggedCount);
    setStepDone(1, true);
    onComplete();
  };

  const renderItem = (tx: TransactionRecord) => {
    const cat = getCategoryById(tx.categoryId);
    const catName = cat?.name ?? 'Unknown';
    const isAsset = tx.taxClassificationId === 'business-asset';
    const taxName = tx.taxClassificationId ? getTaxClassById(tx.taxClassificationId)?.name : null;
    return (
      <View key={tx.id}>
        <View style={styles.txRow}>
          <View style={styles.txLeft}>
            <Text style={styles.txMerchant} numberOfLines={1}>{tx.merchantName ?? 'Unknown'}</Text>
            <View style={styles.txMetaRow}>
              <Text style={styles.txCategory}>{catName}</Text>
              <Text style={styles.txDate}>{new Date(tx.transactionDate).toLocaleDateString()}</Text>
              {taxName && (
                <View style={[styles.taxBadge, { backgroundColor: Colors.main.warning + '1A' }]}>
                  <Text style={styles.taxBadgeText}>
                    {isAsset ? 'Ast' : taxName.slice(0, 3)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.txRight}>
            <Text style={styles.txAmount}>₦{tx.amount.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => setEditTx({ id: tx.id, current: tx.taxClassificationId })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="edit" size={16} color={Colors.light.outline} />
            </TouchableOpacity>
          </View>
        </View>
        {isAsset && assetInfo[tx.id] && (
          <View style={styles.assetFields}>
            <TextInput
              style={styles.assetInput}
              placeholder="Asset name (e.g. Laptop)"
              placeholderTextColor={Colors.light.outline}
              value={assetInfo[tx.id]?.name ?? ''}
              onChangeText={(v) => setAssetInfo((prev) => ({ ...prev, [tx.id]: { ...prev[tx.id], name: v } }))}
            />
            <TextInput
              style={styles.assetInput}
              placeholder="Approximate value (₦)"
              placeholderTextColor={Colors.light.outline}
              keyboardType="numeric"
              value={assetInfo[tx.id]?.value ?? ''}
              onChangeText={(v) => setAssetInfo((prev) => ({ ...prev, [tx.id]: { ...prev[tx.id], value: v } }))}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Review Expenses</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.light.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {flaggedCount > 0 && (
              <View style={[styles.attentionSection, { backgroundColor: Colors.main.warning + '14' }]}>
                <Text style={styles.attentionTitle}>Needs your attention</Text>
                <Text style={styles.attentionDesc}>
                  {flaggedCount} expense(s) without classification.
                </Text>
                {needsAttention.map(renderItem)}
              </View>
            )}

            <Text style={styles.sectionLabel}>Classified Expenses ({classified.length})</Text>
            {classified.length === 0 ? (
              <Text style={styles.emptyText}>No classified expenses yet.</Text>
            ) : (
              classified.map(renderItem)
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleComplete} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Looks good, next</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.light.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TaxClassSheet
        visible={!!editTx}
        onClose={() => setEditTx(null)}
        onSelect={handleReassign}
        current={editTx?.current ?? null}
        direction="expense"
      />
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
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    maxHeight: 400,
  },
  attentionSection: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  attentionTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.main.warning,
    marginBottom: 4,
  },
  attentionDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.light.outline,
    marginBottom: Spacing[2],
  },
  sectionLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.light.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
  },
  emptyText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.outline,
    textAlign: 'center',
    paddingVertical: Spacing[6],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.outlineVariant,
    gap: 8,
  },
  txLeft: {
    flex: 1,
    gap: 2,
  },
  txMerchant: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCategory: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.outline,
  },
  txDate: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.outline,
  },
  taxBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  taxBadgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 9,
    color: Colors.main.warning,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.main.error,
  },
  assetFields: {
    paddingLeft: Spacing[6],
    paddingBottom: Spacing[2],
    gap: 6,
  },
  assetInput: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.onSurface,
    backgroundColor: Colors.light.surface,
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
