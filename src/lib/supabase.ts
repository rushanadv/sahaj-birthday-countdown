import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client if credentials aren't set yet during local dev/preview
const dummyClientUrl = 'https://placeholder.supabase.co';
const dummyClientKey = 'placeholder-key';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyClientUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyClientKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
