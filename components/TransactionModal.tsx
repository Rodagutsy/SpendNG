import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
  Alert,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import * as Crypto from 'expo-crypto';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useCategoryDefaultStore } from '@/lib/stores/categoryDefaultStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { TaxClassSheet } from '@/components/tax/TaxClassSheet';
import { OptionPickerModal } from '@/components/ui/OptionPickerModal';
import { TextInput } from '@/components/ui/TextInput';
import { AmountInput } from '@/components/ui/AmountInput';
import { DropdownField } from '@/components/ui/DropdownField';
import { TextArea } from '@/components/ui/TextArea';
import { ReceiptPicker } from '@/components/ui/ReceiptPicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { CalendarModal } from '@/components/CalendarModal';
import { recognizeText, extractTransactionInfo } from '@/lib/ocr';
import { uploadReceipt } from '@/lib/receipt-upload';
import { getNairaRate, CURRENCY_SYMBOLS } from '@/lib/exchange-rate';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank-transfer', label: 'Bank Transfer' },
  { id: 'card', label: 'Card' },
  { id: 'wallet', label: 'Wallet' },
];

const CONFIDENCE_OPTIONS = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
] as const;

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: TransactionRecord;
  initialReceiptUri?: string;
  receiptDraft?: {
    merchant: string | null;
    amount: number | null;
    currency: string | null;
    transaction_date: string | null;
    tax_amount: number | null;
    receiptPath: string;
  } | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ visible, onClose, transaction, initialReceiptUri, receiptDraft }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { height: windowHeight } = useWindowDimensions();
  const { translateY, panResponder } = useSwipeToClose(onClose);
  const step2MaxHeight = windowHeight * 0.9 - 180;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);
  const styles = useMemo(() => createStyles(theme, step2MaxHeight), [theme, step2MaxHeight]);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const { categories: allCategories, getCategoryById } = useCategoryStore();
  const getDefaultForCategory = useCategoryDefaultStore((s) => s.getDefaultForCategory);
  const getTaxClassById = useTaxClassificationStore((s) => s.getById);
  const isEditing = !!transaction;

  const [step, setStep] = useState(1);
  const [type, setType] = useState<'credit' | 'debit' | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dateText, setDateText] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low' | null>(null);
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [whtEnabled, setWhtEnabled] = useState(false);
  const [whtAmountText, setWhtAmountText] = useState('');
  const [whtClientName, setWhtClientName] = useState('');
  const [taxClassId, setTaxClassId] = useState<string | null>(null);
  const [showTaxClassSheet, setShowTaxClassSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('NGN');
  const [nairaEquivalent, setNairaEquivalent] = useState<string | null>(null);
  const CURRENCY_ORDER = ['NGN', 'USD', 'GBP', 'EUR'];
  const amountInputRef = useRef<RNTextInput>(null);
  const notesInputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (transaction && visible) {
      setStep(2);
      setType(transaction.transactionType);
      setName(transaction.merchantName ?? '');
      setAmount(String(Math.abs(transaction.amount)));
      const d = new Date(transaction.transactionDate);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      setDateText(`${dd}/${mm}/${yyyy}`);
      setCategory(transaction.categoryId);
      const pm = PAYMENT_METHODS.find(p => p.label === transaction.accountName);
      setPaymentMethod(pm?.id ?? '');
      setNotes(transaction.notes ?? '');
      setConfidenceLevel(transaction.confidenceLevel);
      setReceiptUri(transaction.receiptImageUri);
      setTaxClassId(transaction.taxClassificationId);
      setWhtEnabled(transaction.whtAmount != null);
      setWhtAmountText(transaction.whtAmount ? String(transaction.whtAmount) : '');
      setWhtClientName(transaction.whtClientName ?? '');
      setCurrency(transaction.currency ?? 'NGN');
    } else if (receiptDraft && visible) {
      setStep(2);
      setType('debit');
      setName(receiptDraft.merchant ?? '');
      setAmount(receiptDraft.amount ? String(receiptDraft.amount) : '');
      if (receiptDraft.transaction_date) {
        const parts = receiptDraft.transaction_date.split('-');
        if (parts.length === 3) {
          setDateText(`${parts[2]}/${parts[1]}/${parts[0]}`);
        }
      }
      if (receiptDraft.currency) setCurrency(receiptDraft.currency);
    } else if (initialReceiptUri && visible && !transaction) {
      setReceiptUri(initialReceiptUri);
    }
  }, [transaction, visible, initialReceiptUri, receiptDraft]);

  useEffect(() => {
    if (!isEditing && category) {
      const def = getDefaultForCategory(category);
      if (def?.defaultTaxClassificationId) {
        setTaxClassId(def.defaultTaxClassificationId);
      }
    }
  }, [category, isEditing]);

  useEffect(() => {
    if (currency === 'NGN' || !amount || parseFloat(amount) <= 0) {
      setNairaEquivalent(null);
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;
    let cancelled = false;
    getNairaRate(currency, new Date()).then((result) => {
      if (cancelled) return;
      if (result.rate > 0) {
        const converted = numericAmount * result.rate;
        setNairaEquivalent(`≈ ₦${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ ${result.rate.toFixed(2)}`);
      } else {
        setNairaEquivalent('(rate unavailable)');
      }
    });
    return () => { cancelled = true; };
  }, [currency, amount]);

  const prevModalsRef = useRef({ showCalendar, showCategoryPicker, showPaymentPicker, showTaxClassSheet });
  useEffect(() => {
    const prev = prevModalsRef.current;
    const closed = (
      (prev.showCalendar && !showCalendar) ||
      (prev.showCategoryPicker && !showCategoryPicker) ||
      (prev.showPaymentPicker && !showPaymentPicker) ||
      (prev.showTaxClassSheet && !showTaxClassSheet)
    );
    prevModalsRef.current = { showCalendar, showCategoryPicker, showPaymentPicker, showTaxClassSheet };
    if (closed) {
      amountInputRef.current?.blur();
      notesInputRef.current?.blur();
    }
  }, [showCalendar, showCategoryPicker, showPaymentPicker, showTaxClassSheet]);

  const cycleCurrency = () => {
    const idx = CURRENCY_ORDER.indexOf(currency);
    setCurrency(CURRENCY_ORDER[(idx + 1) % CURRENCY_ORDER.length]);
  };

  const categories = useMemo(() => {
    const typeHint = type === 'credit' ? 'credit' : 'debit';
    return allCategories
      .filter((c) => c.transactionTypeHint === typeHint || c.transactionTypeHint === 'both')
      .map((c) => ({ id: c.id, label: c.name }));
  }, [allCategories, type]);

  const reset = () => {
    setStep(1);
    setType(null);
    setName('');
    setAmount('');
    setDateText('');
    setCategory('');
    setPaymentMethod('');
    setDescription('');
    setConfidenceLevel(null);
    setNotes('');
    setReceiptUri(null);
    setWhtEnabled(false);
    setWhtAmountText('');
    setWhtClientName('');
    setTaxClassId(null);
    setCurrency('NGN');
    setNairaEquivalent(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runOCR = async (uri: string) => {
    try {
      const recognizedText = await recognizeText(uri);
      if (!recognizedText.trim()) return;

      const info = extractTransactionInfo(recognizedText);
      if (info.amount !== null && !amount) setAmount(info.amount.toFixed(2));
      if (info.transactionType !== null && !type) setType(info.transactionType);
      if (info.merchant !== null && !name) setName(info.merchant);
      if (info.date !== null && !dateText) setDateText(info.date);
    } catch {
      // OCR failed silently — user can still enter data manually
    }
  };

  const pickReceiptImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      runOCR(result.assets[0].uri);
    }
  };

  const handleDateSelect = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    setDateText(`${dd}/${mm}/${yyyy}`);
  };

  const handleSave = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setSaving(true);
    try {
      let parsedDate = Date.now();
      if (dateText.trim()) {
        const parts = dateText.trim().split('/');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (!isNaN(d.getTime())) parsedDate = d.getTime();
        }
      }

      let amountInNaira: number | null = null;
      let exchangeRateResult: { rate: number; source: string; date: string } | null = null;
      if (currency !== 'NGN') {
        exchangeRateResult = await getNairaRate(currency, new Date(parsedDate));
        if (exchangeRateResult.rate > 0) {
          amountInNaira = numericAmount * exchangeRateResult.rate;
        }
      }

      const whtVal = whtEnabled && whtAmountText ? parseFloat(whtAmountText) : null;

      if (isEditing && transaction) {
        const updateData: any = {
          amount: currency === 'NGN' ? numericAmount : (amountInNaira ?? numericAmount),
          currency,
          transactionType: type as 'credit' | 'debit',
          merchantName: name || null,
          categoryId: category,
          accountName: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? null,
          transactionDate: parsedDate,
          notes: notes || description || null,
          confidenceLevel,
          receiptImageUri: receiptUri,
          whtAmount: whtVal,
          whtClientName: whtEnabled ? (whtClientName || null) : null,
          taxClassificationId: taxClassId,
        };
        if (currency !== 'NGN') {
          updateData.originalCurrency = currency;
          updateData.originalAmount = numericAmount;
          updateData.exchangeRate = exchangeRateResult?.rate ?? null;
          updateData.amountInNaira = amountInNaira;
          updateData.rateSource = exchangeRateResult?.source ?? null;
          updateData.rateDate = exchangeRateResult ? new Date(exchangeRateResult.date).getTime() : null;
        }
        await updateTransaction(transaction.id, updateData);
      } else {
        const dateMinute = Math.floor(parsedDate / 60000);
        const hashInput = [(name || '').trim().toLowerCase(), numericAmount.toFixed(2), dateMinute, currency].join('|');
        const contentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashInput);

        try {
          await addTransaction({
            amount: currency === 'NGN' ? numericAmount : (amountInNaira ?? numericAmount),
            currency,
            transactionType: type as 'credit' | 'debit',
            merchantName: name || null,
            categoryId: category,
            accountName: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? null,
            accountNumberLast4: null,
            transactionDate: parsedDate,
            availableBalance: null,
            sourceChannel: 'manual',
            notes: notes || description || null,
            taxClassificationId: taxClassId,
            confidenceLevel,
            originalMessage: null,
            isFlaggedForReview: false,
            receiptImageUri: receiptUri,
            receiptPath: receiptDraft?.receiptPath ?? null,
            whtAmount: null,
            whtClientName: null,
            contentHash,
            originalCurrency: currency === 'NGN' ? null : currency,
            originalAmount: currency === 'NGN' ? null : numericAmount,
            exchangeRate: exchangeRateResult?.rate ?? null,
            amountInNaira,
            rateSource: exchangeRateResult?.source ?? null,
            rateDate: exchangeRateResult ? new Date(exchangeRateResult.date).getTime() : null,
          });

          handleClose();
        } catch (err: any) {
          console.error('[TransactionModal] addTransaction failed:', err);
          Alert.alert('Error', err.message || 'Failed to save transaction');
        }
      }

      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const formValid = type !== null && amount.trim().length > 0 && parseFloat(amount) > 0 && category !== '' && paymentMethod !== '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={() => {
          Animated.timing(translateY, {
            toValue: 2000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => handleClose());
        }} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Handle */}
          <View style={styles.handleRow} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.onBackground }]}>
              {isEditing ? 'Edit Transaction' : step === 1 ? 'New Transaction' : 'Transaction Details'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={22} color={theme.outline} />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            <View style={styles.step1Body}>
              <Text style={styles.step1Subtitle}>What type of transaction?</Text>

              {/* Type cards */}
              <View style={styles.typeCardRow}>
                <TouchableOpacity
                  style={[styles.typeCard, type === 'credit' && { borderColor: Colors.main.success, backgroundColor: Colors.main.success + '0D' }]}
                  onPress={() => { setType('credit'); setStep(2); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.typeCardIconWrap, { backgroundColor: Colors.light.success + '1A' }]}>
                    <MaterialIcons name="arrow-downward" size={24} color={Colors.main.success} />
                  </View>
                  <Text style={[styles.typeCardLabel, type === 'credit' && { color: Colors.main.success }]}>Income</Text>
                  <Text style={styles.typeCardDesc}>Salary, freelance, gifts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeCard, type === 'debit' && { borderColor: Colors.main.error, backgroundColor: Colors.main.error + '0A' }]}
                  onPress={() => { setType('debit'); setStep(2); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.typeCardIconWrap, { backgroundColor: Colors.light.error + '14' }]}>
                    <MaterialIcons name="arrow-upward" size={24} color={Colors.main.error} />
                  </View>
                  <Text style={[styles.typeCardLabel, type === 'debit' && { color: Colors.main.error }]}>Expense</Text>
                  <Text style={styles.typeCardDesc}>Shopping, bills, transport</Text>
                </TouchableOpacity>
              </View>


            </View>
          ) : (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
              {/* Sender/Receiver Name */}
              <TextInput
                label={type === 'credit' ? 'Sender Name' : 'Receiver Name'}
                value={name}
                onChangeText={setName}
                placeholder={type === 'credit' ? 'e.g. TechCorp Ltd' : 'e.g. Shoprite'}
                containerStyle={{ marginBottom: 0 }}
              />

              {/* Amount */}
              <View>
                <Text style={[styles.amountLabel, { color: theme.onBackground }]}>Amount</Text>
                <View style={[styles.currencyInputRow, { borderColor: theme.outlineVariant }]}>
                  <TouchableOpacity onPress={cycleCurrency} activeOpacity={0.7} style={styles.currencyToggle}>
                    <Text style={[styles.currencySymbolText, { color: theme.primary }]}>
                      {CURRENCY_SYMBOLS[currency] || currency}
                    </Text>
                    <MaterialIcons name="unfold-more" size={14} color={theme.primary} />
                  </TouchableOpacity>
                  <RNTextInput
                    ref={amountInputRef}
                    style={[styles.currencyAmountInput, { color: theme.onSurface, outlineStyle: 'none' } as any]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={theme.outline}
                    keyboardType="decimal-pad"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {currency === 'NGN' ? (
                  <Text style={[styles.rateHint, { color: theme.outline }]}>
                    Change currency by tapping the symbol.
                  </Text>
                ) : nairaEquivalent ? (
                  <Text style={[styles.rateHint, { color: theme.outline }]}>{nairaEquivalent}</Text>
                ) : amount && parseFloat(amount) > 0 ? (
                  <Text style={[styles.rateHint, { color: theme.outline }]}>Fetching exchange rate...</Text>
                ) : null}
              </View>

              {/* Date */}
              <View>
                <Text style={[styles.amountLabel, { color: theme.onBackground }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.textInputWrap, { borderColor: theme.outlineVariant }]}
                  onPress={() => setShowCalendar(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="calendar-today" size={18} color={theme.outlineVariant} />
                  <Text style={[!dateText ? { color: theme.outline } : { color: theme.onBackground }, styles.dateFieldText]}>
                    {dateText || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category */}
              <DropdownField
                label="Category"
                value={category ? categories.find(c => c.id === category)?.label ?? '' : ''}
                placeholder="Select category"
                onPress={() => setShowCategoryPicker(true)}
              />

              {/* Payment Method */}
              <DropdownField
                label="Payment Method"
                value={paymentMethod ? PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? '' : ''}
                placeholder="Select payment method"
                onPress={() => setShowPaymentPicker(true)}
              />

              {/* WHT — income only */}
              {type === 'credit' && (
                <View style={styles.whtSection}>
                  <TouchableOpacity style={styles.whtToggleRow} onPress={() => setWhtEnabled(!whtEnabled)} activeOpacity={0.7}>
                    <MaterialIcons name="receipt-long" size={18} color={theme.outlineVariant} />
                    <Text style={styles.whtToggleLabel}>Was tax withheld by client?</Text>
                    <View style={[styles.checkbox, whtEnabled && styles.checkboxOn]}>
                      {whtEnabled && <MaterialIcons name="check" size={14} color={Colors.light.surface} />}
                    </View>
                  </TouchableOpacity>
                  {whtEnabled && (
                    <View style={styles.whtFields}>
                      <AmountInput label="WHT Amount" value={whtAmountText} onChangeText={setWhtAmountText} placeholder="0.00" />
                      <TextInput
                        label="Client Name (optional)"
                        value={whtClientName}
                        onChangeText={setWhtClientName}
                        placeholder="e.g. Payoneer, Upwork"
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Notes */}
              <TextArea
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this transaction..."
              />

              {/* Receipt Image */}
              <ReceiptPicker label="Receipt" value={receiptUri} onPick={pickReceiptImage} />

              {/* Tax Classification — auto-filled, scroll to see */}
              <DropdownField
                label="Tax Classification"
                value={taxClassId ? getTaxClassById(taxClassId)?.name ?? '' : ''}
                placeholder="Auto from category"
                onPress={() => setShowTaxClassSheet(true)}
              />
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setStep(1)} activeOpacity={0.8}>
              <Text style={[styles.cancelBtnText, { color: theme.outline }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.primaryBtn, (!formValid || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!formValid || saving}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <OptionPickerModal
          visible={showCategoryPicker}
          title="Select Category"
          options={categories}
          selected={category}
          onSelect={(id) => setCategory(id)}
          onClose={() => setShowCategoryPicker(false)}
        />

        <OptionPickerModal
          visible={showPaymentPicker}
          title="Select Payment Method"
          options={PAYMENT_METHODS}
          selected={paymentMethod}
          onSelect={(id) => setPaymentMethod(id)}
          onClose={() => setShowPaymentPicker(false)}
        />

        {/* Tax Classification Sheet */}
        <TaxClassSheet
          visible={showTaxClassSheet}
          onClose={() => setShowTaxClassSheet(false)}
          onSelect={(id) => { setTaxClassId(id); setShowTaxClassSheet(false); }}
          current={taxClassId}
          direction={type === 'credit' ? 'income' : 'expense'}
        />

        {/* Calendar */}
        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          onSelectDate={handleDateSelect}
          initialDate={dateText ? (() => { const p = dateText.split('/'); return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])); })() : undefined}
        />
      </View>
    </Modal>
  );
};

type Theme = (typeof Colors)['light'];

const createStyles = (theme: Theme, step2MaxHeight: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Step 1
  step1Body: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    alignItems: 'center',
  },
  step1Subtitle: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
    color: theme.outline,
    marginBottom: Spacing[5],
    marginTop: Spacing[2],
  },
  typeCardRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  typeCard: {
    flex: 1,
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: theme.outlineVariant,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
    gap: 8,
  },
  typeCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    color: theme.onSurface,
  },
  typeCardDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: theme.outline,
    textAlign: 'center',
  },
  // Step 2
  body: {
    maxHeight: step2MaxHeight,
  },
  bodyContent: {
    paddingHorizontal: Spacing[5],
    gap: 16,
    paddingBottom: 4,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 4,
    backgroundColor: theme.surface,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
  },
  currencySymbolText: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
  },
  currencyAmountInput: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 16,
  },
  rateHint: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    marginTop: Spacing[1]
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: theme.surface,
  },
  dateFieldText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: theme.onSurface,
  },
  amountLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[1],
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.ripple,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: theme.surfaceContainerLow,
  },
  cancelBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: theme.onPrimary,
  },
  whtSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.ripple,
  },
  whtToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whtToggleLabel: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: theme.onSurface,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  whtFields: {
    marginTop: 12,
    gap: 10,
  },
});
