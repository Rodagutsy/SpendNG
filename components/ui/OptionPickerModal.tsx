import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const OptionPickerModal: React.FC<OptionPickerModalProps> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.onSurface }]}>{title}</Text>
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, selected === opt.id && { backgroundColor: theme.primaryContainer }]}
                onPress={() => { onSelect(opt.id); onClose(); }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.onSurface },
                    selected === opt.id && { fontFamily: Typography.fonts.display },
                  ]}
                >
                  {opt.label}
                </Text>
                {selected === opt.id && <MaterialIcons name="check" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    width: '80%',
    maxHeight: '50%',
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
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 16,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.ripple,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing[4],
  },
  optionText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
  },
  optionsList: {
    maxHeight: 300,
  },
});
