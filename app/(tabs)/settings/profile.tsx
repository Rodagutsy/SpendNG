import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [editing, setEditing] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primaryContainer }]}>
          <IconSymbol name="person.fill" size={32} color={theme.primary} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.outline }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.onBackground, borderColor: theme.outlineVariant, backgroundColor: editing ? theme.surfaceContainerLow : theme.surface }]}
            value={name}
            onChangeText={setName}
            editable={editing}
            placeholder="Your name"
            placeholderTextColor={theme.outline}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.outline }]}>Email</Text>
          <TextInput
            style={[styles.input, { color: theme.onBackground, borderColor: theme.outlineVariant, backgroundColor: editing ? theme.surfaceContainerLow : theme.surface }]}
            value={email}
            onChangeText={setEmail}
            editable={editing}
            placeholder="Your email"
            placeholderTextColor={theme.outline}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => setEditing(!editing)}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>
            {editing ? 'Save Changes' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[6],
    paddingTop: Spacing[16],
    marginBottom: Spacing[4],
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: Spacing[6],
    borderRadius: Radius.lg,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[5],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: {
    width: '100%',
    gap: Spacing[1],
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
  },
  primaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
});
