import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  AppState, 
  AppStateStatus 
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Mock Export Format
type ExportFormat = 'PDF' | 'CSV';

export default function ExportScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [formatType, setFormatType] = useState<ExportFormat>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          Alert.alert('Export Successful', `Your ${formatType} report has been generated.`);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const QuickRangeButton = ({ label, getDates }: { label: string, getDates: () => [Date, Date] }) => (
    <TouchableOpacity 
      style={[styles.quickButton, { borderColor: theme.outlineVariant }]}
      onPress={() => {
        const [start, end] = getDates();
        setStartDate(start);
        setEndDate(end);
      }}
    >
      <Text style={[styles.quickButtonText, { color: theme.onBackground }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Export Data</Text>
        <Text style={[styles.subtitle, { color: theme.outline }]}>
          Generate a detailed report of your transactions.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: theme.outline }]}>DATE RANGE</Text>
        
        <View style={styles.dateRow}>
          <View style={styles.datePicker}>
            <Text style={[styles.dateLabel, { color: theme.outline }]}>From</Text>
            <Text style={[styles.dateValue, { color: theme.onBackground }]}>
              {format(startDate, 'MMM dd, yyyy')}
            </Text>
          </View>

          <View style={styles.dateSeparator} />

          <View style={styles.datePicker}>
            <Text style={[styles.dateLabel, { color: theme.outline }]}>To</Text>
            <Text style={[styles.dateValue, { color: theme.onBackground }]}>
              {format(endDate, 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        <View style={styles.quickRanges}>
          <QuickRangeButton 
            label="Last 30 Days" 
            getDates={() => [subDays(new Date(), 30), new Date()]} 
          />
          <QuickRangeButton 
            label="This Month" 
            getDates={() => [startOfMonth(new Date()), endOfMonth(new Date())]} 
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: theme.outline }]}>FILE FORMAT</Text>
        <View style={styles.formatRow}>
          {(['PDF', 'CSV'] as ExportFormat[]).map(f => (
            <TouchableOpacity 
              key={f}
              style={[
                styles.formatButton, 
                { 
                  backgroundColor: formatType === f ? theme.primary : theme.surface,
                  borderColor: formatType === f ? theme.primary : theme.outlineVariant
                }
              ]}
              onPress={() => setFormatType(f)}
            >
              <IconSymbol 
                name={f === 'PDF' ? 'arrow.down.doc.fill' : 'list.bullet'} 
                size={20} 
                color={formatType === f ? theme.onPrimary : theme.outline} 
              />
              <Text style={[
                styles.formatButtonText, 
                { color: formatType === f ? theme.onPrimary : theme.onBackground }
              ]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <View style={styles.actionContainer}>
        {isGenerating ? (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.onBackground }]}>
              Generating {formatType}... {progress}%
            </Text>
            <ProgressBar progress={progress / 100} />
          </View>
        ) : (
          <Button 
            title="Generate Export" 
            onPress={handleExport}
            size="large"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing[4],
  },
  header: {
    marginTop: Spacing[10],
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    marginTop: Spacing[2],
  },
  card: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
  },
  sectionLabel: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.labelS,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing[4],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  datePicker: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    marginBottom: 4,
  },
  dateValue: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
  },
  dateSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#EEE',
    marginHorizontal: Spacing[4],
  },
  quickRanges: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  quickButton: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickButtonText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  formatButtonText: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: Spacing[6],
    marginBottom: Spacing[10],
  },
  progressContainer: {
    gap: Spacing[2],
  },
  progressText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
  },
});
