import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function DeleteAccountScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 20 }}>Delete Account</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>Are you sure you want to delete your account? This cannot be undone.</Text>
      <Button title="Delete Everything" color="red" onPress={() => {}} />
      <View style={{ marginTop: 20 }}>
        <Button title="Cancel" onPress={() => router.back()} />
      </View>
    </View>
  );
}
