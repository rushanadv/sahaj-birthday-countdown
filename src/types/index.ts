export interface MaterialItem {
  id: string;
  orderNumber: number;
  name: string;
  codename: string;
  specification: string;
  hostelUse: string;
  requiredQty: string;
  claimedBy: string[];
  status: 'Ready' | 'In Transit' | 'Unassigned';
  tacticalTip: string;
}

export interface SquadMember {
  id: string;
  name: string;
  role: string;
  assignedGear: string;
  eta: string;
  confirmed: boolean;
  notes?: string;
  timestamp: number;
}

export interface BirthdayWish {
  id: string;
  author: string;
  message: string;
  isRoast: boolean;
  likes: number;
  timestamp: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  isExpired: boolean;
  totalSecondsRemaining: number;
}

// Supabase Database Row Types
export interface DatabaseParticipant {
  id: string;
  name: string;
  role: string | null;
  assigned_gear: string | null;
  eta: string | null;
  notes: string | null;
  confirmed: boolean;
  created_at: string;
}

export interface DatabaseWish {
  id: string;
  author: string;
  message: string;
  is_roast: boolean;
  likes: number;
  created_at: string;
}

export interface DatabaseGplStats {
  id: string;
  global_hits: number;
  updated_at: string;
}

export interface DatabaseMaterialClaim {
  id: string;
  material_id: string;
  claimant_name: string;
  created_at: string;
}

export type ConnectionState = 'live' | 'reconnecting' | 'offline';
