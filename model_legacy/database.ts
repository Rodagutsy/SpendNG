import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import * as Keychain from 'react-native-keychain';
import { schema } from './schema';
import { Transaction, Category, Rule, SyncLog, FailedParse } from './models';

// Key derivation and storage as per security-guadrails.md
const getEncryptionKey = async (): Promise<string> => {
  const service = 'spendng.db.encryption';
  const credentials = await Keychain.getGenericPassword({ service });
  
  if (credentials) {
    return credentials.password;
  }

  // Generate a new key if it doesn't exist
  // In a real app, this should be derived from user PIN/Biometric
  const newKey = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  await Keychain.setGenericPassword('db_key', newKey, { service });
  return newKey;
};

const adapter = new SQLiteAdapter({
  schema,
  // encryptionKey: await getEncryptionKey(), // This needs to be handled asynchronously during init
  jsi: true, // Use JSI for better performance
  onSetUpError: error => {
    console.error('Database failed to load', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Transaction, Category, Rule, SyncLog, FailedParse],
});
