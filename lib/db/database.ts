import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import * as Keychain from 'react-native-keychain';
import { schema } from '../../model_legacy/schema';
import { Transaction, Category, Rule, SyncLog, FailedParse } from '../../model_legacy/models';
import { Platform } from 'react-native';

let databaseInstance: Database | null = null;

async function getEncryptionKey(): Promise<string> {
  const service = 'spendng.db.encryption';
  const credentials = await Keychain.getGenericPassword({ service });
  if (credentials) return credentials.password;
  const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await Keychain.setGenericPassword('db_key', newKey, { service });
  return newKey;
}

export async function initDatabase(): Promise<Database> {
  if (databaseInstance) return databaseInstance;

  const encryptionKey = await getEncryptionKey();

  const adapter = new SQLiteAdapter({
    schema,
    dbName: 'spendng',
    jsi: true,
    onSetUpError: (error) => {
      console.error('Database setup error', error);
    },
  });

  databaseInstance = new Database({
    adapter,
    modelClasses: [Transaction, Category, Rule, SyncLog, FailedParse],
  });

  return databaseInstance;
}

export function getDatabase(): Database {
  if (!databaseInstance) throw new Error('Database not initialized. Call initDatabase() first.');
  return databaseInstance;
}

export async function resetDatabase(): Promise<void> {
  const db = databaseInstance;
  if (db) {
    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    databaseInstance = null;
  }
}
