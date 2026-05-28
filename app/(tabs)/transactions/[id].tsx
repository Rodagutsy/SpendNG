import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { transactions, loading, fetchTransactions, updateNotes } = useTransactionStore();
  const { categories, fetchCategories, getCategoryById } = useCategoryStore();

  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const transaction = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);
  const category = useMemo(
    () => (transaction ? getCategoryById(transaction.categoryId) : undefined),
    [transaction, categories],
  );

  useEffect(() => {
    if (!transaction) {
      fetchTransactions();
    }
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [id]);

  useEffect(() => {
    if (transaction?.notes) {
      setNotesText(transaction.notes);
    }
  }, [transaction?.notes]);

  if (loading && !transaction) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <IconSymbol name="info.circle.fill" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.onBackground }]}>Transaction not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: theme.primary }]}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDebit = transaction.transactionType === 'debit';
  const formattedAmount = `${isDebit ? '-' : '+'}${formatCurrency(transaction.amount)}`;
  const amountColor = isDebit ? theme.error : theme.success;
  const formattedDate = format(new Date(transaction.transactionDate), 'EEEE, d MMMM yyyy');
  const accountInfo = [transaction.accountName, transaction.accountNumberLast4 ? `••${transaction.accountNumberLast4}` : '']
    .filter(Boolean)
    .join(' • ');

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateNotes(id, notesText);
    } catch {
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2], backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <IconSymbol name="chevron.right" size={24} color={theme.onBackground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Transaction Detail</Text>
          <TouchableOpacity
            onPress={() => router.push(`/recategorization?id=${transaction.id}`)}
            style={styles.headerBtn}
          >
            <IconSymbol name="square.and.pencil" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount Section */}
        <View style={[styles.amountSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.amountLabel, { color: theme.outline }]}>
            {isDebit ? 'Debit' : 'Credit'}
          </Text>
          <Text style={[styles.amountValue, { color: amountColor }]}>{formattedAmount}</Text>
          <Text style={[styles.merchantName, { color: theme.onBackground }]}>
            {transaction.merchantName ?? 'Unknown'}
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {/* Date */}
          <View style={[styles.infoRow, { backgroundColor: theme.surface }]}>
            <View style={styles.infoLeft}>
              <IconSymbol name="calendar" size={20} color={theme.outline} />
              <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Date</Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.onBackground }]}>{formattedDate}</Text>
          </View>

          {/* Category */}
          <View style={[styles.infoRow, { backgroundColor: theme.surface }]}>
            <View style={styles.infoLeft}>
              <IconSymbol name="tag.fill" size={20} color={theme.outline} />
              <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Category</Text>
            </View>
            <View style={styles.categoryBadge}>
              <View style={[styles.categoryDot, { backgroundColor: category?.colorHex ?? '#ADAAA4' }]} />
              <Text style={[styles.infoValue, { color: theme.onBackground }]}>
                {category?.name ?? 'Uncategorized'}
              </Text>
            </View>
          </View>

          {/* Account */}
          {accountInfo ? (
            <View style={[styles.infoRow, { backgroundColor: theme.surface }]}>
              <View style={styles.infoLeft}>
                <IconSymbol name="wallet" size={20} color={theme.outline} />
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Account</Text>
              </View>
              <Text style={[styles.infoValue, { color: theme.onBackground }]}>{accountInfo}</Text>
            </View>
          ) : null}

          {/* Balance */}
          {transaction.availableBalance != null ? (
            <View style={[styles.infoRow, { backgroundColor: theme.surface }]}>
              <View style={styles.infoLeft}>
                <IconSymbol name="money" size={20} color={theme.outline} />
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Balance after</Text>
              </View>
              <Text style={[styles.infoValue, { color: theme.onBackground }]}>
                {formatCurrency(transaction.availableBalance)}
              </Text>
            </View>
          ) : null}

          {/* Source */}
          {transaction.sourceChannel ? (
            <View style={[styles.infoRow, { backgroundColor: theme.surface }]}>
              <View style={styles.infoLeft}>
                <IconSymbol name="link" size={20} color={theme.outline} />
                <Text style={[styles.infoLabel, { color: theme.onBackground }]}>Source</Text>
              </View>
              <Text style={[styles.infoValue, { color: theme.onBackground }]}>
                {transaction.sourceChannel === 'sms' ? 'SMS' : transaction.sourceChannel === 'email' ? 'Email' : 'Manual'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Notes */}
        <View style={[styles.notesSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.outline }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { color: theme.onBackground, borderColor: theme.outlineVariant }]}
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Add notes about this transaction..."
            placeholderTextColor={theme.outline}
            multiline
          />
          {notesText !== (transaction.notes ?? '') ? (
            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={savingNotes}
              style={[styles.saveNotesBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.saveNotesText, { color: theme.onPrimary }]}>
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Recategorize */}
        <TouchableOpacity
          onPress={() => router.push(`/recategorization?id=${transaction.id}`)}
          style={[styles.recategorizeBtn, { backgroundColor: theme.primary }]}
        >
          <IconSymbol name="square.and.pencil" size={20} color={theme.onPrimary} />
          <Text style={[styles.recategorizeText, { color: theme.onPrimary }]}>Change Category</Text>
        </TouchableOpacity>
      </ScrollView>
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
    marginTop: Spacing[3],
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
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: Spacing[16],
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    borderRadius: Radius.lg,
  },
  amountLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[2],
  },
  amountValue: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.displayS,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  merchantName: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyL,
    marginTop: Spacing[2],
  },
  infoSection: {
    marginTop: Spacing[4],
    marginHorizontal: Spacing[4],
    gap: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    minHeight: 52,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  infoLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  infoValue: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notesSection: {
    marginTop: Spacing[4],
    marginHorizontal: Spacing[4],
    padding: Spacing[4],
    borderRadius: Radius.lg,
  },
  sectionLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[3],
  },
  notesInput: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing[3],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    marginTop: Spacing[3],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[6],
    borderRadius: Radius.md,
    alignSelf: 'flex-end',
  },
  saveNotesText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
    fontWeight: '600',
  },
  recategorizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[6],
    marginHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderRadius: Radius.md,
  },
  recategorizeText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonL,
    fontWeight: '600',
  },
});
