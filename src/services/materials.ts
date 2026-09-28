import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MaterialItem, DatabaseMaterialClaim, ConnectionState } from '../types';

export const BASE_MATERIALS: Omit<MaterialItem, 'claimedBy'>[] = [
  {
    id: 'mat-1',
    orderNumber: 1,
    name: 'Belts',
    codename: 'Tactical Leather Strap',
    specification: 'Heavy-duty genuine leather or woven denim belts with metal buckles',
    hostelUse: 'The foundational cornerstone of traditional birthday bumps / GPL ceremony',
    requiredQty: 'At least 3-4 heavy belts',
    status: 'Ready',
    tacticalTip: 'Hold by buckle end, administer friendly rhythmic taps on the mattress cushion.',
  },
  {
    id: 'mat-2',
    orderNumber: 2,
    name: 'Rods',
    codename: 'Acoustic Intimidation Rods',
    specification: 'Hollow curtain rods or light metal pipe for auditory hostel resonance',
    hostelUse: 'Bang against room 914 metal doorframe to create thunderous midnight sound effects',
    requiredQty: '2 calibrated rods',
    status: 'Ready',
    tacticalTip: 'Strictly for sound effects and dramatic door rattling! Keep safe distances.',
  },
  {
    id: 'mat-3',
    orderNumber: 3,
    name: 'Eggs',
    codename: 'Poultry Artillery Division',
    specification: 'Grade-A chilled raw eggs (unboiled, room temperature or fridge cold)',
    hostelUse: 'The iconic hostel birthday shampoo treatment directly over Sahaj\'s head',
    requiredQty: '1 dozen (12 eggs minimum)',
    status: 'Ready',
    tacticalTip: 'Keep in padded egg tray until 11:59 PM to prevent premature hostel corridor casualties.',
  },
  {
    id: 'mat-4',
    orderNumber: 4,
    name: 'Stick',
    codename: 'Wooden Lathi of Justice',
    specification: 'Classic polished hostel danda / solid wooden walking cane',
    hostelUse: 'Hostel warden impression and theatrical pointer for the birthday presentation',
    requiredQty: '1-2 solid wooden sticks',
    status: 'Ready',
    tacticalTip: 'Used by the squad captain to direct the squad formation outside R4 914.',
  },
  {
    id: 'mat-5',
    orderNumber: 5,
    name: 'Dumbbell',
    codename: '10kg Door Wedger & Heavy Artillery',
    specification: 'Cast iron hexagonal 10kg dumbbell from hostel gym',
    hostelUse: 'Wedge Sahaj\'s room 914 door wide open so he cannot lock himself inside',
    requiredQty: '1-2 cast iron dumbbells',
    status: 'Ready',
    tacticalTip: 'Place dumbbell immediately between door edge and floor frame upon breaching R4 914.',
  },
];

const LOCAL_STORAGE_KEY = 'sahaj_material_claims_v2';

export async function fetchMaterialClaims(): Promise<MaterialItem[]> {
  let claims: { material_id: string; claimant_name: string }[] = [];

  if (!isSupabaseConfigured) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      claims = cached ? JSON.parse(cached) : [];
    } catch {
      claims = [];
    }
  } else {
    const { data, error } = await supabase
      .from('material_claims')
      .select('material_id, claimant_name');

    if (!error && data) {
      claims = data as DatabaseMaterialClaim[];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(claims));
      } catch {
        // ignore
      }
    } else {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        claims = cached ? JSON.parse(cached) : [];
      } catch {
        claims = [];
      }
    }
  }

  // Combine base definitions with claims
  return BASE_MATERIALS.map((base) => {
    const matchingClaims = claims
      .filter((c) => c.material_id === base.id)
      .map((c) => c.claimant_name);

    return {
      ...base,
      claimedBy: matchingClaims,
      status: matchingClaims.length > 0 ? 'Ready' : 'Unassigned',
    };
  });
}

export async function claimMaterialItem(materialId: string, claimantName: string): Promise<void> {
  const cleanName = claimantName.trim();
  if (!cleanName) throw new Error('Claimant name is required');

  if (!isSupabaseConfigured) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const list: { material_id: string; claimant_name: string }[] = cached ? JSON.parse(cached) : [];
      if (!list.some((c) => c.material_id === materialId && c.claimant_name === cleanName)) {
        list.push({ material_id: materialId, claimant_name: cleanName });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
    return;
  }

  const { error } = await supabase.from('material_claims').insert([
    {
      material_id: materialId,
      claimant_name: cleanName,
    },
  ]);

  if (error) {
    throw new Error(error.message || 'Failed to claim material');
  }
}

export function subscribeMaterialClaims(
  onData: (data: MaterialItem[]) => void,
  onStatusChange?: (status: ConnectionState) => void
): () => void {
  if (!isSupabaseConfigured) {
    onStatusChange?.('offline');
    fetchMaterialClaims().then(onData);
    return () => {};
  }

  fetchMaterialClaims().then(onData);

  const channel = supabase
    .channel('realtime:material_claims')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'material_claims',
      },
      async () => {
        const fresh = await fetchMaterialClaims();
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
