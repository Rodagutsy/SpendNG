import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<RNTextInput, TextAreaProps>(({
  label,
  error,
  style,
  ...props
}, ref) => {
  const [focused, setIsFocused] = useState(false);
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
      <View style={[styles.container, { backgroundColor: theme.surface, borderColor }]}>
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            { color: theme.onSurface, outlineStyle: 'none' } as any,
            style,
          ]}
          placeholderTextColor={theme.outline}
          multiline
          textAlignVertical="top"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          underlineColorAndroid="transparent"
          {...props}
        />
      </View>
      {error && (
        <Text style={[styles.message, { color: Colors.main.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

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
    minHeight: 90,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: 12,
  },
  input: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    padding: 0,
    minHeight: 66,
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: Spacing[1],
  },
});
