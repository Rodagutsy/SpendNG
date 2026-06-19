import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { ParsedStatementRow } from '@/lib/statement-parser';
import { importCsvStatement } from '@/lib/statement-parser/csv-generic';
import { importPdfStatement } from '@/lib/statement-parser/pdf-parse';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import * as Crypto from 'expo-crypto';
import { getNairaRate } from '@/lib/exchange-rate';

type ScreenStep = 'select' | 'preview' | 'importing' | 'done';

export default function StatementImportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [step, setStep] = useState<ScreenStep>('select');
  const [parsedRows, setParsedRows] = useState<ParsedStatementRow[]>([]);
  const [detectedBank, setDetectedBank] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [progress, setProgress] = useState({ saved: 0, skipped: 0 });

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/pdf', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const isPdf = file.name?.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const rows = await importPdfStatement(file.uri);
        setParsedRows(rows ?? []);
        setDetectedBank(null);
        setTotalRows(rows?.length ?? 0);
      } else {
        const parseResult = await importCsvStatement(file.uri);
        setParsedRows(parseResult?.rows ?? []);
        setDetectedBank(parseResult?.detectedBank ?? null);
        setTotalRows(parseResult?.rows.length ?? 0);
      }

      setStep('preview');
    } catch (e: any) {
      showAlert({ title: 'File Error', message: e.message || 'Failed to read file.' });
    }
  }, []);

  const handleImport = useCallback(async () => {
    setStep('importing');
    let saved = 0;
    let skipped = 0;

    for (const row of parsedRows) {
      try {
        const dateNow = new Date(row.date).getTime();
        const rowCurrency = (row.currency || 'NGN').toUpperCase();

        let finalAmount = row.amount;
        let originalCurrency: string | null = null;
        let originalAmount: number | null = null;
        let exchangeRate: number | null = null;
        let amountInNaira: number | null = null;
        let rateSource: string | null = null;

        if (rowCurrency !== 'NGN') {
          originalCurrency = rowCurrency;
          originalAmount = row.amount;
          const rateResult = await getNairaRate(rowCurrency, new Date(row.date));
          if (rateResult.rate > 0) {
            exchangeRate = rateResult.rate;
            amountInNaira = Math.round(row.amount * rateResult.rate * 100) / 100;
            finalAmount = amountInNaira;
            rateSource = rateResult.source;
          }
        }

        const dateMinute = Math.floor(dateNow / 60000);
        const hashInput = [row.description.toLowerCase(), row.amount.toFixed(2), dateMinute, rowCurrency].join('|');
        const contentHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashInput);

        await addTransaction({
          amount: finalAmount,
          currency: rowCurrency,
          originalCurrency,
          originalAmount,
          exchangeRate,
          amountInNaira,
          rateSource,
          rateDate: originalCurrency ? dateNow : null,
          transactionType: row.type,
          merchantName: row.description || null,
          categoryId: row.type === 'credit' ? 'other-income' : 'other-expense',
          accountName: detectedBank || 'Bank Statement',
          accountNumberLast4: null,
          transactionDate: dateNow,
          availableBalance: row.balance,
          sourceChannel: 'statement',
          notes: null,
          taxClassificationId: null,
          confidenceLevel: 'high',
          originalMessage: null,
          isFlaggedForReview: false,
          receiptImageUri: null,
          whtAmount: null,
          whtClientName: null,
          contentHash,
        });
        saved++;
      } catch (err) {
        console.warn('Skipped statement row:', row.description, err);
        skipped++;
      }
      setProgress({ saved, skipped });
    }

    setStep('done');
  }, [parsedRows, detectedBank, addTransaction]);

  const reset = () => {
    setStep('select');
    setParsedRows([]);
    setProgress({ saved: 0, skipped: 0 });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Import Statement</Text>
          <View style={{ width: 32 }} />
        </View>

        {step === 'select' && (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.uploadSection}>
              <View style={[styles.uploadIcon, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="description" size={40} color={theme.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: theme.onBackground }]}>Upload Bank Statement</Text>
              <Text style={[styles.uploadSubtitle, { color: theme.outline }]}>
                Select a CSV or PDF file from your device to import transactions
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.pickFileBtn, { backgroundColor: theme.primary }]}
              onPress={handlePickFile}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickFileBtnText, { color: theme.onPrimary }]}>Choose file</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 'preview' && (
          <View style={{ flex: 1 }}>
            <View style={[styles.previewHeader, { backgroundColor: theme.surface }]}>
              <View style={styles.previewStats}>
                <Text style={[styles.previewStatNumber, { color: theme.primary }]}>{totalRows}</Text>
                <Text style={[styles.previewStatLabel, { color: theme.outline }]}>transactions found</Text>
              </View>
              {detectedBank && (
                <View style={[styles.bankBadge, { backgroundColor: theme.primaryContainer }]}>
                  <Text style={[styles.bankBadgeText, { color: theme.primary }]}>{detectedBank}</Text>
                </View>
              )}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.previewList}>
              {parsedRows.slice(0, 50).map((row, i) => (
                <View key={i} style={[styles.previewRow, { backgroundColor: theme.surface }]}>
                  <View style={styles.previewRowLeft}>
                    <Text style={[styles.previewDate, { color: theme.outline }]}>{row.date}</Text>
                    <Text style={[styles.previewDesc, { color: theme.onSurface }]} numberOfLines={1}>
                      {row.description || 'No description'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.previewAmount,
                      { color: row.type === 'credit' ? '#00BD00' : '#D30000' },
                    ]}
                  >
                    {row.type === 'credit' ? '+' : '-'}₦{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              {parsedRows.length > 50 && (
                <Text style={[styles.moreText, { color: theme.outline }]}>
                  ...and {parsedRows.length - 50} more
                </Text>
              )}
            </ScrollView>

            <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.outline }]}
                onPress={reset}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.outline }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }, Shadows.sm]}
                onPress={handleImport}
                activeOpacity={0.8}
              >
                <MaterialIcons name="download" size={20} color={theme.onPrimary} />
                <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>Import {totalRows} Transactions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'importing' && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.importingText, { color: theme.onBackground }]}>
              Importing transactions...
            </Text>
            <Text style={[styles.importingSub, { color: theme.outline }]}>
              {progress.saved} saved, {progress.skipped} skipped
            </Text>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.centerContent}>
            <View style={[styles.checkCircle, { backgroundColor: theme.primaryContainer }]}>
              <MaterialIcons name="check" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: theme.onBackground }]}>Import Complete</Text>
            <Text style={[styles.doneSub, { color: theme.outline }]}>
              {progress.saved} transactions imported{progress.skipped > 0 ? `, ${progress.skipped} skipped` : ''}
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 24 }, Shadows.sm]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
  },
  uploadSection: {
    alignItems: 'center',
    paddingTop: Spacing[4],
    marginBottom: Spacing[5],
    paddingHorizontal: Spacing[10],
  },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    marginBottom: Spacing[1],
  },
  uploadSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[2]
  },
  pickFileBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.sm,
  },
  pickFileBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewStats: {
    alignItems: 'center',
  },
  previewStatNumber: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
  },
  previewStatLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
  },
  bankBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  bankBadgeText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
  },
  previewList: {
    padding: Spacing[4],
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  previewRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  previewDate: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
  },
  previewDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    marginTop: 2,
  },
  previewAmount: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  moreText: {
    textAlign: 'center',
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    paddingVertical: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    paddingBottom: Platform.OS === 'ios' ? Spacing[8] : Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.sm,
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[8],
  },
  importingText: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    marginTop: 16,
  },
  importingSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    marginBottom: 4,
  },
  doneSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
});
