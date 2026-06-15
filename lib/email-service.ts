import * as Keychain from 'react-native-keychain';
import { IngestionEngine } from './ingestion-engine';

const KEYCHAIN_PREFIX = 'spendng.gmail';
const ACCOUNTS_LIST_KEY = 'spendng.gmail.accounts';

export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  expiryTime?: number;
}

interface StoredAccount {
  tokens: GmailTokens;
  lastScanTimestamp: number;
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

  private static keyForEmail(email: string): string {
    return `${KEYCHAIN_PREFIX}:${email}`;
  }

  private static async getAccountList(): Promise<string[]> {
    try {
      const creds = await Keychain.getGenericPassword({ service: ACCOUNTS_LIST_KEY });
      if (!creds) return [];
      return JSON.parse(creds.password) as string[];
    } catch {
      return [];
    }
  }

  private static async saveAccountList(emails: string[]): Promise<void> {
    await Keychain.setGenericPassword('accounts', JSON.stringify(emails), { service: ACCOUNTS_LIST_KEY });
  }

  static async getAccountEmail(accessToken: string): Promise<string | null> {
    try {
      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.emailAddress || null;
    } catch {
      return null;
    }
  }

  static async connectAccount(tokens: GmailTokens): Promise<string | null> {
    const email = tokens.email || await this.getAccountEmail(tokens.accessToken);
    if (!email) return null;

    await this.storeAccount(email, { tokens, lastScanTimestamp: Date.now() });

    const accounts = await this.getAccountList();
    if (!accounts.includes(email)) {
      accounts.push(email);
      await this.saveAccountList(accounts);
    }

    return email;
  }

  private static async storeAccount(email: string, data: StoredAccount): Promise<void> {
    const key = this.keyForEmail(email);
    await Keychain.setGenericPassword('gmail', JSON.stringify(data), { service: key });
  }

  private static async readAccount(email: string): Promise<StoredAccount | null> {
    try {
      const creds = await Keychain.getGenericPassword({ service: this.keyForEmail(email) });
      if (creds) return JSON.parse(creds.password) as StoredAccount;
    } catch {}
    return null;
  }

  static async getLastScanTimestamp(email: string): Promise<number | null> {
    const account = await this.readAccount(email);
    return account?.lastScanTimestamp ?? null;
  }

  static async saveLastScanTimestamp(email: string, timestamp: number): Promise<void> {
    const account = await this.readAccount(email);
    if (account) {
      account.lastScanTimestamp = timestamp;
      await this.storeAccount(email, account);
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiryTime: number } | null> {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.access_token) return null;
      const expiryTime = Date.now() + (data.expires_in || 3600) * 1000;
      return { accessToken: data.access_token, expiryTime };
    } catch {
      return null;
    }
  }

  private static async getValidAccessToken(email: string, tokens: GmailTokens): Promise<string | null> {
    if (!tokens.refreshToken) return tokens.accessToken;

    if (tokens.expiryTime && Date.now() < tokens.expiryTime) {
      return tokens.accessToken;
    }

    const refreshed = await this.refreshAccessToken(tokens.refreshToken);
    if (!refreshed) return null;

    tokens.accessToken = refreshed.accessToken;
    tokens.expiryTime = refreshed.expiryTime;
    await this.storeAccount(email, { tokens, lastScanTimestamp: await this.getLastScanTimestamp(email) ?? Date.now() });
    return refreshed.accessToken;
  }

  static async getConnectedAccounts(): Promise<{ email: string; tokens: GmailTokens }[]> {
    const emails = await this.getAccountList();
    const results: { email: string; tokens: GmailTokens }[] = [];

    for (const email of emails) {
      const account = await this.readAccount(email);
      if (account) {
        results.push({ email, tokens: account.tokens });
      }
    }

    return results;
  }

  static async removeAccount(email: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: this.keyForEmail(email) });
    const accounts = await this.getAccountList();
    const filtered = accounts.filter((e) => e !== email);
    if (filtered.length !== accounts.length) {
      await this.saveAccountList(filtered);
    }
  }

  static async pollAccount(accessToken: string, email?: string, since?: number): Promise<{ processed: number; failed: number }> {
    const senderQuery = this.FINANCIAL_SENDERS.map((s) => `from:${s}`).join(' OR ');

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const afterStr = sinceDate.toISOString().split('T')[0];
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
    if (messages.length === 0) {
      if (email) await this.saveLastScanTimestamp(email, Date.now());
      return { processed: 0, failed: 0 };
    }

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

    if (email) await this.saveLastScanTimestamp(email, Date.now());

    return { processed: success, failed };
  }

  static async pollAllAccounts(): Promise<{ processed: number; failed: number; accounts: number }> {
    const accounts = await this.getConnectedAccounts();
    let totalProcessed = 0;
    let totalFailed = 0;

    for (const { email, tokens } of accounts) {
      try {
        const validToken = await this.getValidAccessToken(email, tokens);
        if (!validToken) {
          totalFailed += 1;
          continue;
        }
        const lastScan = await this.getLastScanTimestamp(email);
        const result = await this.pollAccount(validToken, email, lastScan ?? undefined);
        totalProcessed += result.processed;
        totalFailed += result.failed;
      } catch (e) {
        console.warn(`Failed to poll account:`, e);
        totalFailed += 1;
      }
    }

    return { processed: totalProcessed, failed: totalFailed, accounts: accounts.length };
  }

  static isConnected(): Promise<boolean> {
    return this.getAccountList().then((list) => list.length > 0);
  }

  static async getStoredTokens(): Promise<GmailTokens | null> {
    const accounts = await this.getConnectedAccounts();
    return accounts.length > 0 ? accounts[0].tokens : null;
  }

  static async storeTokens(tokens: GmailTokens): Promise<void> {
    await this.connectAccount(tokens);
  }

  static async clearTokens(): Promise<void> {
    const accounts = await this.getAccountList();
    for (const email of accounts) {
      await Keychain.resetGenericPassword({ service: this.keyForEmail(email) });
    }
    await Keychain.resetGenericPassword({ service: ACCOUNTS_LIST_KEY });
  }

  static async pollNewEmails(accessToken: string, email?: string): Promise<{ processed: number; failed: number }> {
    const lastScan = email ? await this.getLastScanTimestamp(email) : undefined;
    return this.pollAccount(accessToken, email, lastScan ?? undefined);
  }

  static async rescanMissedEmails(): Promise<void> {
    const connected = await this.isConnected();
    if (!connected) return;
    await this.pollAllAccounts();
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
