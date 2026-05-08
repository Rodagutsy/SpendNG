import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface SummaryCardProps {
  income: number;
  spending: number;
  incomeDelta: number;
  spendingDelta: number;
  monthName: string;
}

export const DashboardSummaryCard: React.FC<SummaryCardProps> = ({
  income,
  spending,
  incomeDelta,
  spendingDelta,
  monthName,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Card style={styles.container}>
      <Text style={[styles.monthLabel, { color: theme.outline }]}>{monthName}</Text>
      
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={[styles.label, { color: theme.outline }]}>Income</Text>
          <Text style={[styles.amount, { color: theme.success }]}>
            {formatCurrency(income)}
          </Text>
          <Text style={[
            styles.delta, 
            { color: incomeDelta >= 0 ? theme.success : theme.error }
          ]}>
            vs last month {formatPercentage(incomeDelta)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />

        <View style={styles.column}>
          <Text style={[styles.label, { color: theme.outline }]}>Spending</Text>
          <Text style={[styles.amount, { color: theme.error }]}>
            -{formatCurrency(spending)}
          </Text>
          <Text style={[
            styles.delta, 
            { color: spendingDelta <= 0 ? theme.success : theme.error }
          ]}>
            vs last month {formatPercentage(spendingDelta)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing[4],
  },
  monthLabel: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.labelL,
    marginBottom: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: '100%',
    marginHorizontal: Spacing[4],
  },
  label: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
    marginBottom: Spacing[1],
  },
  amount: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
    marginBottom: Spacing[1],
  },
  delta: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
});
