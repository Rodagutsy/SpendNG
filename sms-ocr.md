Step 3: SMS — write the code
Historical import (onboarding)
Create lib/sms-import.ts:
tsimport { PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

export async function requestSmsPermission(): Promise<boolean> {
  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);
  return (
    result['android.permission.READ_SMS'] === 'granted' &&
    result['android.permission.RECEIVE_SMS'] === 'granted'
  );
}

export async function importHistoricalSms(): Promise<string[]> {
  const granted = await requestSmsPermission();
  if (!granted) return [];

  return new Promise((resolve, reject) => {
    const filter = {
      box: 'inbox',
      minDate: Date.now() - 180 * 24 * 60 * 60 * 1000, // last 6 months
      maxCount: 500,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (err: string) => reject(err),
      (_count: number, smsList: string) => {
        const messages: Array<{ body: string; address: string; date: number }> =
          JSON.parse(smsList);
        resolve(messages.map((m) => m.body));
      }
    );
  });
}
Then in your onboarding screen (app/(onboarding)/connect-source), call it:
tsimport { importHistoricalSms } from '@/lib/sms-import';
import { parseTransaction } from '@/lib/parser';

const bodies = await importHistoricalSms();
const parsed = bodies
  .map(parseTransaction)
  .filter(Boolean); // filter out nulls from failed parses
// then batch insert parsed to Supabase
Live listener (background, after onboarding)
In your root layout or a persistent provider, add this once after session is confirmed:
tsimport {
  startReadSMS,
  checkIfHasSMSPermission,
} from '@maniac-tech/react-native-expo-read-sms';

export async function startSmsListener(onNewTransaction: (body: string) => void) {
  const hasPermission = await checkIfHasSMSPermission();
  if (!hasPermission) return;

  startReadSMS(
    (address: string, body: string) => {
      onNewTransaction(body);
    },
    (error: string) => {
      console.warn('SMS listener error:', error);
    }
  );
}