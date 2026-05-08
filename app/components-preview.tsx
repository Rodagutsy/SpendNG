import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton, TransactionSkeleton } from '@/components/ui/Skeleton';

export default function ComponentsPreviewScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.onBackground }]}>Component Library</Text>

      {/* Buttons */}
      <Section title="Buttons">
        <View style={styles.row}>
          <Button title="Primary" onPress={() => {}} variant="primary" />
          <Button title="Secondary" onPress={() => {}} variant="secondary" />
        </View>
        <View style={styles.row}>
          <Button title="Outline" onPress={() => {}} variant="outline" />
          <Button title="Error" onPress={() => {}} variant="error" />
        </View>
        <Button title="Large Button" onPress={() => {}} size="large" style={{ marginTop: 10 }} />
        <Button title="Loading..." onPress={() => {}} loading style={{ marginTop: 10 }} />
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <TextInput label="Email Address" placeholder="Enter your email" />
        <TextInput label="Password" placeholder="Enter password" secureTextEntry error="Incorrect password" />
      </Section>

      {/* Category Badges */}
      <Section title="Category Badges">
        <View style={styles.row}>
          <CategoryBadge name="Food" icon="utensils" color="#D30000" />
          <CategoryBadge name="Transport" icon="car" color="#0B5CFF" />
          <CategoryBadge name="Salary" icon="wallet" color="#00BD00" />
        </View>
      </Section>

      {/* Transaction Items */}
      <Section title="Transaction Items">
        <TransactionItem 
          merchant="Chicken Republic" 
          category="Food & Dining" 
          icon="utensils" 
          amount={4500} 
          type="debit" 
          date="Today, 2:30 PM" 
        />
        <TransactionItem 
          merchant="Salary Payment" 
          category="Salary" 
          icon="wallet" 
          amount={450000} 
          type="credit" 
          date="Yesterday" 
        />
      </Section>

      {/* Cards & Chips */}
      <Section title="Cards & Chips">
        <Card variant="elevated" style={{ marginBottom: 15 }}>
          <Text style={{ fontFamily: Typography.fonts.title, fontWeight: '700' }}>Elevated Card</Text>
          <Text style={{ marginTop: 5, color: theme.outline }}>This card has a subtle shadow.</Text>
        </Card>
        <View style={styles.row}>
          <Chip label="Selected" selected />
          <Chip label="Unselected" />
        </View>
      </Section>

      {/* Progress & Loading */}
      <Section title="Progress & Loading">
        <Text style={{ marginBottom: 5, fontSize: 12, color: theme.outline }}>Import Progress (65%)</Text>
        <ProgressBar progress={0.65} />
        <View style={{ marginTop: 20 }}>
          <TransactionSkeleton />
          <TransactionSkeleton />
        </View>
      </Section>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing[4],
  },
  header: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineL,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleS,
    fontWeight: '700',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
});
