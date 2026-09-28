import { useState, useEffect, useCallback } from 'react';
import { BirthdayWish, ConnectionState } from '../types';
import {
  fetchWishes,
  addWish as addWishService,
  likeWish as likeWishService,
  subscribeWishes,
  hasLikedWishLocally,
} from '../services/wishes';

export function useWishes() {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('offline');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWishes();
      setWishes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch wishes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    const unsubscribe = subscribeWishes(
      (data) => {
        if (mounted) {
          setWishes(data);
          setLoading(false);
          setError(null);
        }
      },
      (status) => {
        if (mounted) setConnectionStatus(status);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const postWish = useCallback(
    async (payload: { author: string; message: string; is_roast: boolean }) => {
      const tempId = 'temp-w-' + Date.now();
      const optimisticWish: BirthdayWish = {
        id: tempId,
        author: payload.author.trim(),
        message: payload.message.trim(),
        isRoast: payload.is_roast,
        likes: 0,
        timestamp: Date.now(),
      };

      setWishes((prev) => [optimisticWish, ...prev]);

      try {
        const saved = await addWishService(payload);
        setWishes((prev) => prev.map((w) => (w.id === tempId ? saved : w)));
        return saved;
      } catch (err) {
        setWishes((prev) => prev.filter((w) => w.id !== tempId));
        throw err;
      }
    },
    []
  );

  const onLikeWish = useCallback(async (wishId: string) => {
    if (hasLikedWishLocally(wishId)) {
      throw new Error('Already liked from this device');
    }

    // Optimistic increment
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, likes: w.likes + 1 } : w))
    );

    try {
      const updatedLikes = await likeWishService(wishId);
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, likes: updatedLikes } : w))
      );
    } catch (err) {
      // Revert if error
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, likes: Math.max(0, w.likes - 1) } : w))
      );
      throw err;
    }
  }, []);

  return {
    wishes,
    loading,
    error,
    connectionStatus,
    postWish,
    onLikeWish,
    hasLiked: hasLikedWishLocally,
    refetch,
  };
}
