import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadows, Palette } from '@/constants/Tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface BalanceCardProps {
  balance: string;
  onAddPress?: () => void;
}

export function BalanceCard({ balance, onAddPress }: BalanceCardProps) {
  return (
    <LinearGradient
      colors={Palette.gradients.balance as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.label}>Current Balance</Text>
        <Text style={styles.amount}>{balance}</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <IconSymbol name="plus" size={24} color="#7B61FF" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    borderRadius: Radius.lg,
    padding: Spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.md,
    marginVertical: Spacing[4],
  },
  content: {
    justifyContent: 'center',
  },
  label: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  amount: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineL,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
});
