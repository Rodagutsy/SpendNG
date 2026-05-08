import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8 }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.track, { backgroundColor: theme.ripple, height, borderRadius: height / 2 }]}>
      <View 
        style={[
          styles.fill, 
          { 
            backgroundColor: theme.primary, 
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            height,
            borderRadius: height / 2
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    width: 0,
  },
});
