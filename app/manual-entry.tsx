import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { format } from 'date-fns';

export default function ManualEntryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');

  const handleSave = () => {
    // Logic to save transaction would go here
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <IconSymbol name="plus" size={24} color={theme.onBackground} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveBtn, { color: theme.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.label, { color: theme.outline }]}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={[styles.currency, { color: theme.onBackground }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.onBackground }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputGroup, { borderBottomColor: theme.outlineVariant }]}>
            <Text style={[styles.inputLabel, { color: theme.outline }]}>Merchant / Payee</Text>
            <TextInput
              style={[styles.textInput, { color: theme.onBackground }]}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Where did you spend?"
              placeholderTextColor={theme.outline}
            />
          </View>

          <TouchableOpacity style={[styles.inputGroup, { borderBottomColor: theme.outlineVariant }]}>
            <View>
              <Text style={[styles.inputLabel, { color: theme.outline }]}>Category</Text>
              <Text style={[styles.inputText, { color: theme.onBackground }]}>{category}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={theme.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.inputGroup, { borderBottomColor: theme.outlineVariant }]}>
            <View>
              <Text style={[styles.inputLabel, { color: theme.outline }]}>Date</Text>
              <Text style={[styles.inputText, { color: theme.onBackground }]}>{format(date, 'MMMM dd, yyyy')}</Text>
            </View>
            <IconSymbol name="plus" size={16} color={theme.outline} />
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.outline }]}>Notes</Text>
            <TextInput
              style={[styles.textInput, { color: theme.onBackground }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={theme.outline}
              multiline
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[12],
    paddingBottom: Spacing[6],
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 18,
    fontWeight: '600',
  },
  saveBtn: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing[10],
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    marginBottom: Spacing[2],
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
  },
  form: {
    paddingHorizontal: Spacing[6],
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[5],
    borderBottomWidth: 1,
  },
  inputLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    marginBottom: 4,
  },
  inputText: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
