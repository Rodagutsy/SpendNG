import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore, CategoryRecord } from '@/lib/stores/categoryStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

type DatePreset = 'all' | 'today' | 'week' | 'month';

function getDateRange(preset: DatePreset): { startDate?: number; endDate?: number } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { startDate: startOfDay(now).getTime(), endDate: endOfDay(now).getTime() };
    case 'week':
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }).getTime(), endDate: endOfDay(now).getTime() };
    case 'month':
      return { startDate: startOfMonth(now).getTime(), endDate: endOfDay(now).getTime() };
    default:
      return {};
  }
}

export default function FilterPanelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { filters, setFilters, clearFilters } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [selectedType, setSelectedType] = useState<'all' | 'credit' | 'debit'>(filters.transactionType ?? 'all');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(filters.categoryId);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [keyword, setKeyword] = useState(filters.keyword ?? '');

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  const typeOptions: { label: string; value: 'all' | 'credit' | 'debit' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Credit', value: 'credit' },
    { label: 'Debit', value: 'debit' },
  ];

  const datePresets: { label: string; value: DatePreset }[] = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  const handleApply = () => {
    const dateRange = getDateRange(datePreset);
    const newFilters: any = { ...dateRange };
    if (selectedType !== 'all') {
      newFilters.transactionType = selectedType;
    }
    if (selectedCategory) {
      newFilters.categoryId = selectedCategory;
    }
    if (keyword.trim()) {
      newFilters.keyword = keyword.trim();
    }
    setFilters(newFilters);
    router.back();
  };

  const handleClear = () => {
    clearFilters();
    setSelectedType('all');
    setSelectedCategory(undefined);
    setDatePreset('all');
    setKeyword('');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2], backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <IconSymbol name="plus" size={24} color={theme.onBackground} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Filters</Text>
          <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
            <Text style={[styles.clearText, { color: theme.error }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Transaction Type</Text>
          <View style={styles.typeRow}>
            {typeOptions.map((opt) => {
              const isActive = selectedType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typeBtn,
                    { backgroundColor: theme.ripple },
                    isActive && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedType(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: theme.onBackground },
                      isActive && { color: theme.onPrimary, fontWeight: '600' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { backgroundColor: theme.ripple },
                !selectedCategory && { backgroundColor: theme.primary },
              ]}
              onPress={() => setSelectedCategory(undefined)}
            >
              <Text style={[styles.categoryChipText, { color: theme.onBackground }, !selectedCategory && { color: theme.onPrimary, fontWeight: '600' }]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.ripple },
                    isActive && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedCategory(isActive ? undefined : cat.id)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name={cat.iconIdentifier as any} size={16} color={isActive ? theme.onPrimary : cat.colorHex} />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: theme.onBackground },
                      isActive && { color: theme.onPrimary, fontWeight: '600' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Date Range Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Date Range</Text>
          <View style={styles.dateRow}>
            {datePresets.map((preset) => {
              const isActive = datePreset === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.dateBtn,
                    { backgroundColor: theme.ripple },
                    isActive && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setDatePreset(preset.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateBtnText,
                      { color: theme.onBackground },
                      isActive && { color: theme.onPrimary, fontWeight: '600' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Keyword Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.onBackground }]}>Keyword</Text>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
            <IconSymbol name="magnifyingglass" size={18} color={theme.outline} />
            <TextInput
              style={[styles.searchInput, { color: theme.onBackground }]}
              placeholder="Search by merchant name..."
              placeholderTextColor={theme.outline}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
            />
            {keyword ? (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <IconSymbol name="plus" size={18} color={theme.outline} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.outlineVariant }]}>
        <TouchableOpacity onPress={handleClear} style={[styles.footerBtn, { borderColor: theme.outline }]}>
          <Text style={[styles.footerBtnText, { color: theme.onBackground }]}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleApply} style={[styles.footerBtn, styles.applyBtn, { backgroundColor: theme.primary }]}>
          <Text style={[styles.footerBtnText, { color: theme.onPrimary, fontWeight: '600' }]}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    height: 56,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.titleM,
    fontWeight: '600',
  },
  clearText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  scrollContent: {
    paddingBottom: Spacing[8],
  },
  section: {
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[6],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.title,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
    marginBottom: Spacing[3],
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  typeBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.full,
    marginRight: Spacing[2],
  },
  categoryChipText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  dateBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.sm,
  },
  dateBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    height: 48,
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing[4],
    gap: Spacing[3],
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  applyBtn: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonL,
  },
});
