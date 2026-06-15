import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { useAlert } from '@/context/AlertContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CalendarModal } from '@/components/CalendarModal';
import { ExportService, ExportFormat } from '@/lib/export-service';
import { useTransactionStore, TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { formatCurrency } from '@/lib/utils';

const EXPORT_TYPES = [
  { key: 'tax-report', label: 'Tax Report' },
  { key: 'transaction-history', label: 'Transaction History' },
  { key: 'business-expenses', label: 'Business Expenses Only' },
];

const FILE_FORMATS = [
  { key: 'pdf', label: 'PDF' },
  { key: 'csv', label: 'CSV' },
];

const formatDisplayDate = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose }) => {
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const { translateY, panResponder } = useSwipeToClose(onClose);

  const [step, setStep] = useState<'configure' | 'summary'>('configure');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [fileFormat, setFileFormat] = useState<string>('pdf');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [summaryData, setSummaryData] = useState<{
    transactions: TransactionRecord[];
    moneyIn: number;
    moneyOut: number;
    flaggedCount: number;
  } | null>(null);

  const needsReview = (summaryData?.flaggedCount ?? 0) > 0;

  useMemo(() => {
    if (visible) {
      setStep('configure');
      setStartDate(null);
      setEndDate(null);
      setExportType('');
      setFileFormat('pdf');
      setSummaryData(null);
      setExporting(false);
      setExportProgress(0);
    }
  }, [visible]);

  const handleContinue = async () => {
    if (!exportType || !fileFormat) return;

    const transactionStore = useTransactionStore.getState();
    const categoryStore = useCategoryStore.getState();

    if (categoryStore.categories.length === 0) {
      await categoryStore.fetchCategories();
    }

    const filters: any = {};
    if (startDate) filters.startDate = startDate.getTime();
    if (endDate) filters.endDate = endDate.getTime();

    if (exportType === 'business-expenses') {
      filters.transactionType = 'debit';
    }

    await transactionStore.fetchTransactions(filters);
    const txns = useTransactionStore.getState().transactions;

    const moneyIn = txns.filter(t => t.transactionType === 'credit').reduce((s, t) => s + t.amount, 0);
    const moneyOut = txns.filter(t => t.transactionType === 'debit').reduce((s, t) => s + t.amount, 0);
    const flaggedCount = txns.filter(t => t.isFlaggedForReview).length;

    setSummaryData({ transactions: txns, moneyIn, moneyOut, flaggedCount });
    setStep('summary');
  };

  const handleClose = () => {
    setExporting(false);
    setExportProgress(0);
    setSummaryData(null);
    setStep('configure');
    onClose();
  };

  const handleDownload = useCallback(async () => {
    if (!summaryData || !startDate || !endDate) return;
    setExporting(true);
    setExportProgress(0);

    try {
      const categoryStore = useCategoryStore.getState();
      const categoryNames: Record<string, string> = {};
      for (const t of summaryData.transactions) {
        const cat = categoryStore.getCategoryById(t.categoryId);
        if (cat) categoryNames[t.categoryId] = cat.name;
      }

      const filePath = await ExportService.exportData(
        {
          format: fileFormat.toUpperCase() as ExportFormat,
          startDate,
          endDate,
          transactions: summaryData.transactions,
          userName: 'User',
          categoryNames,
        },
        (progress) => setExportProgress(progress),
      );

      await ExportService.shareFile(filePath);
      handleClose();
    } catch (err: any) {
      if (err.message === 'Export cancelled') return;
      showAlert({ title: 'Export Failed', message: err.message || 'An error occurred during export' });
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [summaryData, startDate, endDate, fileFormat]);

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
        <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}>
          <View style={styles.handleBar} {...panResponder.panHandlers} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.onBackground }]}>Export</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialIcons name="close" size={22} color={theme.onBackground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 'configure' ? (
              <>
                {/* Date Range */}
                <Text style={[styles.sectionTitle, { color: theme.outline }]}>Date Range</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[styles.dateField, { borderColor: theme.outlineVariant }]}
                    onPress={() => setShowStartCalendar(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="calendar-today" size={16} color={theme.outline} />
                    <Text style={[styles.dateFieldText, !startDate && { color: theme.outline }]}>
                      {startDate ? formatDisplayDate(startDate) : 'Start date'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.dateSep, { color: theme.outline }]}>–</Text>
                  <TouchableOpacity
                    style={[styles.dateField, { borderColor: theme.outlineVariant }]}
                    onPress={() => setShowEndCalendar(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="calendar-today" size={16} color={theme.outline} />
                    <Text style={[styles.dateFieldText, !endDate && { color: theme.outline }]}>
                      {endDate ? formatDisplayDate(endDate) : 'End date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Export Type */}
                <Text style={[styles.sectionTitle, { color: theme.outline, marginTop: Spacing[5] }]}>Export Type</Text>
                <TouchableOpacity
                  style={[styles.dropdownField, { borderColor: theme.outlineVariant }]}
                  onPress={() => setShowTypePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !exportType && { color: theme.outline }]}>
                    {exportType ? EXPORT_TYPES.find(t => t.key === exportType)?.label : 'Select type'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={theme.outline} />
                </TouchableOpacity>

                {/* File Format */}
                <Text style={[styles.sectionTitle, { color: theme.outline, marginTop: Spacing[5] }]}>File Format</Text>
                <View style={styles.pillRow}>
                  {FILE_FORMATS.map((fmt) => (
                    <TouchableOpacity
                      key={fmt.key}
                      style={[styles.pill, fileFormat === fmt.key && styles.pillSelected]}
                      onPress={() => setFileFormat(fmt.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, fileFormat === fmt.key && styles.pillTextSelected]}>
                        {fmt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Summary */}
                <Text style={[styles.sectionTitle, { color: theme.outline }]}>Summary</Text>
                <View style={[styles.summaryCard, { backgroundColor: theme.surfaceContainerLow }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.onBackground }]}>Total Money In</Text>
                    <Text style={[styles.summaryValue, { color: Colors.main.success }]}>
                      {summaryData ? formatCurrency(summaryData.moneyIn, 'NGN') : '—'}
                    </Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: theme.outlineVariant }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.onBackground }]}>Total Money Out</Text>
                    <Text style={[styles.summaryValue, { color: Colors.main.error }]}>
                      {summaryData ? formatCurrency(summaryData.moneyOut, 'NGN') : '—'}
                    </Text>
                  </View>
                </View>

                {summaryData && summaryData.flaggedCount > 0 ? (
                  <Text style={[styles.reviewNote, { color: theme.warning }]}>
                    {summaryData.flaggedCount} transaction(s) need review
                  </Text>
                ) : (
                  <View style={styles.noReviewBanner}>
                    <MaterialIcons name="check-circle" size={18} color={Colors.main.success} />
                    <Text style={[styles.noReviewText, { color: Colors.main.success }]}>No review needed</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {step === 'configure' ? (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={[styles.cancelBtnText, { color: theme.onBackground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, !exportType && { opacity: 0.5 }]}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  disabled={!exportType}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('configure')} activeOpacity={0.8}>
                  <Text style={[styles.secondaryBtnText, { color: theme.onBackground }]}>Back</Text>
                </TouchableOpacity>
                {needsReview ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.8}>
                    <Text style={styles.primaryBtnText}>Review</Text>
                  </TouchableOpacity>
                ) : exporting ? (
                  <View style={[styles.primaryBtn, { flexDirection: 'row', gap: 8 }]}>
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                    <Text style={styles.primaryBtnText}>{exportProgress}%</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleDownload} activeOpacity={0.8}>
                    <Text style={styles.primaryBtnText}>Download</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Export Type Picker */}
      {showTypePicker && (
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Select Export Type</Text>
            {EXPORT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.pickerOption, exportType === t.key && { backgroundColor: theme.primaryContainer }]}
                onPress={() => { setExportType(t.key); setShowTypePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: theme.onSurface }, exportType === t.key && { fontFamily: Typography.fonts.display }]}>
                  {t.label}
                </Text>
                {exportType === t.key && <MaterialIcons name="check" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      <CalendarModal
        visible={showStartCalendar}
        onClose={() => setShowStartCalendar(false)}
        onSelectDate={(d) => { setStartDate(d); setShowStartCalendar(false); }}
        initialDate={startDate ?? undefined}
      />
      <CalendarModal
        visible={showEndCalendar}
        onClose={() => setShowEndCalendar(false)}
        onSelectDate={(d) => { setEndDate(d); setShowEndCalendar(false); }}
        initialDate={endDate ?? undefined}
      />
    </Modal>
  );
};

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: Spacing[2],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.ripple,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleL,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  dateFieldText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: theme.onBackground,
  },
  dateSep: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  dropdownText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: theme.onBackground,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    backgroundColor: theme.surface,
  },
  pillSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: theme.onBackground,
  },
  pillTextSelected: {
    fontFamily: Typography.fonts.medium,
    color: theme.onPrimary,
  },
  summaryCard: {
    borderRadius: Radius.md,
    padding: Spacing[4],
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
  },
  summaryDivider: {
    height: 1,
  },
  reviewNote: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing[4],
  },
  noReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing[4],
    paddingVertical: 10,
  },
  noReviewText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.ripple,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: theme.surfaceContainerLow,
  },
  cancelBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: theme.primary,
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 14,
    color: theme.onPrimary,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: theme.outlineVariant,
  },
  secondaryBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
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
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleS,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.ripple,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing[5],
  },
  pickerOptionText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
  },
});
