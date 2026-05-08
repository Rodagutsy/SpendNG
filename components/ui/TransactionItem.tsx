import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/lib/utils';

interface TransactionItemProps {
  merchant: string;
  category: string;
  account: string;
  icon: string;
  color?: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  merchant,
  category,
  account,
  icon,
  color,
  amount,
  type,
  date,
  onPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const iconColor = color || theme.primary;
  const iconBg = color ? `${color}26` : theme.ripple;

  const formattedAmount = `${type === 'debit' ? '-' : '+'}${formatCurrency(amount)}`;
  const amountColor = type === 'debit' ? theme.error : theme.success;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.surface }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <IconSymbol name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.merchant, { color: theme.onSurface }]} numberOfLines={1}>
          {merchant}
        </Text>
        <Text style={[styles.detail, { color: theme.outline }]}>
          {account} • {date}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {formattedAmount}
        </Text>
        <Text style={[styles.category, { color: theme.outline }]}>
          {category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    height: 72,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  merchant: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
    marginBottom: 2,
  },
  detail: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '700',
    marginBottom: 2,
  },
  category: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
  },
});
