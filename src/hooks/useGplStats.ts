import { useState, useEffect, useCallback } from 'react';
import { ConnectionState } from '../types';
import {
  fetchGlobalHits,
  incrementGlobalHits,
  subscribeGlobalHits,
} from '../services/gplStats';

export function useGplStats() {
  const [globalHits, setGlobalHits] = useState<number>(2491);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('offline');

  const refetch = useCallback(async () => {
    try {
      const hits = await fetchGlobalHits();
      setGlobalHits(hits);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeGlobalHits(
      (hits) => {
        if (mounted) setGlobalHits(hits);
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

  const recordHit = useCallback((amount: number = 1) => {
    setGlobalHits((prev) => prev + amount);
    incrementGlobalHits(amount);
  }, []);

  return {
    globalHits,
    connectionStatus,
    recordHit,
    refetch,
  };
}
