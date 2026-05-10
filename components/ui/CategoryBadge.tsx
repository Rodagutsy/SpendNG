import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '@/constants/Tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CategoryBadgeProps {
  name: string;
  icon?: string;
  color?: string;
  colorHex?: string;
  iconName?: string;
  size?: 'small' | 'medium';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  name, 
  icon, 
  color, 
  colorHex, 
  iconName,
  size = 'medium' 
}) => {
  const finalColor = colorHex || color || '#7B786F';
  const finalIcon = iconName || icon || 'help-circle';
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: `${finalColor}26` },
      size === 'small' && { paddingHorizontal: Spacing[1], paddingVertical: 2 }
    ]}>
      <IconSymbol name={finalIcon as any} size={size === 'small' ? 12 : 16} color={finalColor} />
      <Text style={[
        styles.text, 
        { color: finalColor },
        size === 'small' && { fontSize: 10 }
      ]}>{name}</Text>
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
