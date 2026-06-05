import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DropdownFieldProps {
  value: string;
  placeholder?: string;
  onPress: () => void;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({ value, placeholder, onPress }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          { color: theme.onSurface },
          !value && { color: theme.outline }
        ]}
        numberOfLines={1}
      >
        {value || placeholder || 'Select'}
      </Text>
      <MaterialIcons name="expand-more" size={20} color={theme.outlineVariant} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  text: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
});
