import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BirthdayWish, DatabaseWish, ConnectionState } from '../types';

const LOCAL_STORAGE_KEY = 'sahaj_wishes_v2';
const LIKED_KEY = 'sahaj_liked_wishes';

function mapDbToWish(db: DatabaseWish): BirthdayWish {
  return {
    id: db.id,
    author: db.author,
    message: db.message,
    isRoast: db.is_roast ?? false,
    likes: db.likes || 0,
    timestamp: new Date(db.created_at).getTime(),
  };
}

export function hasLikedWishLocally(wishId: string): boolean {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(wishId);
  } catch {
    return false;
  }
}

function markWishLikedLocally(wishId: string): void {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(wishId)) {
      list.push(wishId);
      localStorage.setItem(LIKED_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

export async function fetchWishes(): Promise<BirthdayWish[]> {
  if (!isSupabaseConfigured) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishes from Supabase:', error);
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  const wishes = (data as DatabaseWish[]).map(mapDbToWish);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishes));
  } catch {
    // ignore
  }
  return wishes;
}

export async function addWish(payload: {
  author: string;
  message: string;
  is_roast: boolean;
}): Promise<BirthdayWish> {
  const cleanAuthor = payload.author.trim();
  const cleanMessage = payload.message.trim();

  if (!cleanAuthor) throw new Error('Author name is required');
  if (!cleanMessage) throw new Error('Message cannot be empty');

  if (!isSupabaseConfigured) {
    const offlineItem: BirthdayWish = {
      id: 'w-' + Date.now() + Math.random().toString(36).slice(2, 6),
      author: cleanAuthor,
      message: cleanMessage,
      isRoast: payload.is_roast,
      likes: 0,
      timestamp: Date.now(),
    };
    try {
      const current = await fetchWishes();
      const updated = [offlineItem, ...current];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return offlineItem;
  }

  const { data, error } = await supabase
    .from('wishes')
    .insert([
      {
        author: cleanAuthor,
        message: cleanMessage,
        is_roast: payload.is_roast,
        likes: 0,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to post wish');
  }

  return mapDbToWish(data as DatabaseWish);
}

export async function likeWish(wishId: string): Promise<number> {
  if (hasLikedWishLocally(wishId)) {
    throw new Error('Already liked from this device');
  }

  markWishLikedLocally(wishId);

  if (!isSupabaseConfigured) {
    try {
      const current = await fetchWishes();
      let updatedLikes = 1;
      const updated = current.map((w) => {
        if (w.id === wishId) {
          updatedLikes = w.likes + 1;
          return { ...w, likes: updatedLikes };
        }
        return w;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updatedLikes;
    } catch {
      return 1;
    }
  }

  // Attempt atomic RPC first
  const { data, error } = await supabase.rpc('like_wish', { target_wish_id: wishId });

  if (error) {
    console.warn('RPC like_wish error, attempting fallback update:', error);
    // Fallback: fetch current and update
    const { data: row } = await supabase.from('wishes').select('likes').eq('id', wishId).single();
    const nextCount = ((row?.likes as number) || 0) + 1;
    await supabase.from('wishes').update({ likes: nextCount }).eq('id', wishId);
    return nextCount;
  }

  return (data as number) || 1;
}

export function subscribeWishes(
  onData: (data: BirthdayWish[]) => void,
  onStatusChange?: (status: ConnectionState) => void
): () => void {
  if (!isSupabaseConfigured) {
    onStatusChange?.('offline');
    fetchWishes().then(onData);
    return () => {};
  }

  fetchWishes().then(onData);

  const channel = supabase
    .channel('realtime:wishes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wishes',
      },
      async () => {
        const fresh = await fetchWishes();
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
