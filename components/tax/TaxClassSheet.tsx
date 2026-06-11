import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTaxClassificationStore, TaxClassificationRecord } from '@/lib/stores/taxClassificationStore';

interface TaxClassSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (classificationId: string) => void;
  current?: string | null;
  direction?: 'income' | 'expense';
}

const DIRECTION_DESCRIPTIONS: Record<string, string> = {
  'employment-income': 'Salary, wages — fully reportable',
  'business-income': 'Business revenue — fully reportable',
  'freelance-income': 'Contract work — fully reportable',
  'investment-income': 'Dividends, interest, capital gains',
  'rental-income': 'Property rental — fully reportable',
  'other-taxable-income': 'Miscellaneous — reportable income',
  'non-taxable-receipt': 'Gifts, personal transfers — not taxed',
  'business-expense': 'Fully deductible business cost',
  'personal-expense': 'Not deductible — excluded from filing',
  'business-asset': 'Capital equipment — depreciable asset',
  'tax-paid': 'Tax already remitted — claim credit',
};

export const TaxClassSheet: React.FC<TaxClassSheetProps> = ({ visible, onClose, onSelect, current, direction }) => {
  const { classifications } = useTaxClassificationStore();

  const options = direction
    ? classifications.filter((c) => c.direction === direction)
    : classifications;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.sheet]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Tax Classification</Text>
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {options.length === 0 && (
              <Text style={styles.emptyText}>Loading classifications...</Text>
            )}
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionRow, current === opt.id && styles.optionSelected]}
                onPress={() => { onSelect(opt.id); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionLabel, current === opt.id && { fontFamily: Typography.fonts.display }]}>
                    {opt.name}
                  </Text>
                  <Text style={styles.optionDesc}>{DIRECTION_DESCRIPTIONS[opt.id] || ''}</Text>
                </View>
                {current === opt.id && <MaterialIcons name="check" size={20} color={Colors.main.warning} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: Colors.light.surface,
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
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    color: Colors.light.onSurface,
    marginBottom: Spacing[4],
  },
  emptyText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: Colors.light.outline,
    textAlign: 'center',
    paddingVertical: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: Colors.main.warning + '14',
  },
  optionLeft: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  optionDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: Colors.light.outline,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  cancelText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
    color: Colors.light.outline,
  },
});
