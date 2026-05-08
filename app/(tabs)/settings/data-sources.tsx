import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function DataSourcesScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Data Sources</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>[Placeholder for SMS and Email Sources]</Text>
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
