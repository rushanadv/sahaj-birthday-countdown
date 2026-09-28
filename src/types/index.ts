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
