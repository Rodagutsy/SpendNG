declare module '@maniac-tech/react-native-expo-read-sms' {
  export function checkIfHasSMSPermission(): Promise<boolean>;
  export function requestReadSMSPermission(): Promise<boolean>;
  export function startReadSMS(
    onSuccess: (status: string, sms: string, error?: string) => void,
    onError: (error: string) => void,
  ): void;
  export function stopReadSMS(): void;
}

declare module 'react-native-get-sms-android' {
  const SmsAndroid: {
    list(
      filter: string,
      fail: (err: string) => void,
      success: (count: number, smsList: string) => void,
    ): void;
  };
  export default SmsAndroid;
}

