// Clean, zero-cloud client storage with real-time multi-tab synchronization
// Replaces Firebase to enable 100% unrestricted export to Antigravity, GitHub, Vercel, etc.
import { MaterialItem, SquadMember, BirthdayWish } from '../types';

const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-1',
    orderNumber: 1,
    name: 'Belts',
    codename: 'Tactical Leather Strap',
    specification: 'Heavy-duty genuine leather or woven denim belts with metal buckles',
    hostelUse: 'The foundational cornerstone of traditional birthday bumps / GPL ceremony',
    requiredQty: 'At least 3-4 heavy belts',
    claimedBy: ['Rohan (Floor 9)', 'Aman (R4 912)'],
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
    claimedBy: ['Vikram (R4 908)'],
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
    claimedBy: ['Kabir (R4 918)', 'Siddharth (R4 902)'],
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
    claimedBy: ['Tanmay (R4 910)'],
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
    claimedBy: ['Harsh (Hostel Gym Rep)'],
    status: 'Ready',
    tacticalTip: 'Place dumbbell immediately between door edge and floor frame upon breaching R4 914.',
  },
];

const INITIAL_SQUAD: SquadMember[] = [
  {
    id: 'sq-1',
    name: 'Rohan Sharma',
    role: 'Squad Commander',
    assignedGear: '1) Belts (Leather Strap)',
    eta: '11:45 PM',
    confirmed: true,
    notes: 'Briefing all floor 9 boys near water cooler before midnight.',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'sq-2',
    name: 'Vikram Patel',
    role: 'Acoustic Breacher',
    assignedGear: '2) Rods (Door Rattler)',
    eta: '11:50 PM',
    confirmed: true,
    notes: 'Carrying 2 curtain rods to rattle room 914 grill.',
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'sq-3',
    name: 'Kabir & Siddharth',
    role: 'Egg Deployment Specialist',
    assignedGear: '3) Eggs (12-Pack)',
    eta: '11:55 PM',
    confirmed: true,
    notes: 'Bought cold eggs from hostel canteen, chilling in mess fridge.',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'sq-4',
    name: 'Harsh Vardhan',
    role: 'Door Wedge & Anchor',
    assignedGear: '5) Dumbbell (Door Wedge)',
    eta: '11:52 PM',
    confirmed: true,
    notes: '10kg hex dumbbell ready so Sahaj cannot lock door 914.',
    timestamp: Date.now() - 1000 * 60 * 45,
  },
];

const INITIAL_WISHES: BirthdayWish[] = [
  {
    id: 'w-1',
    author: 'Vikram (R4 908)',
    message: 'Happy early 21st Sahaj! Door 914 won\'t save you tonight bro. Keep that banyan clean because the egg treatment is coming!',
    isRoast: true,
    likes: 14,
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'w-2',
    author: 'Aman & Floor 9 Squad',
    message: 'Happy Birthday brother! Best roommate and best friend in whole college. Treat ready rakhna midnight pe!',
    isRoast: false,
    likes: 21,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'w-3',
    author: 'Rohan Sharma',
    message: 'Happy Birthday Sahaj! 12:00 AM sharp GPL is mandatory as per Floor 9 hostel bylaws.',
    isRoast: true,
    likes: 18,
    timestamp: Date.now() - 1000 * 60 * 30,
  },
];

class LocalDataStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('sahaj_bday_channel');
        this.channel.onmessage = (event) => {
          const { key, data } = event.data || {};
          if (key && this.listeners.has(key)) {
            this.listeners.get(key)?.forEach((fn) => fn(data));
          }
        };
      }
    } catch {
      // fallback
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && this.listeners.has(e.key)) {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          this.listeners.get(e.key)?.forEach((fn) => fn(parsed));
        }
      });
    }
  }

  private notify(key: string, data: unknown) {
    this.listeners.get(key)?.forEach((fn) => fn(data));
    try {
      this.channel?.postMessage({ key, data });
    } catch {
      // ignore
    }
  }

  public subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(callback as (data: unknown) => void);

    // Initial trigger
    callback(this.get<T>(key));

    return () => {
      set.delete(callback as (data: unknown) => void);
    };
  }

  public get<T>(key: string): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    // Defaults
    if (key === 'gpl_hits') return 247 as unknown as T;
    if (key === 'materials') return INITIAL_MATERIALS as unknown as T;
    if (key === 'squad') return INITIAL_SQUAD as unknown as T;
    if (key === 'wishes') return INITIAL_WISHES as unknown as T;

    return null as unknown as T;
  }

  public set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
    this.notify(key, value);
  }

  // --- Specific Helpers ---

  // GPL Hit Counter
  public getHits(): number {
    return this.get<number>('gpl_hits');
  }

  public incrementHits(delta: number = 1): number {
    const current = this.getHits();
    const next = current + delta;
    this.set('gpl_hits', next);
    return next;
  }

  // Materials
  public getMaterials(): MaterialItem[] {
    return this.get<MaterialItem[]>('materials');
  }

  public claimMaterial(matId: string, claimantName: string): void {
    const materials = this.getMaterials().map((mat) => {
      if (mat.id === matId) {
        const cleaned = claimantName.trim();
        if (!cleaned || mat.claimedBy.includes(cleaned)) return mat;
        return {
          ...mat,
          claimedBy: [...mat.claimedBy, cleaned],
        };
      }
      return mat;
    });
    this.set('materials', materials);
  }

  // Squad Members
  public getSquad(): SquadMember[] {
    return this.get<SquadMember[]>('squad');
  }

  public addSquadMember(member: Omit<SquadMember, 'id' | 'timestamp'>): SquadMember {
    const newMember: SquadMember = {
      ...member,
      id: 'sq-' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    const list = [newMember, ...this.getSquad()];
    this.set('squad', list);
    return newMember;
  }

  public deleteSquadMember(id: string): void {
    const list = this.getSquad().filter((m) => m.id !== id);
    this.set('squad', list);
  }

  // Wishes
  public getWishes(): BirthdayWish[] {
    return this.get<BirthdayWish[]>('wishes');
  }

  public addWish(wish: Omit<BirthdayWish, 'id' | 'likes' | 'timestamp'>): BirthdayWish {
    const newWish: BirthdayWish = {
      ...wish,
      id: 'w-' + Date.now() + Math.random().toString(36).substring(2, 6),
      likes: 0,
      timestamp: Date.now(),
    };
    const list = [newWish, ...this.getWishes()];
    this.set('wishes', list);
    return newWish;
  }

  public likeWish(id: string): void {
    const list = this.getWishes().map((w) => {
      if (w.id === id) {
        return { ...w, likes: w.likes + 1 };
      }
      return w;
    });
    this.set('wishes', list);
  }

  public deleteWish(id: string): void {
    const list = this.getWishes().filter((w) => w.id !== id);
    this.set('wishes', list);
  }
}

export const localStore = new LocalDataStore();
