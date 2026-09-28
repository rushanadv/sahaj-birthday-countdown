import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SquadMember, DatabaseParticipant, ConnectionState } from '../types';

const LOCAL_STORAGE_KEY = 'sahaj_participants_v2';

function mapDbToSquad(db: DatabaseParticipant): SquadMember {
  return {
    id: db.id,
    name: db.name,
    role: db.role || 'GPL Participant',
    assignedGear: db.assigned_gear || 'Squad Assignment Pending',
    eta: db.eta || '11:59 PM',
    confirmed: db.confirmed ?? true,
    notes: db.notes || undefined,
    timestamp: new Date(db.created_at).getTime(),
  };
}

export async function fetchParticipants(): Promise<SquadMember[]> {
  if (!isSupabaseConfigured) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching participants from Supabase:', error);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  const squad = (data as DatabaseParticipant[]).map(mapDbToSquad);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(squad));
  } catch {
    // ignore
  }
  return squad;
}

export async function addParticipant(payload: {
  name: string;
  role?: string;
  assigned_gear?: string;
  eta?: string;
  notes?: string;
}): Promise<SquadMember> {
  const cleanName = payload.name.trim();
  if (!cleanName) throw new Error('Participant name is required');

  if (!isSupabaseConfigured) {
    const offlineItem: SquadMember = {
      id: 'sq-' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      role: payload.role?.trim() || 'GPL Participant',
      assignedGear: payload.assigned_gear?.trim() || 'Squad Assignment Pending',
      eta: payload.eta?.trim() || '11:59 PM',
      confirmed: true,
      notes: payload.notes?.trim(),
      timestamp: Date.now(),
    };
    try {
      const current = await fetchParticipants();
      const updated = [offlineItem, ...current];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return offlineItem;
  }

  const { data, error } = await supabase
    .from('participants')
    .insert([
      {
        name: cleanName,
        role: payload.role?.trim() || 'GPL Participant',
        assigned_gear: payload.assigned_gear?.trim() || 'Squad Assignment Pending',
        eta: payload.eta?.trim() || '11:59 PM',
        notes: payload.notes?.trim() || null,
        confirmed: true,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to pledge attendance');
  }

  return mapDbToSquad(data as DatabaseParticipant);
}

export function subscribeParticipants(
  onData: (data: SquadMember[]) => void,
  onStatusChange?: (status: ConnectionState) => void
): () => void {
  if (!isSupabaseConfigured) {
    onStatusChange?.('offline');
    fetchParticipants().then(onData);
    return () => {};
  }

  // Initial load
  fetchParticipants().then(onData);

  const channel = supabase
    .channel('realtime:participants')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
      },
      async () => {
        const fresh = await fetchParticipants();
        onData(fresh);
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
