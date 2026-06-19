import { PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

export interface SmsMessage {
  body: string;
  address: string;
  date: number;
}

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

export async function importHistoricalSms(minDate?: number, maxCount?: number): Promise<SmsMessage[]> {
  const granted = await requestSmsPermission();
  if (!granted) return [];

  return new Promise((resolve, reject) => {
    const filter = {
      box: 'inbox',
      minDate: minDate ?? Date.now() - 180 * 24 * 60 * 60 * 1000,
      maxCount: maxCount ?? 500,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (err: string) => reject(err),
      (_count: number, smsList: string) => {
        const messages: SmsMessage[] = JSON.parse(smsList);
        resolve(messages);
      },
    );
  });
}
