import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUIStore } from '@/lib/stores/uiStore';

export default function ImportProgressScreen() {
  const router = useRouter();
  const importProgress = useUIStore((s) => s.importProgress);

  const found = importProgress?.found ?? 0;
  const processed = importProgress?.processed ?? 0;
  const isDone = found > 0 && processed >= found;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {isDone ? (
        <ActivityIndicator size="large" color="var(--sys-color-roles-on-primary-container)" />
      ) : (
        <ActivityIndicator size="large" color="var(--sys-color-roles-on-primary-container)" />
      )}
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>
        {found > 0 ? 'Building your history' : 'Setting up...'}
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>
        {found > 0
          ? `Found ${found} bank alerts · ${processed} processed`
          : 'No bank alerts found to import'}
      </Text>
      <Button title="Continue to SpendNG" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}
