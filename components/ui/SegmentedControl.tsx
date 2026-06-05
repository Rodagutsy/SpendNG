import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Typography, Radius } from '@/constants/Tokens';

interface SegmentedControlProps {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}

export function SegmentedControl({ options, selected, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F2F6',
    borderRadius: Radius.md,
    padding: 4,
    height: 44,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md - 2,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tabText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#7B786F',
  },
  tabTextActive: {
    color: '#001133',
    fontFamily: Typography.fonts.display,
  },
});
