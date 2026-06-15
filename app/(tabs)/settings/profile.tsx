import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/TextInput';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setEmail(user.email || '');
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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

        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.outline, borderColor: theme.surfaceContainerLow }]}
          label="Name"
          value={name}
          onChangeText={setName}
          editable={editing}
          placeholder="Your name"
        />

        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.outline, borderColor: theme.surfaceContainerLow }]}
          label="Email"
          value={email}
          editable={false}
          placeholder="Your email"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={() => editing ? handleSave() : setEditing(true)}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit'}
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
    marginTop: Spacing[10],
    marginBottom: Spacing[2],
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
  },
  card: {
    marginHorizontal: Spacing[6],
    borderRadius: Radius.sm,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[1],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 24,
    justifyContent: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
});
