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
  isFlagged?: boolean;
  isDuplicate?: boolean;
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
  isFlagged,
  isDuplicate,
  onPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const iconColor = color || theme.primary;
  const iconBg = color ? `${color}26` : theme.ripple;

  const formattedAmount = `${type === 'debit' ? '-' : '+'}${formatCurrency(amount)}`;
  const amountColor = theme.onSurface;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isFlagged && (
        <View style={styles.flagIndicator}>
          <Text style={styles.flagText}>!</Text>
        </View>
      )}
      {isDuplicate && (
        <View style={styles.duplicateIndicator}>
          <Text style={styles.duplicateText}>D</Text>
        </View>
      )}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Text style={[styles.avatarLetter, { color: iconColor }]}>
          {(merchant || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.merchantRow}>
          {isFlagged && <Text style={[styles.reviewLabel, { color: Colors.light.warning }]}>Review </Text>}
          <Text style={[styles.merchant, { color: theme.onSurface }]} numberOfLines={1}>
            {merchant}
          </Text>
        </View>
        <Text style={[styles.detail, { color: theme.outline }]}>
          {account} • {date}
        </Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: Colors.dark.outlineVariant }]}>
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
    paddingVertical: Spacing[2],
    height: 'auto',
  },
  flagIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  flagText: {
    color: Colors.light.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  duplicateIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.main.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  duplicateText: {
    color: Colors.light.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  avatarLetter: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleM,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.labelS,
  },
  merchant: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  category: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
});
