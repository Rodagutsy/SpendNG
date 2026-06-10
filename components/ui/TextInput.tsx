import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps as RNTextInputProps,
  TouchableOpacity
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  warning?: string;
  success?: string;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  warning,
  success,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isSecure = secureTextEntry && !isPasswordVisible;

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
    : isFocused
      ? theme.primary
      : theme.outlineVariant;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.onBackground }]}>
          {label}
        </Text>
      )}
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.onSurface,
              borderColor,
              paddingRight: secureTextEntry ? 48 : Spacing[4],
            },
            style,
          ]}
          placeholderTextColor={theme.outline}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <IconSymbol
              name={isPasswordVisible ? "eye.slash" : "eye"}
              size={20}
              color={borderColor}
            />
          </TouchableOpacity>
        )}
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
  container: {
    width: '100%',
    marginBottom: Spacing[4],
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[1],
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[4],
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: Spacing[1],
  },
});
