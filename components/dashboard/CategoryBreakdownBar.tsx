import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { CategoryBadge } from '../ui/CategoryBadge';

interface BreakdownSegment {
  categoryId: string;
  name: string;
  color: string;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: BreakdownSegment[];
}

export const CategoryBreakdownBar: React.FC<CategoryBreakdownProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending Breakdown</Text>
      
      {/* Stacked Bar */}
      <View style={styles.barContainer}>
        {data.map((item, index) => (
          <View
            key={item.categoryId}
            style={[
              styles.segment,
              {
                backgroundColor: item.color,
                width: `${item.percentage}%`,
                opacity: 0.8,
                borderTopLeftRadius: index === 0 ? Radius.full : 0,
                borderBottomLeftRadius: index === 0 ? Radius.full : 0,
                borderTopRightRadius: index === data.length - 1 ? Radius.full : 0,
                borderBottomRightRadius: index === data.length - 1 ? Radius.full : 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendContainer}
      >
        {data.map((item) => (
          <View key={item.categoryId} style={styles.legendItem}>
            <CategoryBadge 
              name={item.name} 
              colorHex={item.color} 
              size="small"
              iconName="help-circle" // Default icon if not provided in data
            />
            <Text style={styles.percentageText}>{Math.round(item.percentage)}%</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing[4],
  },
  title: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleS,
    fontWeight: '600',
    marginBottom: Spacing[3],
  },
  barContainer: {
    height: 8,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing[4],
  },
  segment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  percentageText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    color: '#7B786F', // neutralVariant-50
  },
});
