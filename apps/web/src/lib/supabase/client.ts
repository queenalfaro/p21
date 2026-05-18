import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase JS client — typed against the generated `Database` schema.
 *
 * Imported via the barrel `@/lib/supabase`. UI components MUST NOT touch
 * this client directly — they go through services in `src/services/`
 * (per architecture rule "components don't call axios").
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    [
      'Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      'Did you copy .env.example to .env and fill in your dev project keys?',
    ].join(' '),
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Storage key is scoped to this project so multiple Supabase apps
    // on the same origin (rare, but happens in dev) don't collide.
    storageKey: 'event-app-auth',
  },
  realtime: {
    params: {
      // 10 events/sec is plenty for chat; raise if presence/cursors land.
      eventsPerSecond: 10,
    },
  },
});

export type SupabaseClient = typeof supabase;
