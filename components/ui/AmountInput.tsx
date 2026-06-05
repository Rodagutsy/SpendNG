import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText, placeholder }) => {
  const [focused, setFocused] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const borderColor = focused ? theme.primary : theme.outlineVariant;
  const iconColor = focused ? theme.primary : theme.outlineVariant;

  return (
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
});
