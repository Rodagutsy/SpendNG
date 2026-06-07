import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import { IngestionEngine } from './ingestion-engine';

const { SMSModule } = NativeModules;
const smsEventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(SMSModule) : null;

export class SMSService {
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
        }
      );
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Read Permission',
          message: 'SpendNG needs permission to read existing SMS to scan your inbox.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
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
      
      for (const msg of messages) {
        await IngestionEngine.processAlert(msg.body, msg.sender, msg.timestamp, 'sms');
      }
    } catch (e) {
      console.error('SpendNG: Error scanning inbox', e);
    }
  }

  static async onMessageReceived(body: string, sender: string, timestamp: number) {
    await IngestionEngine.processAlert(body, sender, timestamp, 'sms');
  }
}
