import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Settings</Text>
      <View style={{ gap: 10 }}>
        <Button title="Data Sources" onPress={() => router.push('/(tabs)/settings/data-sources')} />
        <Button title="Account" onPress={() => router.push('/(tabs)/settings/account')} />
        <Button title="Delete Account" color="red" onPress={() => router.push('/(tabs)/settings/delete-account')} />
      </View>
    </View>
  );
}
