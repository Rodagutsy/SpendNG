import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DropdownFieldProps {
  label?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  error?: string;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({ label, value, placeholder, onPress, error }) => {
  const [focused, setFocused] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const borderColor = error
    ? Colors.main.error
    : focused
      ? theme.primary
      : theme.outlineVariant;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.onBackground }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.surface, borderColor }]}
        onPress={onPress}
        onPressIn={() => setFocused(true)}
        onPressOut={() => setFocused(false)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            { color: theme.onSurface },
            !value && { color: theme.outline },
          ]}
          numberOfLines={1}
        >
          {value || placeholder || 'Select'}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={theme.outlineVariant} />
      </TouchableOpacity>
      {error && (
        <Text style={[styles.message, { color: Colors.main.error }]}>
          {error}
        </Text>
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    gap: 10,
  },
  text: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: Spacing[1],
  },
});
