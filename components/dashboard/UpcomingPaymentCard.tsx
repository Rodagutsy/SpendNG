import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface UpcomingPaymentCardProps {
  title: string;
  amount: string;
  daysLeft: number;
  icon: string;
  backgroundColor: string;
  textColor?: string;
}

export function UpcomingPaymentCard({ 
  title, 
  amount, 
  daysLeft, 
  icon, 
  backgroundColor,
  textColor = '#FFFFFF'
}: UpcomingPaymentCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol name={icon as any} size={20} color={textColor} />
        </View>
        <TouchableOpacity>
          <IconSymbol name="ellipsis" size={20} color={textColor} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={[styles.amount, { color: textColor }]}>{amount}</Text>
        <Text style={[styles.days, { color: textColor, opacity: 0.8 }]}>{daysLeft} days left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginRight: Spacing[4],
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: 4,
  },
  title: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
  },
  amount: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleS,
    fontWeight: '700',
  },
  days: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
  },
});
