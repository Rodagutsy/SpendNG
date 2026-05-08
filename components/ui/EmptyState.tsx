import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonLabel,
  onButtonPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.imagePlaceholder, { backgroundColor: theme.ripple }]} />
      <Text style={[styles.title, { color: theme.onBackground }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.outline }]}>{description}</Text>
      {buttonLabel && onButtonPress && (
        <Button 
          title={buttonLabel} 
          onPress={onButtonPress} 
          style={{ marginTop: Spacing[6] }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  description: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    lineHeight: 22,
  },
});
