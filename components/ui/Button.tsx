import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: theme.primary },
          text: { color: theme.onPrimary },
        };
      case 'secondary':
        return {
          container: { backgroundColor: theme.ripple },
          text: { color: theme.primary },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.outline },
          text: { color: theme.primary },
        };
      case 'error':
        return {
          container: { backgroundColor: theme.error },
          text: { color: theme.onPrimary },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: theme.primary },
        };
      default:
        return {
          container: { backgroundColor: theme.primary },
          text: { color: theme.onPrimary },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'large':
        return {
          container: { height: 56, paddingHorizontal: Spacing[6] },
          text: { fontSize: Typography.sizes.buttonL },
        };
      case 'medium':
        return {
          container: { height: 48, paddingHorizontal: Spacing[4] },
          text: { fontSize: Typography.sizes.buttonM },
        };
      case 'small':
        return {
          container: { height: 40, paddingHorizontal: Spacing[3] },
          text: { fontSize: Typography.sizes.buttonS },
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        vStyles.container,
        sStyles.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} />
      ) : (
        <Text style={[styles.text, vStyles.text, sStyles.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fonts.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
