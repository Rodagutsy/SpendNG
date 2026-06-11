import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { FormField } from '@/components/ui/FormField';
import { AmountInput } from '@/components/ui/AmountInput';
import { DropdownField } from '@/components/ui/DropdownField';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { CalendarModal } from '@/components/CalendarModal';

const EXPENSE_CATEGORIES = [
  { id: 'food-dining', label: 'Food & Dining' },
  { id: 'transport', label: 'Transport' },
  { id: 'airtime-data', label: 'Airtime & Data' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'rent', label: 'Rent' },
  { id: 'business-expense', label: 'Business' },
  { id: 'health', label: 'Health' },
  { id: 'education', label: 'Education' },
  { id: 'other-expense', label: 'Other' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary' },
  { id: 'business-income', label: 'Business Income' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'other-income', label: 'Other' },
];

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
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ visible, onClose, transaction }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { height: windowHeight } = useWindowDimensions();
  const step2MaxHeight = windowHeight * 0.9 - 180;
  const styles = useMemo(() => createStyles(theme, step2MaxHeight), [theme, step2MaxHeight]);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
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
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

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
    }
  }, [transaction, visible]);

  const categories = type === 'credit' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
    setReceiptUploading(false);
    setReceiptUri(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUploadReceipt = async () => {
    setReceiptUploading(true);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      setType('debit');
      setStep(2);
    }
    setReceiptUploading(false);
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

    let parsedDate = Date.now();
    if (dateText.trim()) {
      const parts = dateText.trim().split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(d.getTime())) parsedDate = d.getTime();
      }
    }

    if (isEditing && transaction) {
      await updateTransaction(transaction.id, {
        amount: numericAmount,
        transactionType: type as 'credit' | 'debit',
        merchantName: name || null,
        categoryId: category,
        accountName: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? null,
        transactionDate: parsedDate,
        notes: notes || description || null,
        confidenceLevel,
        receiptImageUri: receiptUri,
      });
    } else {
      await addTransaction({
        amount: numericAmount,
        currency: 'NGN',
        transactionType: type as 'credit' | 'debit',
        merchantName: name || null,
        categoryId: category,
        accountName: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? null,
        accountNumberLast4: null,
        transactionDate: parsedDate,
        availableBalance: null,
        sourceChannel: 'manual',
        notes: notes || description || null,
        taxClassification: null,
        confidenceLevel,
        originalMessage: null,
        isFlaggedForReview: false,
        receiptImageUri: receiptUri,
      });
    }

    handleClose();
  };

  const formValid = type !== null && amount.trim().length > 0 && parseFloat(amount) > 0 && category !== '' && paymentMethod !== '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
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
                  onPress={() => setType('credit')}
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
                  onPress={() => setType('debit')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.typeCardIconWrap, { backgroundColor: Colors.light.error + '14' }]}>
                    <MaterialIcons name="arrow-upward" size={24} color={Colors.main.error} />
                  </View>
                  <Text style={[styles.typeCardLabel, type === 'debit' && { color: Colors.main.error }]}>Expense</Text>
                  <Text style={styles.typeCardDesc}>Shopping, bills, transport</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.step1Divider}>
                <View style={styles.step1DividerLine} />
                <Text style={styles.step1DividerText}>OR</Text>
                <View style={styles.step1DividerLine} />
              </View>

              {/* Upload receipt */}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleUploadReceipt}
                activeOpacity={0.7}
                disabled={receiptUploading}
              >
                <MaterialIcons name="photo-camera" size={20} color={theme.primary} />
                <Text style={styles.uploadBtnText}>
                  {receiptUploading ? 'Parsing receipt...' : 'Upload Receipt'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.uploadHint}>We&apos;ll extract the details automatically</Text>
            </View>
          ) : (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
              {/* Sender/Receiver Name */}
              <FormField label={type === 'credit' ? 'Sender Name' : 'Receiver Name'}>
                <View style={[styles.textInputWrap, nameFocused && styles.textInputWrapFocused]}>
                  <MaterialIcons name="person-outline" size={18} color={nameFocused ? theme.primary : theme.outlineVariant} />
                  <TextInput
                    style={[styles.textInputInner, { outlineStyle: 'none' } as any]}
                    value={name}
                    onChangeText={setName}
                    placeholder={type === 'credit' ? 'e.g. TechCorp Ltd' : 'e.g. Shoprite'}
                    placeholderTextColor={theme.outline}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </FormField>

              {/* Amount */}
              <FormField label="Amount">
                <AmountInput value={amount} onChangeText={setAmount} placeholder="0.00" />
              </FormField>

              {/* Date */}
              <FormField label="Date">
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
              </FormField>

              {/* Category */}
              <FormField label="Category">
                <DropdownField
                  value={category ? categories.find(c => c.id === category)?.label ?? '' : ''}
                  placeholder="Select category"
                  onPress={() => setShowCategoryPicker(true)}
                />
              </FormField>

              {/* Payment Method */}
              <FormField label="Payment Method">
                <DropdownField
                  value={paymentMethod ? PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? '' : ''}
                  placeholder="Select payment method"
                  onPress={() => setShowPaymentPicker(true)}
                />
              </FormField>

              {/* Notes */}
              <FormField label="Notes (optional)">
                <View style={[styles.textInputWrap, styles.notesWrap, notesFocused && styles.textInputWrapFocused]}>
                  <TextInput
                    style={[styles.textInputInner, styles.notesInput, { outlineStyle: 'none' } as any]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes about this transaction..."
                    placeholderTextColor={theme.outline}
                    multiline
                    textAlignVertical="top"
                    onFocus={() => setNotesFocused(true)}
                    onBlur={() => setNotesFocused(false)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </FormField>

              {/* Receipt Image */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptLabel}>Receipt</Text>
                {receiptUri ? (
                  <View style={styles.receiptPreviewWrap}>
                    <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                    <TouchableOpacity style={styles.receiptReplaceBtn} onPress={pickReceiptImage} activeOpacity={0.8}>
                      <MaterialIcons name="camera-alt" size={16} color={theme.onPrimary} />
                      <Text style={styles.receiptReplaceText}>Replace</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addReceiptBtn} onPress={pickReceiptImage} activeOpacity={0.8}>
                    <MaterialIcons name="add-a-photo" size={20} color={theme.primary} />
                    <Text style={styles.addReceiptText}>Add Receipt Image</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {step === 1 ? (
              <>
                <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={[styles.cancelBtnText, { color: theme.outline }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerBtn, styles.primaryBtn, !type && { opacity: 0.5 }]}
                  onPress={() => { if (type) setStep(2); }}
                  activeOpacity={0.8}
                  disabled={!type}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={theme.onPrimary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setStep(1)} activeOpacity={0.8}>
                  <Text style={[styles.cancelBtnText, { color: theme.outline }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerBtn, styles.primaryBtn, !formValid && { opacity: 0.5 }]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                  disabled={!formValid}
                >
                  <Text style={styles.primaryBtnText}>Save</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Category Picker */}
        {showCategoryPicker && (
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
            <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
              <Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Select Category</Text>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerOption, category === cat.id && { backgroundColor: theme.primaryContainer }]}
                  onPress={() => { setCategory(cat.id); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, { color: theme.onSurface }, category === cat.id && { fontFamily: Typography.fonts.display }]}>
                    {cat.label}
                  </Text>
                  {category === cat.id && <MaterialIcons name="check" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Payment Picker */}
        {showPaymentPicker && (
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPaymentPicker(false)}>
            <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
              <Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Select Payment Method</Text>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  style={[styles.pickerOption, paymentMethod === pm.id && { backgroundColor: theme.primaryContainer }]}
                  onPress={() => { setPaymentMethod(pm.id); setShowPaymentPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, { color: theme.onSurface }, paymentMethod === pm.id && { fontFamily: Typography.fonts.display }]}>
                    {pm.label}
                  </Text>
                  {paymentMethod === pm.id && <MaterialIcons name="check" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

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
  step1Divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: Spacing[5],
    gap: 12,
  },
  step1DividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.outlineVariant,
  },
  step1DividerText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
    color: theme.outline,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing[6],
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    backgroundColor: theme.primary + '0A',
  },
  uploadBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: theme.primary,
  },
  uploadHint: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: theme.outline,
    marginTop: 8,
  },
  // Step 2
  body: {
    maxHeight: step2MaxHeight,
  },
  bodyContent: {
    paddingHorizontal: Spacing[5],
    gap: 12,
    paddingBottom: 4,
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
  textInputWrapFocused: {
    borderColor: theme.primary,
  },
  textInputInner: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    padding: 0,
    height: '100%',
    color: theme.onSurface,
  },
  dateFieldText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: theme.onSurface,
  },
  notesWrap: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  notesInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  pickerModal: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: theme.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  pickerTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.ripple,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing[4],
  },
  pickerOptionText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
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
  receiptSection: {
    marginTop: 8,
  },
  receiptLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: theme.onSurface,
    marginBottom: 6,
  },
  receiptPreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  receiptReplaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  receiptReplaceText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
    color: theme.onPrimary,
  },
  addReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    backgroundColor: theme.primary + '0A',
  },
  addReceiptText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: theme.primary,
  },
});
