import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Typography, Radius } from '@/constants/Tokens';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText, placeholder }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Text style={[styles.sign, focused && styles.signFocused]}>₦</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused, { outlineStyle: 'none' } as any]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? '0.00'}
        placeholderTextColor="#9E9E9E"
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
    height: 50,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  containerFocused: {
    borderColor: '#0B5CFF',
  },
  sign: {
    fontSize: 18,
    fontFamily: Typography.fonts.display,
    color: '#9E9E9E',
  },
  signFocused: {
    color: '#0B5CFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Typography.fonts.body,
    padding: 0,
    height: '100%',
    color: '#001133',
  },
  inputFocused: {
    color: '#001133',
  },
});
