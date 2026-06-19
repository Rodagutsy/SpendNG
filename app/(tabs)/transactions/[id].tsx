import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { TransactionModal } from '@/components/TransactionModal';
import { TaxClassSheet } from '@/components/tax/TaxClassSheet';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getReceiptUrl } from '@/lib/receipt-upload';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { transactions, updateTransaction } = useTransactionStore();
  const { categories, getCategoryById } = useCategoryStore();
  const { getById: getTaxClassById } = useTaxClassificationStore();

  const transaction = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);
  const category = useMemo(
    () => (transaction ? getCategoryById(transaction.categoryId) : undefined),
    [transaction, categories],
  );

  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (transaction?.receiptPath) {
      getReceiptUrl(transaction.receiptPath).then(setReceiptSignedUrl);
    } else {
      setReceiptSignedUrl(null);
    }
  }, [transaction?.receiptPath]);

  const { showAlert } = useAlert();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaxSheet, setShowTaxSheet] = useState(false);


  const storeLoading = useTransactionStore((s) => s.loading);

  if (!transaction) {
    if (storeLoading) {
      return (
        <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.onBackground }]}>Transaction not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: theme.primary }]}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDebit = transaction.transactionType === 'debit';
  const formattedNumber = Math.abs(transaction.amount).toLocaleString('en-US');
  const amountColor = isDebit ? Colors.main.error : Colors.main.success;
  const heroBg = isDebit ? Colors.main.error.slice(0, 7) + '14' : Colors.main.success.slice(0, 7) + '1A';
  const pillBg = isDebit ? Colors.main.error : Colors.main.success;
  const formattedDate = format(new Date(transaction.transactionDate), 'EEEE, d MMMM yyyy');
  const bankName = transaction.accountName;
  const accountNumber = transaction.accountNumberLast4 ? `••${transaction.accountNumberLast4}` : null;
  const sourceLabel = transaction.sourceChannel === 'sms' ? 'SMS' : transaction.sourceChannel === 'email' ? 'Email' : 'Manual';

  const taxKey = transaction.taxClassificationId;
  const taxClassObj = taxKey ? getTaxClassById(taxKey) : undefined;
  const taxLabel = taxClassObj?.name ?? 'Unclassified';

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handlePickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateTransaction(id, { receiptImageUri: result.assets[0].uri });
    }
  };

  const handleMarkDuplicate = () => {
    showAlert({
      title: 'Mark as Duplicate',
      message: 'What would you like to do?',
      buttons: [
        {
          text: 'Override',
          onPress: () => {
            const fiveMinutes = 5 * 60 * 1000;
            const candidates = transactions.filter(
              (t) =>
                t.id !== id &&
                t.amount === transaction.amount &&
                Math.abs(t.transactionDate - transaction.transactionDate) <= fiveMinutes,
            );
            const target = candidates.reduce((best, t) =>
              Math.abs(t.transactionDate - transaction.transactionDate) <
                Math.abs(best.transactionDate - transaction.transactionDate)
                ? t
                : best,
              candidates[0],
            );
            if (target) {
              updateTransaction(target.id, { isDuplicate: true });
            }
            router.back();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            updateTransaction(id, { isDuplicate: true });
            router.back();
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as any)} style={styles.headerBtn}>
            <Text style={[styles.backArrow, { color: theme.onBackground }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Transaction Details</Text>
          <View style={styles.headerBtn} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Duplicate banner */}
        {transaction.isDuplicate && (
          <View style={[styles.warningBanner, { backgroundColor: Colors.main.error.slice(0, 7) + '14', borderColor: Colors.main.error }]}>
            <MaterialIcons name="info" size={18} color={Colors.main.error} />
            <Text style={[styles.warningBannerText, { color: Colors.main.error }]}>Marked as duplicate</Text>
          </View>
        )}
        {/* Warning banner for unclassified */}
        {!transaction.taxClassificationId && (
          <TouchableOpacity style={styles.warningBanner} onPress={() => setShowTaxSheet(true)} activeOpacity={0.8}>
            <MaterialIcons name="warning" size={18} color={Colors.main.warning} />
            <Text style={styles.warningBannerText}>Tax class not set — tap to assign</Text>
          </TouchableOpacity>
        )}

        {/* Hero */}
        <View style={[styles.heroSection, { backgroundColor: heroBg }]}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.merchantName, { color: theme.onBackground }]}>
              {transaction.merchantName ?? 'Unknown'}
            </Text>
            <View style={[styles.typePill, { borderColor: isDebit ? Colors.main.error : Colors.main.success, borderWidth: 1 }]}>
              <Text style={[styles.typePillText, { color: isDebit ? Colors.main.error : Colors.main.success }]}>
                {isDebit ? 'Debit' : 'Credit'}
              </Text>
            </View>
          </View>
          <Text style={[styles.amountValue, { color: amountColor }]}>
            <Text style={styles.amountCurrency}>₦</Text>{formattedNumber}
          </Text>
          <Text style={[styles.dateText, { color: theme.outline }]}>{formattedDate}</Text>
        </View>

        {/* Core Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.outline }]}>Core Info</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
              <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Category</Text>
              <View style={styles.infoRight}>
                <View style={[styles.categoryDot, { backgroundColor: category?.colorHex ?? theme.outline }]} />
                <View style={[styles.pill, { backgroundColor: theme.primary + '14' }]}>
                  <Text style={[styles.pillText, { color: theme.primary }]}>
                    {category?.name ?? 'Uncategorized'}
                  </Text>
                </View>
              </View>
            </View>

            {bankName && (
              <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Bank</Text>
                <Text style={[styles.infoValue, { color: theme.onBackground }]}>{bankName}</Text>
              </View>
            )}
            {accountNumber && (
              <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Account</Text>
                <Text style={[styles.infoValue, { color: theme.onBackground }]}>{accountNumber}</Text>
              </View>
            )}

            <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
              <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Source</Text>
              <Text style={[styles.infoValue, { color: theme.outline }]}>{sourceLabel}</Text>
            </View>

          </View>
        </View>

        {/* WHT Breakdown — income with WHT */}
        {!isDebit && transaction.whtAmount != null && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.outline }]}>WHT Breakdown</Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Gross Amount</Text>
                <Text style={[styles.infoValue, { color: theme.onBackground }]}>₦{Math.abs(transaction.amount).toLocaleString('en-US')}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowBorder, { borderBottomColor: theme.outlineVariant }]}>
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>WHT Deducted</Text>
                <Text style={[styles.infoValue, { color: Colors.main.error }]}>-₦{transaction.whtAmount.toLocaleString('en-US')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { fontFamily: Typography.fonts.medium, color: theme.onBackground }]}>Net Received</Text>
                <Text style={[styles.infoValue, { fontFamily: Typography.fonts.display, color: Colors.main.success, fontSize: Typography.sizes.titleM }]}>
                  ₦{(Math.abs(transaction.amount) - transaction.whtAmount).toLocaleString('en-US')}
                </Text>
              </View>
              {transaction.whtClientName && (
                <View style={[styles.infoRow, { borderTopWidth: 0.5, borderTopColor: theme.outlineVariant }]}>
                  <Text style={[styles.infoLabel, { color: theme.outline, fontSize: Typography.sizes.labelM }]}>Client</Text>
                  <Text style={[styles.infoValue, { color: theme.outline, fontSize: Typography.sizes.labelM }]}>{transaction.whtClientName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.outline }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={[styles.notesDisplay]}>
              <Text style={[styles.notesDisplayText, { color: theme.onBackground }]}>
                {transaction.notes || transaction.originalMessage || 'No notes added.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Receipt */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.outline }]}>Receipt</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {(receiptSignedUrl || transaction.receiptImageUri) ? (
              <View style={styles.receiptDetailWrap}>
                <Image source={{ uri: receiptSignedUrl ?? transaction.receiptImageUri! }} style={[styles.receiptDetailImage, { borderWidth: 1, borderColor: theme.outlineVariant }]} resizeMode="cover" />
                <TouchableOpacity style={styles.receiptDetailBtn} onPress={handlePickReceipt} activeOpacity={0.8}>
                  <MaterialIcons name="camera-alt" size={16} color={theme.primary} />
                  <Text style={[styles.receiptDetailBtnText, { color: theme.primary }]}>Replace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addReceiptDetailBtn} onPress={handlePickReceipt} activeOpacity={0.7}>
                <MaterialIcons name="add-a-photo" size={20} color={theme.outline} />
                <Text style={styles.addReceiptDetailText}>No Receipt yet, Tap Edit to attach</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tax Classification */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.outline }]}>Tax Classification</Text>
          <TouchableOpacity style={[styles.card, styles.taxSectionCard, { backgroundColor: theme.surface }]} onPress={() => setShowTaxSheet(true)} activeOpacity={0.7}>
            <View style={[styles.taxSectionLeft]}>
              <MaterialIcons name="receipt" size={20} color={taxKey ? Colors.light.secondary : Colors.main.warning} />
              <View>
                <Text style={[styles.taxSectionLabel, { color: theme.onBackground }]}>Tax Classification</Text>
                <Text style={[styles.taxSectionDesc, { color: theme.outline }]}>
                  {taxClassObj?.name ?? 'Not set'}
                </Text>
              </View>
            </View>
            <View style={[styles.pill, {
              backgroundColor: taxKey ? Colors.light.secondaryContainer : Colors.main.warning + '20'
            }]}>
              <Text style={[styles.pillText, {
                color: taxKey ? Colors.light.secondary : Colors.main.warning
              }]}>{taxLabel}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { borderColor: theme.outlineVariant }]}
              onPress={handleMarkDuplicate}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: theme.onBackground }]}>Mark Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TransactionModal visible={showEditModal} onClose={() => setShowEditModal(false)} transaction={transaction} />

      <TaxClassSheet
        visible={showTaxSheet}
        onClose={() => setShowTaxSheet(false)}
        onSelect={(cls) => updateTransaction(id, { taxClassificationId: cls })}
        current={transaction.taxClassificationId}
        direction={isDebit ? 'expense' : 'income'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  errorText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    marginBottom: Spacing[6],
  },
  backBtn: {
    borderWidth: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[6],
    borderRadius: Radius.md,
  },
  backBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
    fontWeight: '600',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    height: 56,
    paddingTop: Spacing[4],
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  headerTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
  },
  scrollContent: {
    paddingBottom: Spacing[8],
  },
  heroSection: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    borderRadius: 12,
    padding: Spacing[8],
    gap: 4,
    alignItems: 'center',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  merchantName: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineS,
    lineHeight: Typography.sizes.headlineS * 1.2,
  },
  typePill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typePillText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.labelS,
    lineHeight: Typography.sizes.labelS * 1.3,
    textAlign: 'center',
  },
  amountValue: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.displayS,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  amountCurrency: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.displayS,
  },
  dateText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    marginHorizontal: Spacing[4],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    minHeight: 50,
  },
  infoRowBorder: {
    borderBottomWidth: 0.5,
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  infoLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  infoValue: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '500',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  pillText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
  notesDisplay: {
    padding: Spacing[4],
    minHeight: 48,
    justifyContent: 'center',
  },
  notesDisplayText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonL,
  },
  primaryActionBtn: {},
  secondaryBtn: {
    borderWidth: 1.5,
  },
  receiptDetailWrap: {
    padding: Spacing[4],
    gap: 12,
    alignItems: 'center',
  },
  receiptDetailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  receiptDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptDetailBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  addReceiptDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    borderColor: Colors.light.outline,
    opacity: 0.6,
  },
  addReceiptDetailText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: Colors.light.outline,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    paddingVertical: 10,
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.main.warning.slice(0, 7) + '18',
    borderRadius: Radius.sm,
  },
  warningBannerText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    color: Colors.main.warning,
    textAlign: 'center',
  },
  taxSectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    minHeight: 56,
  },
  taxSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taxSectionLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyM,
  },
  taxSectionDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: 1,
  },
});
