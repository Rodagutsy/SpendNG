import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AmountInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  warning?: string;
  success?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  warning,
  success,
}) => {
  const [focused, setFocused] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const message = error || warning || success;
  const messageColor = error
    ? Colors.main.error
    : warning
      ? Colors.main.warning
      : success
        ? Colors.main.success
        : undefined;

  const borderColor = error
    ? Colors.main.error
    : focused
      ? theme.primary
      : theme.outlineVariant;
  const iconColor = focused ? theme.primary : theme.outlineVariant;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.onBackground }]}>
          {label}
        </Text>
      )}
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor }]}>
        <Text style={[styles.sign, { color: iconColor }]}>₦</Text>
        <TextInput
          style={[styles.input, { color: theme.onSurface, outlineStyle: 'none' } as any]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? '0.00'}
          placeholderTextColor={theme.outline}
          keyboardType="decimal-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent"
        />
      </View>
      {message && (
        <Text style={[styles.message, { color: messageColor }]}>
          {message}
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
  sign: {
    fontSize: 18,
    fontFamily: Typography.fonts.display,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Typography.fonts.body,
    padding: 0,
    height: '100%',
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: Spacing[1],
  },
});
