import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CalendarModal } from '@/components/CalendarModal';

const PERIOD_OPTIONS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

const TRANSACTION_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Money In' },
  { key: 'debit', label: 'Money Out' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'needs_review', label: 'Needs Review' },
];

export interface FilterValues {
  transactionType?: 'credit' | 'debit';
  startDate?: number;
  endDate?: number;
  needsReview?: boolean;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  initialFilters?: FilterValues;
  onApply?: (filters: FilterValues) => void;
}

const formatDisplayDate = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, initialFilters, onApply }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const [period, setPeriod] = useState('all');
  const [txType, setTxType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reviewStatus, setReviewStatus] = useState('all');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  useEffect(() => {
    if (visible) {
      setPeriod('all');
      setTxType(initialFilters?.transactionType ?? 'all');
      setSortBy(initialFilters?.sortBy ?? 'newest');
      setStartDate(initialFilters?.startDate ? new Date(initialFilters.startDate) : null);
      setEndDate(initialFilters?.endDate ? new Date(initialFilters.endDate) : null);
      setReviewStatus(initialFilters?.needsReview ? 'needs_review' : 'all');
    }
  }, [visible]);

  const getDateRange = (): { startDate?: number; endDate?: number } => {
    if (period === 'custom') {
      if (startDate) return { startDate: startDate.getTime() };
      return {};
    }
    const now = Date.now();
    const day = 86400000;
    switch (period) {
      case 'today':
        return { startDate: now - day };
      case 'week':
        return { startDate: now - 7 * day };
      case 'month':
        return { startDate: now - 30 * day };
      default:
        return {};
    }
  };

  const handleApply = () => {
    const dateRange = getDateRange();
    onApply?.({
      ...dateRange,
      transactionType: txType === 'all' ? undefined : txType as 'credit' | 'debit',
      needsReview: reviewStatus === 'needs_review' ? true : undefined,
      sortBy: sortBy as 'newest' | 'oldest' | 'highest' | 'lowest',
    });
    onClose();
  };

  const handleReset = () => {
    setPeriod('all');
    setTxType('all');
    setSortBy('newest');
    setReviewStatus('all');
    setStartDate(null);
    setEndDate(null);
  };

  const renderPillGroup = (
    options: { key: string; label: string }[],
    selected: string,
    onSelect: (key: string) => void,
  ) => (
    <View style={styles.pillRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.pill, selected === opt.key && styles.pillSelected]}
          onPress={() => onSelect(opt.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, selected === opt.key && styles.pillTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }]} activeOpacity={1} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.heading, { color: theme.onSurface }]}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialIcons name="close" size={22} color={theme.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Period */}
            <Text style={[styles.label, { color: theme.outline }]}>Period</Text>
            {renderPillGroup(PERIOD_OPTIONS, period, setPeriod)}

            {/* Start / End Date — only visible when Custom is selected */}
            {period === 'custom' && (
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
            )}

            {/* Transaction Type */}
            <Text style={[styles.label, { color: theme.outline, marginTop: 20 }]}>Type</Text>
            {renderPillGroup(TRANSACTION_TYPES, txType, setTxType)}

            {/* Sort By */}
            <Text style={[styles.label, { color: theme.outline, marginTop: 20 }]}>Sort By</Text>
            {renderPillGroup(SORT_OPTIONS, sortBy, setSortBy)}

            {/* Status */}
            <Text style={[styles.label, { color: theme.outline, marginTop: 20 }]}>Status</Text>
            {renderPillGroup(STATUS_OPTIONS, reviewStatus, setReviewStatus)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={[styles.resetBtnText, { color: theme.primary }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: Spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: Radius.lg,
    paddingBottom: Platform.OS === 'ios' ? 20 : Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.ripple,
  },
  heading: {
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
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    fontSize: 13,
    color: theme.onBackground,
  },
  pillTextSelected: {
    fontFamily: Typography.fonts.medium,
    color: theme.onPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing[3],
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  dateFieldText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: theme.onBackground,
  },
  dateSep: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    marginTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.ripple,
  },
  resetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  resetBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: theme.primary,
  },
  applyBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 13,
    color: theme.onPrimary,
  },
});
