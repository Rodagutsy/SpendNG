import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { TextInput } from '@/components/ui/TextInput';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaxProfileStore } from '@/lib/stores/taxProfileStore';
import type { IncomeStream } from '@/lib/tax-engine';

const INCOME_STREAM_OPTIONS: { id: IncomeStream; label: string; desc: string }[] = [
  { id: 'employment_paye', label: 'Salaried (PAYE)', desc: 'Monthly salary with employer PAYE' },
  { id: 'freelance', label: 'Freelancer', desc: 'Local or foreign client contracts' },
  { id: 'content_creator', label: 'Content Creator', desc: 'YouTube, TikTok, Meta, brand deals' },
  { id: 'sole_proprietor', label: 'Small Business', desc: 'Business Name / unregistered trade' },
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const parseOptionalNum = (val: string): number | null => {
  const cleaned = val.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export default function TaxProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();

  const { profile, fetchProfileAndAssets, saveProfile } = useTaxProfileStore();

  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>(profile.incomeStreams);
  const [stateOfResidence, setStateOfResidence] = useState(profile.stateOfResidence);
  const [taxId, setTaxId] = useState(profile.taxId ?? '');
  const [isTenant, setIsTenant] = useState(profile.isTenant);
  const [annualRent, setAnnualRent] = useState(profile.annualRentOverride?.toString() ?? '');
  const [payeDeducted, setPayeDeducted] = useState(profile.payeDeductedOverride?.toString() ?? '');
  const [pension, setPension] = useState(profile.pensionOverride?.toString() ?? '');
  const [nhf, setNhf] = useState(profile.nhfOverride?.toString() ?? '');
  const [nhis, setNhis] = useState(profile.nhisOverride?.toString() ?? '');
  const [lifeAssurance, setLifeAssurance] = useState(profile.lifeAssuranceOverride?.toString() ?? '');
  const [mortgageInterest, setMortgageInterest] = useState(profile.mortgageInterestOverride?.toString() ?? '');
  const [showOverrides, setShowOverrides] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfileAndAssets();
  }, [fetchProfileAndAssets]);

  useEffect(() => {
    setIncomeStreams(profile.incomeStreams);
    setStateOfResidence(profile.stateOfResidence);
    setTaxId(profile.taxId ?? '');
    setIsTenant(profile.isTenant);
    setAnnualRent(profile.annualRentOverride?.toString() ?? '');
    setPayeDeducted(profile.payeDeductedOverride?.toString() ?? '');
    setPension(profile.pensionOverride?.toString() ?? '');
    setNhf(profile.nhfOverride?.toString() ?? '');
    setNhis(profile.nhisOverride?.toString() ?? '');
    setLifeAssurance(profile.lifeAssuranceOverride?.toString() ?? '');
    setMortgageInterest(profile.mortgageInterestOverride?.toString() ?? '');
  }, [profile]);

  const toggleStream = (id: IncomeStream) => {
    setIncomeStreams((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((s) => s !== id)
          : prev
        : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        incomeStreams,
        stateOfResidence,
        taxId: taxId.trim() || null,
        isTenant,
        annualRentOverride: parseOptionalNum(annualRent),
        payeDeductedOverride: parseOptionalNum(payeDeducted),
        pensionOverride: parseOptionalNum(pension),
        nhfOverride: parseOptionalNum(nhf),
        nhisOverride: parseOptionalNum(nhis),
        lifeAssuranceOverride: parseOptionalNum(lifeAssurance),
        mortgageInterestOverride: parseOptionalNum(mortgageInterest),
      });
      showAlert({ title: 'Saved', message: 'Tax profile updated.' });
      router.back();
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Could not save tax profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Tax Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Income Streams</Text>
          <Text style={[styles.sectionDesc, { color: theme.outline }]}>
            Select all that apply. Nigerian PIT combines all your income onto one annual return (NTAA s. 13).
          </Text>
          <View style={styles.streamList}>
            {INCOME_STREAM_OPTIONS.map((opt) => {
              const active = incomeStreams.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.streamRow,
                    {
                      borderColor: active ? Colors.main.primary : theme.outlineVariant,
                      backgroundColor: active ? Colors.main.primary + '0F' : 'transparent',
                    },
                  ]}
                  onPress={() => toggleStream(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.streamText}>
                    <Text style={[styles.streamLabel, { color: theme.onSurface }]}>{opt.label}</Text>
                    <Text style={[styles.streamDesc, { color: theme.outline }]}>{opt.desc}</Text>
                  </View>
                  <MaterialIcons
                    name={active ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={active ? Colors.main.primary : theme.outline}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Registration & Residence</Text>

          <TouchableOpacity
            style={[styles.pickerRow, { borderColor: theme.outlineVariant }]}
            onPress={() => setShowStatePicker(true)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.pickerLabel, { color: theme.outline }]}>State of Residence (State IRS)</Text>
              <Text style={[styles.pickerValue, { color: theme.onSurface }]}>{stateOfResidence}</Text>
            </View>
            <MaterialIcons name="expand-more" size={22} color={theme.outline} />
          </TouchableOpacity>

          <TextInput
            label="Tax ID / NIN (NTAA s. 4)"
            value={taxId}
            onChangeText={setTaxId}
            placeholder="11-digit NIN or State Tax ID"
            keyboardType="default"
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Rent Relief (NTA s. 30)</Text>
              <Text style={[styles.sectionDesc, { color: theme.outline }]}>
                Tenants can deduct 20% of annual rent paid, capped at ₦500,000.
              </Text>
            </View>
            <Switch
              value={isTenant}
              onValueChange={setIsTenant}
              trackColor={{ false: theme.outlineVariant, true: Colors.main.primary + '80' }}
              thumbColor={isTenant ? Colors.main.primary : theme.outline}
            />
          </View>

          {isTenant && (
            <TextInput
              label="Annual Rent Paid Override (₦, optional)"
              value={annualRent}
              onChangeText={setAnnualRent}
              placeholder="Leave blank to sum rent transactions"
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.collapseHeader}
            onPress={() => setShowOverrides(!showOverrides)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Deduction & PAYE Overrides</Text>
              <Text style={[styles.sectionDesc, { color: theme.outline }]}>
                Optional — leave blank to compute from classified transactions.
              </Text>
            </View>
            <MaterialIcons name={showOverrides ? 'expand-less' : 'expand-more'} size={22} color={theme.outline} />
          </TouchableOpacity>

          {showOverrides && (
            <View style={{ marginTop: Spacing[3], gap: Spacing[2] }}>
              <TextInput label="PAYE Deducted by Employer (₦)" value={payeDeducted} onChangeText={setPayeDeducted} keyboardType="numeric" placeholder="0" />
              <TextInput label="Pension Contribution (PRA) (₦)" value={pension} onChangeText={setPension} keyboardType="numeric" placeholder="0" />
              <TextInput label="National Housing Fund (NHF) (₦)" value={nhf} onChangeText={setNhf} keyboardType="numeric" placeholder="0" />
              <TextInput label="Health Insurance / HMO (₦)" value={nhis} onChangeText={setNhis} keyboardType="numeric" placeholder="0" />
              <TextInput label="Life Assurance / Annuity (₦)" value={lifeAssurance} onChangeText={setLifeAssurance} keyboardType="numeric" placeholder="0" />
              <TextInput label="Owner-Occupied Mortgage Interest (₦)" value={mortgageInterest} onChangeText={setMortgageInterest} keyboardType="numeric" placeholder="0" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.main.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: Colors.light.onPrimary }]}>
            {saving ? 'Saving…' : 'Save Tax Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showStatePicker} transparent animationType="slide" onRequestClose={() => setShowStatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Select State of Residence</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <MaterialIcons name="close" size={22} color={theme.outline} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={NIGERIAN_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.stateRow, { borderBottomColor: theme.outlineVariant }]}
                  onPress={() => {
                    setStateOfResidence(item);
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[styles.stateText, { color: theme.onSurface }]}>{item}</Text>
                  {stateOfResidence === item && <MaterialIcons name="check" size={20} color={Colors.main.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
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
    fontSize: 18,
  },
  card: {
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[4],
    borderRadius: Radius.sm,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  sectionTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  sectionDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  streamList: { gap: Spacing[2], marginTop: Spacing[1] },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing[3],
    gap: Spacing[2],
  },
  streamText: { flex: 1, gap: 2 },
  streamLabel: { fontFamily: Typography.fonts.medium, fontSize: 14 },
  streamDesc: { fontFamily: Typography.fonts.body, fontSize: 12 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    marginTop: Spacing[1],
    marginBottom: Spacing[2],
  },
  pickerLabel: { fontFamily: Typography.fonts.body, fontSize: 11 },
  pickerValue: { fontFamily: Typography.fonts.medium, fontSize: 14, marginTop: 2 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  saveBtn: {
    marginHorizontal: Spacing[5],
    height: 48,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: Spacing[5],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  stateText: { fontFamily: Typography.fonts.body, fontSize: 14 },
});

