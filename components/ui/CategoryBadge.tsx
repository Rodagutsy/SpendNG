import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '@/constants/Tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, icon, color }) => {
  return (
    <View style={[styles.container, { backgroundColor: `${color}26` }]}>
      <IconSymbol name={icon as any} size={16} color={color} />
      <Text style={[styles.text, { color }]}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    gap: Spacing[1],
  },
  text: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    fontWeight: '600',
  },
});
