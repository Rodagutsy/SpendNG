import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Typography, Radius } from '@/constants/Tokens';

interface DropdownFieldProps {
  value: string;
  placeholder?: string;
  onPress: () => void;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({ value, placeholder, onPress }) => (
  <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
    <Text style={[styles.text, !value && { color: '#9E9E9E' }]} numberOfLines={1}>
      {value || placeholder || 'Select'}
    </Text>
    <MaterialIcons name="expand-more" size={20} color="#9E9E9E" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  text: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: '#001133',
  },
});
