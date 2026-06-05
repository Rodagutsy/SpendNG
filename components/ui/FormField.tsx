import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/constants/Tokens';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#001133',
  },
});
