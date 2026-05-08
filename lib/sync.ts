import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/model/database';
import { supabase } from '@/lib/supabase';

export async function syncData() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const { data, error } = await supabase.rpc('pull_changes', {
        last_pulled_at: lastPulledAt,
        schema_version: schemaVersion,
      });

      if (error) throw error;

      return {
        changes: data.changes,
        timestamp: data.timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      const { error } = await supabase.rpc('push_changes', {
        changes,
        last_pulled_at: lastPulledAt,
      });

      if (error) throw error;
    },
    migrationsEnabledAtVersion: 1,
  });
}
