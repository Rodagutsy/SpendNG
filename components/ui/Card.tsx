import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'outline';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const variantStyles = {
    elevated: {
      ...Shadows.sm,
      backgroundColor: theme.surfaceContainerLowest,
      borderWidth: 0,
    },
    flat: {
      backgroundColor: theme.surfaceContainerLow,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    }
  };

  return (
    <View style={[
      styles.card,
      variantStyles[variant],
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
});
