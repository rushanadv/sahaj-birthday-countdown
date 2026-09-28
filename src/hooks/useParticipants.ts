import { useState, useEffect, useCallback } from 'react';
import { SquadMember, ConnectionState } from '../types';
import {
  fetchParticipants,
  addParticipant as addParticipantService,
  subscribeParticipants,
} from '../services/participants';

export function useParticipants() {
  const [participants, setParticipants] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('offline');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchParticipants();
      setParticipants(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch squad';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    const unsubscribe = subscribeParticipants(
      (data) => {
        if (mounted) {
          setParticipants(data);
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

  const addParticipant = useCallback(
    async (payload: {
      name: string;
      role?: string;
      assigned_gear?: string;
      eta?: string;
      notes?: string;
    }) => {
      // Optimistic temporary item
      const tempId = 'temp-' + Date.now();
      const optimisticMember: SquadMember = {
        id: tempId,
        name: payload.name.trim(),
        role: payload.role?.trim() || 'GPL Participant',
        assignedGear: payload.assigned_gear?.trim() || 'Squad Assignment Pending',
        eta: payload.eta?.trim() || '11:59 PM',
        confirmed: true,
        notes: payload.notes?.trim(),
        timestamp: Date.now(),
      };

      setParticipants((prev) => [optimisticMember, ...prev]);

      try {
        const saved = await addParticipantService(payload);
        setParticipants((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
        return saved;
      } catch (err) {
        // Rollback optimistic item on failure
        setParticipants((prev) => prev.filter((p) => p.id !== tempId));
        throw err;
      }
    },
    []
  );

  return {
    participants,
    loading,
    error,
    connectionStatus,
    addParticipant,
    refetch,
  };
}
