import * as Keychain from 'react-native-keychain';
import { IngestionEngine } from './ingestion-engine';

const KEYCHAIN_SERVICE = 'spendng.gmail';

export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
}

export class EmailService {
  static readonly FINANCIAL_SENDERS = [
    'alerts@gtbank.com',
    'alerts@accessbankplc.com',
    'alert@firstbanknigeria.com',
    'alert@zenithbank.com',
    'alerts@ubagroup.com',
    'notifications@kuda.co',
    'alerts@opay.africa',
    'hello@grey.co',
    'notifications@geegpay.com',
    'transfers@lemfi.com',
  ];

  static async getStoredTokens(): Promise<GmailTokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (!credentials) return null;
      return JSON.parse(credentials.password) as GmailTokens;
    } catch {
      return null;
    }
  }

  static async storeTokens(tokens: GmailTokens): Promise<void> {
    await Keychain.setGenericPassword('gmail', JSON.stringify(tokens), { service: KEYCHAIN_SERVICE });
  }

  static async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  }

  static async pollNewEmails(accessToken: string): Promise<{ processed: number; failed: number }> {
    const senderQuery = this.FINANCIAL_SENDERS.map(s => `from:${s}`).join(' OR ');
    const after = new Date();
    after.setDate(after.getDate() - 30);
    const afterStr = after.toISOString().split('T')[0];
    const q = `(${senderQuery}) after:${afterStr}`;

    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=50`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`Gmail search failed (${searchRes.status}): ${err}`);
    }

    const searchData = await searchRes.json();
    const messages: Array<{ id: string; threadId: string }> = searchData.messages || [];
    if (messages.length === 0) return { processed: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const msg of messages) {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detailRes = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!detailRes.ok) {
        failed++;
        continue;
      }

      const detail = await detailRes.json();
      const { body, sender, timestamp } = this.extractEmailData(detail);

      if (!body || !sender) {
        failed++;
        continue;
      }

      const result = await IngestionEngine.processAlert(body, sender, timestamp, 'email');
      if (result.success) success++;
      else failed++;
    }

    return { processed: success, failed };
  }

  static isConnected(): Promise<boolean> {
    return this.getStoredTokens().then(t => t !== null);
  }

  private static extractEmailData(message: any): { body: string | null; sender: string | null; timestamp: number } {
    const headers = message.payload?.headers || [];
    const from = headers.find((h: any) => h.name === 'From')?.value || null;
    const date = headers.find((h: any) => h.name === 'Date')?.value || null;
    const sender = from ? this.extractSenderAddress(from) : null;
    const timestamp = date ? new Date(date).getTime() : Date.now();
    const body = this.getEmailBody(message.payload);
    return { body, sender, timestamp };
  }

  private static extractSenderAddress(from: string): string | null {
    const match = from.match(/<([^>]+)>/) || from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : null;
  }

  private static getEmailBody(payload: any): string | null {
    if (payload?.body?.data) {
      return decodeBase64Url(payload.body.data);
    }
    if (payload?.parts) {
      for (const part of payload.parts) {
        const body = this.getEmailBody(part);
        if (body) return body;
      }
    }
    return null;
  }
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}
