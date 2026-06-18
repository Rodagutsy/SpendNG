import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ReceiptPickerProps {
  label?: string;
  value: string | null;
  onPick: () => void;
}

export const ReceiptPicker: React.FC<ReceiptPickerProps> = ({ label, value, onPick }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.onBackground }]}>
          {label}
        </Text>
      )}
      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value }} style={styles.previewImage} />
          <TouchableOpacity style={[styles.replaceBtn, { backgroundColor: theme.primary }]} onPress={onPick} activeOpacity={0.8}>
            <MaterialIcons name="camera-alt" size={16} color={theme.onPrimary} />
            <Text style={styles.replaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '0A' }]}
          onPress={onPick}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-a-photo" size={20} color={theme.primary} />
          <Text style={[styles.addText, { color: theme.primary }]}>Add Receipt Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[1],
    fontWeight: '500',
  },
  previewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
  },
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  replaceText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
  },
});
