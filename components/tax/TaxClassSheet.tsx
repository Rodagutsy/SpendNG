import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface TaxClassSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (classification: 'personal' | 'business' | 'shared') => void;
  current?: string | null;
}

const OPTIONS: { key: 'personal' | 'business' | 'shared'; label: string; desc: string }[] = [
  { key: 'personal', label: 'Personal', desc: 'Not deductible — excluded from filing' },
  { key: 'business', label: 'Business', desc: 'Fully deductible / reportable income' },
  { key: 'shared', label: 'Shared', desc: 'Mixed-use — pro-rated calculation' },
];

export const TaxClassSheet: React.FC<TaxClassSheetProps> = ({ visible, onClose, onSelect, current }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.sheet]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Tax Classification</Text>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionRow, current === opt.key && styles.optionSelected]}
              onPress={() => { onSelect(opt.key); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, current === opt.key && { fontFamily: Typography.fonts.display }]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              {current === opt.key && <MaterialIcons name="check" size={20} color={Colors.main.warning} />}
            </TouchableOpacity>
          ))}
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
