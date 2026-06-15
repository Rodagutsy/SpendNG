import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, Alert, Animated } from 'react-native';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TransactionRecord } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useCategoryDefaultStore } from '@/lib/stores/categoryDefaultStore';
import { useTaxClassificationStore } from '@/lib/stores/taxClassificationStore';
import { TaxClassSheet } from '@/components/tax/TaxClassSheet';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface TransactionReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  onUpdate: (id: string, updates: Partial<TransactionRecord>) => Promise<void>;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#16a34a',
  medium: '#ec9600',
  low: '#dc2626',
};

export const TransactionReviewSheet: React.FC<TransactionReviewSheetProps> = ({
  visible,
  onClose,
  transaction,
  onUpdate,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { translateY, panResponder } = useSwipeToClose(onClose);
  const categories = useCategoryStore((s) => s.categories);
  const getDefaultForCategory = useCategoryDefaultStore((s) => s.getDefaultForCategory);
  const { classifications: taxClasses, getById: getTaxClassById } = useTaxClassificationStore();

  const [showClassSheet, setShowClassSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!transaction) return null;

  const confidence = transaction.confidenceLevel || 'low';
  const confidenceColor = CONFIDENCE_COLORS[confidence] || Colors.main.error;

  const currentCategory = categories.find((c) => c.id === transaction.categoryId);
  const currentTaxClass = getTaxClassById(transaction.taxClassificationId ?? '');

  const suggestedDefault = getDefaultForCategory(transaction.categoryId);
  const suggestedTaxClass = suggestedDefault?.defaultTaxClassificationId
    ? getTaxClassById(suggestedDefault.defaultTaxClassificationId)
    : null;
  const hasSuggestion = confidence !== 'high' && suggestedTaxClass && suggestedTaxClass.id !== transaction.taxClassificationId;

  const confidenceLabel = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';

  const description = confidence === 'high'
    ? 'Based on merchant history and pattern matching'
    : confidence === 'medium'
      ? 'Based on partial merchant match'
      : 'New merchant — needs manual review';

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onUpdate(transaction.id, { taxClassificationId: transaction.taxClassificationId });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUseSuggestion = async () => {
    if (!suggestedDefault) return;
    setSaving(true);
    try {
      await onUpdate(transaction.id, { taxClassificationId: suggestedDefault.defaultTaxClassificationId });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkIncorrect = async () => {
    setSaving(true);
    try {
      await onUpdate(transaction.id, { isFlaggedForReview: true });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleClassSelect = async (classId: string) => {
    setSaving(true);
    try {
      await onUpdate(transaction.id, { taxClassificationId: classId });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => {
        Animated.timing(translateY, {
          toValue: 2000,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onClose());
      }}>
        <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}>
          <View style={styles.handle} {...panResponder.panHandlers} />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {/* Section 1: Transaction Info */}
            <View style={styles.infoSection}>
              <Text style={[styles.merchantName, { color: theme.onSurface }]}>
                {transaction.merchantName || 'Unknown'}
              </Text>
              <Text style={[styles.amount, { color: transaction.transactionType === 'credit' ? Colors.main.success : Colors.main.error }]}>
                {transaction.transactionType === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
              </Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={14} color={theme.outline} />
                <Text style={[styles.infoText, { color: theme.outline }]}>
                  {new Date(transaction.transactionDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              {transaction.accountName && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="account-balance" size={14} color={theme.outline} />
                  <Text style={[styles.infoText, { color: theme.outline }]}>{transaction.accountName}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Section 2: Classification Block */}
            <Text style={[styles.sectionLabel, { color: theme.onSurface }]}>Classification</Text>

            <TouchableOpacity
              style={[styles.fieldRow, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}
              onPress={() => setShowClassSheet(true)}
              activeOpacity={0.7}
            >
              <View style={styles.fieldLeft}>
                <Text style={[styles.fieldLabel, { color: theme.outline }]}>Category</Text>
                <Text style={[styles.fieldValue, { color: theme.onSurface }]}>
                  {currentTaxClass?.name || transaction.taxClassificationId || 'Not set'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.outline} />
            </TouchableOpacity>

            <View style={[styles.confidenceRow, { backgroundColor: theme.surfaceContainerLow }]}>
              <View style={styles.confidenceLeft}>
                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.confidenceLabel, { color: theme.onSurface }]}>
                  Confidence: {confidenceLabel}
                </Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Confidence', description)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="info-outline" size={18} color={theme.outline} />
              </TouchableOpacity>
            </View>

            {/* Section 3: Suggested Improvement */}
            {hasSuggestion && (
              <View style={[styles.suggestionCard, { backgroundColor: Colors.main.primary + '0D', borderColor: Colors.main.primary + '33' }]}>
                <View style={styles.suggestionHeader}>
                  <MaterialIcons name="lightbulb-outline" size={16} color={Colors.main.primary} />
                  <Text style={[styles.suggestionTitle, { color: Colors.main.primary }]}>Suggested improvement</Text>
                </View>
                <Text style={[styles.suggestionText, { color: theme.outline }]}>
                  Suggested category: {suggestedTaxClass?.name}
                </Text>
                <Text style={[styles.suggestionText, { color: theme.outline }]}>
                  Reason: Similar past transactions
                </Text>
                <TouchableOpacity
                  style={[styles.useSuggestionBtn, { backgroundColor: Colors.main.primary }]}
                  onPress={handleUseSuggestion}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.useSuggestionBtnText}>Use suggestion</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider} />

            {/* Section 4: Actions */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.main.primary }]}
              onPress={handleConfirm}
              disabled={saving}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {confidence === 'high' ? 'Confirm' : 'Confirm classification'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.outlineVariant }]}
              onPress={() => setShowClassSheet(true)}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.onSurface }]}>Change category</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: Colors.main.error + '33' }]}
              onPress={handleMarkIncorrect}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: Colors.main.error }]}>Mark as incorrect</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>

      <TaxClassSheet
        visible={showClassSheet}
        onClose={() => setShowClassSheet(false)}
        onSelect={handleClassSelect}
        current={transaction.taxClassificationId}
        direction={transaction.transactionType === 'credit' ? 'income' : 'expense'}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[5],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
    maxHeight: '85%',
  },
  scrollArea: {
    flexGrow: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.outlineVariant,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing[4],
  },
  infoSection: {
    gap: 6,
    paddingBottom: Spacing[3],
  },
  merchantName: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
  },
  amount: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outlineVariant,
    marginVertical: Spacing[3],
  },
  sectionLabel: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    marginBottom: Spacing[2],
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing[2],
  },
  fieldLeft: {
    gap: 2,
    flex: 1,
  },
  fieldLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
  },
  confidenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
  },
  suggestionCard: {
    padding: Spacing[3],
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing[2],
    gap: 6,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionTitle: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  suggestionText: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
  },
  useSuggestionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  useSuggestionBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.full,
    gap: 8,
    marginBottom: Spacing[2],
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: Spacing[2],
  },
  secondaryBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
});
