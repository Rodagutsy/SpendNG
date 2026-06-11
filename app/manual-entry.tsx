import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const STEPS = ['Type', 'Amount', 'Category', 'Payment', 'Description', 'Save'];

const EXPENSE_CATEGORIES = [
  { id: 'food-dining', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'transport', label: 'Transport', icon: 'directions-car' },
  { id: 'airtime-data', label: 'Airtime & Data', icon: 'wifi' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-cart' },
  { id: 'utilities', label: 'Utilities', icon: 'bolt' },
  { id: 'rent', label: 'Rent', icon: 'home' },
  { id: 'business-expense', label: 'Business Expense', icon: 'business' },
  { id: 'health', label: 'Health', icon: 'local-hospital' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'other-expense', label: 'Other', icon: 'more-horiz' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: 'account-balance-wallet' },
  { id: 'business-income', label: 'Business Income', icon: 'business' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop' },
  { id: 'gifts', label: 'Gifts', icon: 'card-giftcard' },
  { id: 'other-income', label: 'Other', icon: 'more-horiz' },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'payments' },
  { id: 'bank-transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
];

export default function ManualEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [step, setStep] = useState(0);
  const [transactionType, setTransactionType] = useState<'credit' | 'debit' | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');

  const categories = transactionType === 'credit' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const canProceed = () => {
    switch (step) {
      case 0: return transactionType !== null;
      case 1: return amount.trim().length > 0 && parseFloat(amount) > 0;
      case 2: return category !== '';
      case 3: return paymentMethod !== '';
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    await addTransaction({
      amount: numericAmount,
      currency: 'NGN',
      transactionType: transactionType as 'credit' | 'debit',
      merchantName: description || null,
      categoryId: category,
      accountName: paymentMethod ? PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? null : null,
      accountNumberLast4: null,
      transactionDate: Date.now(),
      availableBalance: null,
      sourceChannel: 'manual',
      notes: description || null,
      taxClassificationId: null,
      confidenceLevel: 'high',
      originalMessage: null,
      isFlaggedForReview: false,
      receiptImageUri: null,
    });

    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
            {i < step ? (
              <MaterialIcons name="check" size={12} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepDotText, i === step && styles.stepDotTextActive]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.closeBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>New Transaction</Text>
        <View style={styles.closeBtn} />
      </View>

      {renderStepIndicator()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0: Type Selection */}
        {step === 0 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Transaction Type</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>Select the type of transaction</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeCard, transactionType === 'credit' && { backgroundColor: '#E8F8EE', borderColor: '#00BD00' }]}
                onPress={() => setTransactionType('credit')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-downward" size={32} color="#00BD00" />
                <Text style={[styles.typeLabel, { color: '#00BD00' }]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeCard, transactionType === 'debit' && { backgroundColor: '#FDECEB', borderColor: '#D30000' }]}
                onPress={() => setTransactionType('debit')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-upward" size={32} color="#D30000" />
                <Text style={[styles.typeLabel, { color: '#D30000' }]}>Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 1: Amount Entry */}
        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Amount</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>Enter the transaction amount</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, { color: theme.onBackground }]}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.onBackground }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.outlineVariant}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Category</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>
              {transactionType === 'credit' ? 'Income' : 'Expense'} categories
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={20}
                      color={active ? '#FFFFFF' : theme.primary}
                    />
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Payment Method</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>How was this transaction made?</Text>
            <View style={styles.paymentList}>
              {PAYMENT_METHODS.map((pm) => {
                const active = paymentMethod === pm.id;
                return (
                  <TouchableOpacity
                    key={pm.id}
                    style={[styles.paymentRow, active && styles.paymentRowActive]}
                    onPress={() => setPaymentMethod(pm.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.paymentIconCircle, active && styles.paymentIconCircleActive]}>
                      <MaterialIcons
                        name={pm.icon as any}
                        size={20}
                        color={active ? '#FFFFFF' : theme.primary}
                      />
                    </View>
                    <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>{pm.label}</Text>
                    {active && <MaterialIcons name="check-circle" size={22} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 4: Description */}
        {step === 4 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Description</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>Add a short note (optional)</Text>
            <View style={[styles.descCard, { backgroundColor: theme.surfaceContainerLow }]}>
              <TextInput
                style={[styles.descInput, { color: theme.onSurface }]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Uber to Island"
                placeholderTextColor={theme.outline}
                multiline
                autoFocus
              />
            </View>
            <View style={styles.descHintRow}>
              <MaterialIcons name="lightbulb-outline" size={14} color={theme.outline} />
              <Text style={[styles.descHint, { color: theme.outline }]}>
                Examples: "Shoprite groceries", "Client payment for design work"
              </Text>
            </View>
          </View>
        )}

        {/* Step 5: Save */}
        {step === 5 && (
          <View style={styles.stepBody}>
            <Text style={[styles.stepHeading, { color: theme.onBackground }]}>Review & Save</Text>
            <Text style={[styles.stepSubtext, { color: theme.outline }]}>Confirm transaction details</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type</Text>
                <Text style={[styles.reviewValue, { color: transactionType === 'credit' ? '#00BD00' : '#D30000' }]}>
                  {transactionType === 'credit' ? 'Income' : 'Expense'}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Amount</Text>
                <Text style={styles.reviewValueBold}>₦{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Category</Text>
                <Text style={styles.reviewValue}>
                  {categories.find(c => c.id === category)?.label ?? category}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Payment</Text>
                <Text style={styles.reviewValue}>
                  {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? paymentMethod}
                </Text>
              </View>
              {description ? (
                <>
                  <View style={styles.reviewDivider} />
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Note</Text>
                    <Text style={[styles.reviewValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {description}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
        {step === STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Save Transaction</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, !canProceed() && { backgroundColor: theme.outlineVariant, opacity: 0.6 }]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={!canProceed()}
          >
            <Text style={[styles.primaryBtnText, !canProceed() && { color: theme.outline }]}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color={!canProceed() ? theme.outline : '#FFFFFF'} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing[3],
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0B5CFF',
  },
  stepDotDone: {
    backgroundColor: '#00BD00',
  },
  stepDotText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    color: '#7B786F',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 10,
    color: '#7B786F',
    textAlign: 'center',
  },
  stepLabelActive: {
    fontFamily: Typography.fonts.medium,
    color: '#0B5CFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[10],
  },
  stepBody: {
    paddingTop: Spacing[4],
  },
  stepHeading: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    marginBottom: 4,
  },
  stepSubtext: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    marginBottom: Spacing[6],
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    height: 140,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: '#F1F2F6',
    backgroundColor: '#F9FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  typeLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing[8],
  },
  currencySymbol: {
    fontSize: 40,
    fontFamily: Typography.fonts.display,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: Typography.fonts.display,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: '#F1F2F6',
  },
  categoryChipActive: {
    backgroundColor: '#0B5CFF',
  },
  categoryChipText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#001133',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  paymentList: {
    gap: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: '#F9FAFC',
    gap: 12,
  },
  paymentRowActive: {
    backgroundColor: '#EBF2FC',
    borderWidth: 1,
    borderColor: '#0B5CFF',
  },
  paymentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconCircleActive: {
    backgroundColor: '#0B5CFF',
  },
  paymentLabel: {
    flex: 1,
    fontFamily: Typography.fonts.medium,
    fontSize: 16,
    color: '#001133',
  },
  paymentLabelActive: {
    fontFamily: Typography.fonts.display,
  },
  descCard: {
    borderRadius: Radius.md,
    padding: Spacing[4],
    minHeight: 100,
  },
  descInput: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  descHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing[3],
  },
  descHint: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  reviewCard: {
    borderRadius: Radius.md,
    backgroundColor: '#F9FAFC',
    padding: Spacing[4],
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reviewLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#7B786F',
  },
  reviewValue: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: '#001133',
  },
  reviewValueBold: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: '#001133',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  bottomBar: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    paddingBottom: Platform.OS === 'ios' ? Spacing[8] : Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.md,
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
