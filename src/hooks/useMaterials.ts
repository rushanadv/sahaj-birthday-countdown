import { useState, useEffect, useCallback } from 'react';
import { MaterialItem, ConnectionState } from '../types';
import {
  fetchMaterialClaims,
  claimMaterialItem,
  subscribeMaterialClaims,
  BASE_MATERIALS,
} from '../services/materials';

export function useMaterials() {
  const [materials, setMaterials] = useState<MaterialItem[]>(() =>
    BASE_MATERIALS.map((m) => ({ ...m, claimedBy: [], status: 'Unassigned' }))
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('offline');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMaterialClaims();
      setMaterials(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch materials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    const unsubscribe = subscribeMaterialClaims(
      (data) => {
        if (mounted) {
          setMaterials(data);
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

  const claimMaterial = useCallback(async (materialId: string, claimantName: string) => {
    const cleanName = claimantName.trim();
    if (!cleanName) throw new Error('Claimant name is required');

    // Optimistic claim
    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id === materialId && !item.claimedBy.includes(cleanName)) {
          return {
            ...item,
            claimedBy: [...item.claimedBy, cleanName],
            status: 'Ready',
          };
        }
        return item;
      })
    );

    try {
      await claimMaterialItem(materialId, cleanName);
    } catch (err) {
      // Revert if error
      setMaterials((prev) =>
        prev.map((item) => {
          if (item.id === materialId) {
            return {
              ...item,
              claimedBy: item.claimedBy.filter((n) => n !== cleanName),
              status: item.claimedBy.length > 1 ? 'Ready' : 'Unassigned',
            };
          }
          return item;
        })
      );
      throw err;
    }
  }, []);

  return {
    materials,
    loading,
    error,
    connectionStatus,
    claimMaterial,
    refetch,
  };
}
