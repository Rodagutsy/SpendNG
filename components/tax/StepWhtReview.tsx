import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { useTaxStore, WhtCredit } from '@/lib/stores/taxStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Crypto from 'expo-crypto';

interface StepWhtReviewProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const StepWhtReview: React.FC<StepWhtReviewProps> = ({ visible, onClose, onComplete }) => {
  const { translateY, panResponder } = useSwipeToClose(onClose);
  const whtCredits = useTaxStore((s) => s.whtCredits);
  const taxYear = useTaxStore((s) => s.taxYear);
  const addWhtCredit = useTaxStore((s) => s.addWhtCredit);
  const removeWhtCredit = useTaxStore((s) => s.removeWhtCredit);
  const setStepDone = useTaxStore((s) => s.setStepDone);
  const setStepFlagged = useTaxStore((s) => s.setStepFlagged);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showForm, setShowForm] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [clientName, setClientName] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [whtAmount, setWhtAmount] = useState('');
  const [whtDate, setWhtDate] = useState('');
  const [payerTin, setPayerTin] = useState('');
  const [creditNoteRef, setCreditNoteRef] = useState('');

  const yearWhtCredits = useMemo(
    () =>
      whtCredits.filter(
        (c) => (c.taxYear ?? new Date(c.transactionDate).getFullYear()) === taxYear
      ),
    [whtCredits, taxYear]
  );

  const whtFromTransactions = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          !t.isDuplicate &&
          t.transactionType === 'credit' &&
          new Date(t.transactionDate).getFullYear() === taxYear &&
          ((t.whtAmount ?? 0) > 0 ||
            (t.foreignTaxWithheld ?? 0) > 0 ||
            t.taxClassificationId === 'wht-credit')
      )
      .map((t) => {
        const deducted = (t.whtAmount ?? 0) + (t.foreignTaxWithheld ?? 0);
        return {
          id: `auto-${t.id}`,
          clientName: t.merchantName ?? 'Unknown',
          grossAmount: t.amount + deducted,
          whtAmount: deducted,
          netAmount: t.amount,
          transactionDate: t.transactionDate,
          transactionId: t.id,
          isForeign: (t.foreignTaxWithheld ?? 0) > 0 && (t.whtAmount ?? 0) === 0,
        };
      });
  }, [transactions, taxYear]);

  const totalWht =
    yearWhtCredits.reduce((sum, c) => sum + c.whtAmount, 0) +
    whtFromTransactions.reduce((sum, c) => sum + c.whtAmount, 0);

  const handleAddCredit = () => {
    const gross = parseFloat(grossAmount);
    const wht = parseFloat(whtAmount);
    if (!clientName.trim() || isNaN(gross) || isNaN(wht)) return;

    const parsedDate = whtDate ? new Date(whtDate).getTime() : Date.now();
    const newCredit: WhtCredit = {
      id: Crypto.randomUUID(),
      taxYear,
      clientName: clientName.trim(),
      payerTin: payerTin.trim() || null,
      creditNoteRef: creditNoteRef.trim() || null,
      grossAmount: gross,
      whtAmount: wht,
      netAmount: gross - wht,
      transactionDate: isNaN(parsedDate) ? Date.now() : parsedDate,
      transactionId: null,
    };
    addWhtCredit(newCredit);
    setClientName('');
    setGrossAmount('');
    setWhtAmount('');
    setWhtDate('');
    setPayerTin('');
    setCreditNoteRef('');
    setShowForm(false);
  };

  const handleComplete = () => {
    setStepFlagged(2, 0);
    setStepDone(2, true);
    onComplete();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} {...panResponder.panHandlers} />
          <View style={styles.header}>
            <Text style={styles.title}>WHT & Tax Credits</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.light.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.whatIsThis} onPress={() => setShowExplanation(!showExplanation)} activeOpacity={0.7}>
              <MaterialIcons name="help-outline" size={16} color={Colors.main.primary} />
              <Text style={styles.whatIsThisText}>What is WHT?</Text>
            </TouchableOpacity>

            {showExplanation && (
              <View style={[styles.explanationBox, { backgroundColor: Colors.light.primaryContainer }]}>
                <Text style={styles.explanationText}>
                  When some clients pay you, they deduct a small amount (usually 5–10%) as tax before sending the rest. This section captures that so you get credit for it when you file.
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>WHT from transactions</Text>
            {whtFromTransactions.length === 0 ? (
              <Text style={styles.emptyText}>No transaction-based WHT records for {taxYear}.</Text>
            ) : (
              whtFromTransactions.map((item) => (
                <View key={item.id} style={styles.whtRow}>
                  <View style={styles.whtLeft}>
                    <Text style={styles.whtClient} numberOfLines={1}>{item.clientName}</Text>
                    <Text style={styles.whtDate}>
                      {new Date(item.transactionDate).toLocaleDateString()} • {item.isForeign ? 'Foreign Tax' : 'WHT'}: ₦{item.whtAmount.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.whtGross}>₦{item.grossAmount.toLocaleString()}</Text>
                </View>
              ))
            )}

            {!showForm ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.7}>
                <MaterialIcons name="add" size={18} color={Colors.main.primary} />
                <Text style={styles.addBtnText}>Add WHT credit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Client name"
                  placeholderTextColor={Colors.light.outline}
                  value={clientName}
                  onChangeText={setClientName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Invoice amount (₦)"
                  placeholderTextColor={Colors.light.outline}
                  keyboardType="numeric"
                  value={grossAmount}
                  onChangeText={setGrossAmount}
                />
                <TextInput
                  style={styles.input}
                  placeholder="WHT deducted (₦)"
                  placeholderTextColor={Colors.light.outline}
                  keyboardType="numeric"
                  value={whtAmount}
                  onChangeText={setWhtAmount}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={Colors.light.outline}
                  value={whtDate}
                  onChangeText={setWhtDate}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Payer TIN (optional)"
                  placeholderTextColor={Colors.light.outline}
                  value={payerTin}
                  onChangeText={setPayerTin}
                />
                <TextInput
                  style={styles.input}
                  placeholder="WHT Credit Note Ref (optional)"
                  placeholderTextColor={Colors.light.outline}
                  value={creditNoteRef}
                  onChangeText={setCreditNoteRef}
                />
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelFormBtn} onPress={() => setShowForm(false)} activeOpacity={0.8}>
                    <Text style={styles.cancelFormText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddCredit} activeOpacity={0.8}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {yearWhtCredits.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: Spacing[3] }]}>Manual WHT Credits</Text>
                {yearWhtCredits.map((c) => (
                  <View key={c.id} style={styles.whtRow}>
                    <View style={styles.whtLeft}>
                      <Text style={styles.whtClient} numberOfLines={1}>{c.clientName}</Text>
                      <Text style={styles.whtDate}>
                        Gross: ₦{c.grossAmount.toLocaleString()} | WHT: ₦{c.whtAmount.toLocaleString()}
                        {c.creditNoteRef ? ` | Ref: ${c.creditNoteRef}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeWhtCredit(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="delete-outline" size={18} color={Colors.main.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total WHT credits</Text>
              <Text style={styles.totalValue}>₦{totalWht.toLocaleString()}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleComplete} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Looks good, next</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.light.onPrimary} />
            </TouchableOpacity>
          </View>
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
  whatIsThis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[3],
  },
  whatIsThisText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.main.primary,
  },
  explanationBox: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  explanationText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.onPrimaryContainer,
    lineHeight: 18,
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
    paddingVertical: Spacing[4],
  },
  whtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.outlineVariant,
  },
  whtLeft: {
    flex: 1,
    gap: 2,
  },
  whtClient: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  whtDate: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    color: Colors.light.outline,
  },
  whtGross: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.main.primary,
    borderStyle: 'dashed',
    marginTop: Spacing[2],
  },
  addBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.main.primary,
  },
  form: {
    gap: 8,
    marginTop: Spacing[3],
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.onSurface,
    backgroundColor: Colors.light.surface,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing[1],
  },
  cancelFormBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  cancelFormText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: Colors.light.outline,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.main.primary,
  },
  saveBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 13,
    color: Colors.light.onPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    marginTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
  },
  totalLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: Colors.light.onSurface,
  },
  totalValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: Colors.main.success,
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
