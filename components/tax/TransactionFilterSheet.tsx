import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';

export type FilterStatus = 'all' | 'high' | 'medium' | 'low' | 'needs_review';
export type DateRangePreset = 'this_week' | 'this_month' | 'custom' | null;

export interface TransactionFilters {
  status: FilterStatus;
  taxClassId: string | null;
  dateRange: DateRangePreset;
}

interface TransactionFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  current: TransactionFilters;
}

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High confidence' },
  { key: 'medium', label: 'Medium confidence' },
  { key: 'low', label: 'Low confidence' },
  { key: 'needs_review', label: 'Needs review' },
];

const DATE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: null, label: 'All time' },
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
];

type DropdownKey = 'status' | 'category' | 'date';

type Props = TransactionFilterSheetProps;

export const TransactionFilterSheet: React.FC<Props> = ({
  visible,
  onClose,
  onApply,
  current,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { translateY, panResponder } = useSwipeToClose(onClose);
  const { classifications: taxClasses } = useTaxClassificationStore();

  const [status, setStatus] = useState<FilterStatus>(current.status);
  const [taxClassId, setTaxClassId] = useState<string | null>(current.taxClassId);
  const [dateRange, setDateRange] = useState<DateRangePreset>(current.dateRange);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);

  const handleApply = () => {
    onApply({ status, taxClassId, dateRange });
    onClose();
  };

  const hasChanges = status !== current.status || taxClassId !== current.taxClassId || dateRange !== current.dateRange;

  const statusLabel = STATUS_OPTIONS.find((o) => o.key === status)?.label ?? 'All';
  const categoryLabel = taxClassId ? taxClasses.find((tc) => tc.id === taxClassId)?.name ?? 'Category' : 'All categories';
  const dateLabel = DATE_PRESETS.find((p) => p.key === dateRange)?.label ?? 'All time';

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const selectedColor = Colors.main.primary;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => {
        Animated.timing(translateY, {
          toValue: 2000,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onClose());
      }}>
        <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}>
          <View style={styles.handle} {...panResponder.panHandlers} />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <Text style={[styles.title, { color: theme.onSurface }]}>Filter</Text>

            {/* Status Dropdown */}
            <View style={styles.dropdownSection}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => toggleDropdown('status')} activeOpacity={0.7}>
                <View style={styles.dropdownHeaderLeft}>
                  <Text style={[styles.dropdownLabel, { color: theme.outline }]}>Status</Text>
                  <Text style={[styles.dropdownValue, { color: theme.onSurface }]}>{statusLabel}</Text>
                </View>
                <MaterialIcons name={openDropdown === 'status' ? 'expand-less' : 'expand-more'} size={22} color={theme.outline} />
              </TouchableOpacity>
              {openDropdown === 'status' && (
                <View style={styles.dropdownBody}>
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = status === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.dropdownOption, selected && { backgroundColor: selectedColor + '0D' }]}
                        onPress={() => { setStatus(opt.key); setOpenDropdown(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownOptionText, { color: selected ? selectedColor : theme.onSurface }]}>
                          {opt.label}
                        </Text>
                        {selected && <MaterialIcons name="check" size={18} color={selectedColor} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Category Dropdown */}
            <View style={styles.dropdownSection}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => toggleDropdown('category')} activeOpacity={0.7}>
                <View style={styles.dropdownHeaderLeft}>
                  <Text style={[styles.dropdownLabel, { color: theme.outline }]}>Category</Text>
                  <Text style={[styles.dropdownValue, { color: theme.onSurface }]}>{categoryLabel}</Text>
                </View>
                <MaterialIcons name={openDropdown === 'category' ? 'expand-less' : 'expand-more'} size={22} color={theme.outline} />
              </TouchableOpacity>
              {openDropdown === 'category' && (
                <View style={styles.dropdownBody}>
                  <TouchableOpacity
                    style={[styles.dropdownOption, !taxClassId && { backgroundColor: selectedColor + '0D' }]}
                    onPress={() => { setTaxClassId(null); setOpenDropdown(null); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownOptionText, { color: !taxClassId ? selectedColor : theme.onSurface }]}>
                      All categories
                    </Text>
                    {!taxClassId && <MaterialIcons name="check" size={18} color={selectedColor} />}
                  </TouchableOpacity>
                  {taxClasses.map((tc) => {
                    const selected = taxClassId === tc.id;
                    return (
                      <TouchableOpacity
                        key={tc.id}
                        style={[styles.dropdownOption, selected && { backgroundColor: selectedColor + '0D' }]}
                        onPress={() => { setTaxClassId(tc.id); setOpenDropdown(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownOptionText, { color: selected ? selectedColor : theme.onSurface }]}>
                          {tc.name}
                        </Text>
                        {selected && <MaterialIcons name="check" size={18} color={selectedColor} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Date Range Dropdown */}
            <View style={styles.dropdownSection}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => toggleDropdown('date')} activeOpacity={0.7}>
                <View style={styles.dropdownHeaderLeft}>
                  <Text style={[styles.dropdownLabel, { color: theme.outline }]}>Date range</Text>
                  <Text style={[styles.dropdownValue, { color: theme.onSurface }]}>{dateLabel}</Text>
                </View>
                <MaterialIcons name={openDropdown === 'date' ? 'expand-less' : 'expand-more'} size={22} color={theme.outline} />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownBody}>
                  {DATE_PRESETS.map((preset) => {
                    const selected = dateRange === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key ?? 'all'}
                        style={[styles.dropdownOption, selected && { backgroundColor: selectedColor + '0D' }]}
                        onPress={() => { setDateRange(preset.key); setOpenDropdown(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownOptionText, { color: selected ? selectedColor : theme.onSurface }]}>
                          {preset.label}
                        </Text>
                        {selected && <MaterialIcons name="check" size={18} color={selectedColor} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: Colors.main.primary, opacity: hasChanges ? 1 : 0.5 }]}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>Apply filters</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[5],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
    maxHeight: '70%',
  },
  scrollArea: {
    flexGrow: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.outlineVariant,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing[3],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    marginBottom: Spacing[3],
  },
  dropdownSection: {
    marginBottom: Spacing[2],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing[3],
  },
  dropdownHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  dropdownLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownValue: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  dropdownBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
    paddingVertical: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing[3],
  },
  dropdownOptionText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  applyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.full,
    marginTop: Spacing[3],
  },
  applyBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
