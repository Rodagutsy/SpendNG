import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore, CategoryRecord } from '@/lib/stores/categoryStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RecategorizationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { showAlert } = useAlert();
  const { transactions, updateCategory } = useTransactionStore();
  const { categories, loading, fetchCategories } = useCategoryStore();

  const [saving, setSaving] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  const transaction = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);
  const currentCategoryId = transaction?.categoryId;

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  const handleSelect = async (categoryId: string) => {
    if (categoryId === currentCategoryId) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await updateCategory(id, categoryId);
      if (applyToAll && transaction?.merchantName) {
        const sameMerchant = transactions.filter(
          (t) => t.id !== id && t.merchantName === transaction.merchantName && t.categoryId !== categoryId,
        );
        await Promise.all(sameMerchant.map((t) => updateCategory(t.id, categoryId)));
      }
      router.back();
    } catch (err: any) {
      showAlert({ title: 'Error', message: err?.message || 'Failed to update category. Please try again.' });
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: CategoryRecord }) => {
    const isSelected = item.id === currentCategoryId;
    const isDisabled = saving;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { backgroundColor: theme.surface },
          isSelected && { backgroundColor: theme.primaryContainer },
        ]}
        onPress={() => handleSelect(item.id)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: `${item.colorHex}26` }]}>
          <IconSymbol name={item.iconIdentifier as any} size={22} color={item.colorHex} />
        </View>
        <Text
          style={[
            styles.categoryName,
            { color: theme.onBackground },
            isSelected && { color: theme.onPrimaryContainer, fontWeight: '700' },
          ]}
        >
          {item.name}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
            <IconSymbol name="checkmark" size={14} color={theme.onPrimary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2], backgroundColor: theme.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <IconSymbol name="plus" size={24} color={theme.onBackground} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Edit Category</Text>
          <View style={styles.headerBtn} />
        </View>
        {transaction?.merchantName ? (
          <Text style={[styles.merchantLabel, { color: theme.outline }]}>
            {transaction.merchantName}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing[2] }} />}
        />
      )}

      {/* Apply to all similar */}
      {transaction?.merchantName ? (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.outlineVariant }]}>
          <View style={styles.applyRow}>
            <View style={styles.applyTextContainer}>
              <Text style={[styles.applyLabel, { color: theme.onBackground }]}>Apply to all similar</Text>
              <Text style={[styles.applySubtitle, { color: theme.outline }]}>
                Update all transactions from &quot;{transaction.merchantName}&quot;
              </Text>
            </View>
            <Switch
              value={applyToAll}
              onValueChange={setApplyToAll}
              trackColor={{ false: theme.outlineVariant, true: theme.primary }}
              thumbColor={theme.surface}
            />
          </View>
        </View>
      ) : null}
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
    paddingBottom: Spacing[3],
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
  merchantLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[1],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    height: 60,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  categoryName: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    paddingBottom: Spacing[8],
    borderTopWidth: 1,
  },
  applyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyTextContainer: {
    flex: 1,
    marginRight: Spacing[4],
  },
  applyLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    fontWeight: '600',
  },
  applySubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: 2,
  },
});
