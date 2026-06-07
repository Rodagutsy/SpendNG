import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Create a synchronous connection to the local database
export const sqliteDb = openDatabaseSync('spendng.db');

// Initialize the Drizzle ORM client with the schema
export const db = drizzle(sqliteDb, { schema });

// Export the schema for easy access elsewhere
export * from './schema';
