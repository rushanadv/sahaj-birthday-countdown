import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ConnectionState } from '../types';

const LOCAL_STORAGE_KEY = 'sahaj_gpl_hits_v2';
const DEFAULT_GLOBAL_HITS = 2491;

export async function fetchGlobalHits(): Promise<number> {
  if (!isSupabaseConfigured) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? parseInt(cached, 10) : DEFAULT_GLOBAL_HITS;
    } catch {
      return DEFAULT_GLOBAL_HITS;
    }
  }

  const { data, error } = await supabase
    .from('gpl_stats')
    .select('global_hits')
    .eq('id', 'global')
    .maybeSingle();

  if (error || !data) {
    console.warn('Could not fetch gpl_stats from Supabase:', error);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? parseInt(cached, 10) : DEFAULT_GLOBAL_HITS;
    } catch {
      return DEFAULT_GLOBAL_HITS;
    }
  }

  const hits = Number(data.global_hits) || DEFAULT_GLOBAL_HITS;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, hits.toString());
  } catch {
    // ignore
  }
  return hits;
}

// Queue / batch buffer for rapid simulator barrages
let pendingHitDelta = 0;
let flushTimeout: NodeJS.Timeout | null = null;

export async function incrementGlobalHits(amount: number = 1): Promise<void> {
  pendingHitDelta += amount;

  // Immediately update local cache for optimistic UI
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const current = cached ? parseInt(cached, 10) : DEFAULT_GLOBAL_HITS;
    localStorage.setItem(LOCAL_STORAGE_KEY, (current + amount).toString());
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured) return;

  if (flushTimeout) return;

  flushTimeout = setTimeout(async () => {
    const toSend = pendingHitDelta;
    pendingHitDelta = 0;
    flushTimeout = null;

    if (toSend <= 0) return;

    try {
      const { error } = await supabase.rpc('increment_gpl_hits', { amount: toSend });
      if (error) {
        console.warn('RPC increment_gpl_hits error:', error);
        // Fallback update
        const { data: row } = await supabase
          .from('gpl_stats')
          .select('global_hits')
          .eq('id', 'global')
          .maybeSingle();
        const currentHits = Number(row?.global_hits) || 0;
        await supabase
          .from('gpl_stats')
          .update({ global_hits: currentHits + toSend, updated_at: new Date().toISOString() })
          .eq('id', 'global');
      }
    } catch (err) {
      console.error('Failed to sync global hits to Supabase:', err);
    }
  }, 400);
}

export function subscribeGlobalHits(
  onData: (hits: number) => void,
  onStatusChange?: (status: ConnectionState) => void
): () => void {
  if (!isSupabaseConfigured) {
    onStatusChange?.('offline');
    fetchGlobalHits().then(onData);
    return () => {};
  }

  fetchGlobalHits().then(onData);

  const channel = supabase
    .channel('realtime:gpl_stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'gpl_stats',
      },
      (payload) => {
        if (payload.new && 'global_hits' in payload.new) {
          const hits = Number((payload.new as { global_hits: number }).global_hits);
          onData(hits);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onStatusChange?.('live');
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        onStatusChange?.('reconnecting');
      } else if (status === 'CLOSED') {
        onStatusChange?.('offline');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
