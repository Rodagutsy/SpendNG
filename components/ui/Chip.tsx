import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  variant?: 'filled' | 'outlined';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  color,
  variant = 'filled',
  size = 'md',
  style,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getContainerStyle = () => {
    if (color && selected) {
      return {
        backgroundColor: color + '1A',
        borderColor: color + '33',
      };
    }
    if (color && !selected) {
      return {
        backgroundColor: 'transparent',
        borderColor: theme.outlineVariant,
      };
    }
    if (selected) {
      return {
        backgroundColor: theme.primaryContainer,
        borderColor: theme.primary,
      };
    }
    return {
      backgroundColor: 'transparent',
      borderColor: theme.outlineVariant,
    };
  };

  const getTextStyle = () => {
    if (color && selected) {
      return { color };
    }
    if (color && !selected) {
      return { color: theme.outline };
    }
    if (selected) {
      return { color: theme.primary, fontFamily: Typography.fonts.medium };
    }
    return { color: theme.onBackground };
  };

  const sizeStyles = size === 'sm'
    ? { paddingVertical: 2, paddingHorizontal: 8 }
    : { paddingVertical: 7, paddingHorizontal: 16 };

  const textSize = size === 'sm'
    ? Typography.sizes.labelS
    : Typography.sizes.labelL;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles,
        getContainerStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { fontSize: textSize }, getTextStyle()]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fonts.body,
    fontWeight: '500',
    textAlign: 'center',
  },
});
