import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { IngestionEngine } from './ingestion-engine';

const { SMSModule } = NativeModules;
const smsEventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(SMSModule) : null;
const KEYCHAIN_SMS = 'spendng.sms';

export interface SMSConnectionStatus {
  hasPermissions: boolean;
  monitoring: boolean;
  grantedAt: number | null;
}

export class SMSService {
  static async getConnectionStatus(): Promise<SMSConnectionStatus> {
    try {
      const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SMS });
      if (creds) {
        const data = JSON.parse(creds.password);
        return { hasPermissions: true, monitoring: data.monitoring ?? true, grantedAt: data.grantedAt ?? null };
      }
    } catch {}
    return { hasPermissions: false, monitoring: false, grantedAt: null };
  }

  static async isConnected(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const status = await this.getConnectionStatus();
    return status.hasPermissions;
  }

  private static async storeConnected(grantedAt: number): Promise<void> {
    await Keychain.setGenericPassword(
      'sms',
      JSON.stringify({ monitoring: true, grantedAt }),
      { service: KEYCHAIN_SMS },
    );
  }

  static async clearConnection(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SMS });
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      const receiveGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'SMS Permission',
          message: 'SpendNG needs permission to receive SMS to automatically parse transactions.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Read Permission',
          message: 'SpendNG needs permission to read existing SMS to scan your inbox.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return (
        receiveGranted === PermissionsAndroid.RESULTS.GRANTED &&
        readGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  static async startMonitoring() {
    if (Platform.OS !== 'android') return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('SpendNG: SMS permissions not granted');
      return;
    }

    if (smsEventEmitter) {
      smsEventEmitter.addListener('onSMSReceived', async (event) => {
        const { body, sender, timestamp } = event;
        console.log(`SpendNG: Native SMS received from ${sender}`);
        await this.onMessageReceived(body, sender, timestamp);
      });
      console.log('SpendNG: SMS Monitoring started (onSMSReceived listener active)');
    }
  }

  static async scanInbox() {
    if (Platform.OS !== 'android') return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('SpendNG: SMS permissions not granted for inbox scan');
      return;
    }

    try {
      const messages = await SMSModule.getInboxMessages();
      console.log(`SpendNG: Fetched ${messages.length} messages from inbox`);

      const alerts = messages
        .filter((msg: any) => IngestionEngine.isTransactionAlert(msg.body))
        .map((msg: any) => ({
          body: msg.body,
          sender: msg.sender,
          timestamp: msg.timestamp,
          sourceChannel: 'sms' as const,
        }));

      const result = await IngestionEngine.processBatch(alerts);
      return { scanned: messages.length, alertsFound: alerts.length, ...result };
    } catch (e) {
      console.error('SpendNG: Error scanning inbox', e);
      return { scanned: 0, alertsFound: 0, success: 0, failed: 0 };
    }
  }

  static async requestAndScan(): Promise<{
    permissionsGranted: boolean;
    scanResult?: { scanned: number; alertsFound: number; success: number; failed: number };
  }> {
    if (Platform.OS !== 'android') {
      return { permissionsGranted: false };
    }

    const granted = await this.requestPermissions();
    if (!granted) {
      return { permissionsGranted: false };
    }

    await this.storeConnected(Date.now());
    await this.startMonitoring();
    const scanResult = await this.scanInbox();

    return { permissionsGranted: true, scanResult };
  }

  static async onMessageReceived(body: string, sender: string, timestamp: number) {
    await IngestionEngine.processAlert(body, sender, timestamp, 'sms');
  }
}
