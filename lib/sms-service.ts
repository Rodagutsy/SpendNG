import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { IngestionEngine } from './ingestion-engine';

const { SMSModule } = NativeModules;
let smsEventEmitter: NativeEventEmitter | null = null;
if (Platform.OS === 'android' && SMSModule) {
  try {
    smsEventEmitter = new NativeEventEmitter(SMSModule);
  } catch {
    console.warn('SpendNG: SMSModule native emitter not available');
  }
}
const KEYCHAIN_SMS = 'spendng.sms';

export interface SMSConnectionStatus {
  hasPermissions: boolean;
  monitoring: boolean;
  grantedAt: number | null;
  lastScanTimestamp: number | null;
}

export class SMSService {
  private static async readStorage(): Promise<Record<string, any>> {
    try {
      const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SMS });
      if (creds) return JSON.parse(creds.password);
    } catch {}
    return {};
  }

  private static async updateStorage(partial: Record<string, any>): Promise<void> {
    const existing = await this.readStorage();
    const merged = { ...existing, ...partial };
    await Keychain.setGenericPassword('sms', JSON.stringify(merged), { service: KEYCHAIN_SMS });
  }

  static async getConnectionStatus(): Promise<SMSConnectionStatus> {
    const data = await this.readStorage();
    if (data.monitoring !== undefined) {
      return {
        hasPermissions: true,
        monitoring: data.monitoring ?? true,
        grantedAt: data.grantedAt ?? null,
        lastScanTimestamp: data.lastScanTimestamp ?? null,
      };
    }
    return { hasPermissions: false, monitoring: false, grantedAt: null, lastScanTimestamp: null };
  }

  static async isConnected(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const status = await this.getConnectionStatus();
    return status.hasPermissions;
  }

  static async getLastScanTimestamp(): Promise<number | null> {
    const status = await this.getConnectionStatus();
    return status.lastScanTimestamp;
  }

  static async saveLastScanTimestamp(timestamp: number): Promise<void> {
    await this.updateStorage({ lastScanTimestamp: timestamp });
  }

  private static async storeConnected(grantedAt: number): Promise<void> {
    await this.updateStorage({ monitoring: true, grantedAt, lastScanTimestamp: grantedAt });
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

  static async scanInbox(startDate?: number, endDate?: number) {
    if (Platform.OS !== 'android') return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('SpendNG: SMS permissions not granted for inbox scan');
      return;
    }

    try {
      const resolvedEnd = endDate ?? Date.now();
      const resolvedStart = startDate ?? 0;
      const messages = await SMSModule.getInboxMessages(resolvedStart, resolvedEnd);
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

      await this.saveLastScanTimestamp(resolvedEnd);

      return { scanned: messages.length, alertsFound: alerts.length, ...result };
    } catch (e) {
      console.error('SpendNG: Error scanning inbox', e);
      return { scanned: 0, alertsFound: 0, success: 0, failed: 0 };
    }
  }

  static async rescanMissedAlerts(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const connected = await this.isConnected();
    if (!connected) return;

    const lastScan = await this.getLastScanTimestamp();
    if (lastScan !== null) {
      console.log(`SpendNG: Re-scanning missed alerts since ${new Date(lastScan).toISOString()}`);
      await this.scanInbox(lastScan, Date.now());
    }
  }

  static async requestAndScan(startDate?: number, endDate?: number): Promise<{
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
    const scanResult = await this.scanInbox(startDate, endDate);

    return { permissionsGranted: true, scanResult };
  }

  static async onMessageReceived(body: string, sender: string, timestamp: number) {
    await IngestionEngine.processAlert(body, sender, timestamp, 'sms');
  }
}
