import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserCheck, CheckCircle } from 'lucide-react';
import { MaterialItem } from '../types';
import { sound } from '../utils/sound';
import { localStore } from '../utils/storage';

const BASE_MATERIALS: Omit<MaterialItem, 'claimedBy'>[] = [
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
    codename: 'Anchor of Immovability',
    specification: 'Cast iron hexagonal 7.5kg - 10kg gym dumbbell',
    hostelUse: 'Keep door 914 wide open so Sahaj cannot slam it shut and barricade himself inside',
    requiredQty: '1 heavy dumbbell (7.5kg+)',
    status: 'Ready',
    tacticalTip: 'Place immediately at door threshold upon entry to prevent lockdown.',
  },
];

export const MaterialsArsenal: React.FC = () => {
  const [materialsList, setMaterialsList] = useState<MaterialItem[]>(() => localStore.getMaterials());
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [claimName, setClaimName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Sync real-time claims from localStore
  useEffect(() => {
    const unsubscribe = localStore.subscribe<MaterialItem[]>('materials', (list) => {
      if (list && list.length > 0) {
        setMaterialsList(list);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClaim = (matId: string) => {
    if (!claimName.trim()) return;

    setIsClaiming(true);
    sound.playTick();

    localStore.claimMaterial(matId, claimName.trim());
    setClaimName('');
    setActiveClaimId(null);
    setIsClaiming(false);
  };

  const materials: MaterialItem[] = materialsList.map((m) => {
    return {
      ...m,
      status: m.claimedBy.length > 0 ? 'Ready' : 'Unassigned',
    };
  });

  const getStatusColor = (status: MaterialItem['status']) => {
    switch (status) {
      case 'Ready':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
      case 'In Transit':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
      default:
        return 'text-rose-400 bg-rose-950/40 border-rose-800/50';
    }
  };

  return (
    <section id="materials" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
            Logistics & Arsenal Check
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Materials Required for 12:00 AM
          </h2>
          <p className="mt-3 text-slate-400 text-base sm:text-lg">
            Every strike squad member must verify these 5 mission-critical assets before approaching R4 914.
          </p>
        </div>

        {/* Materials List */}
        <div className="mt-12 space-y-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="p-6 sm:p-7 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                
                {/* Left: Number and Details */}
                <div className="flex items-start gap-4">
                  {/* Order Number Badge */}
                  <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <span className="font-display font-extrabold text-xl text-rose-400">
                      {mat.orderNumber})
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                        {mat.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        [{mat.codename}]
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(mat.status)}`}>
                        {mat.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      <strong className="text-slate-200">Specification:</strong> {mat.specification}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      <strong className="text-slate-300">Hostel Role:</strong> {mat.hostelUse}
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 text-xs text-amber-300/90">
                      <strong className="text-amber-400 font-semibold">Tactical Brief:</strong> {mat.tacticalTip}
                    </div>
                  </div>
                </div>

                {/* Right: Allocation & Claim */}
                <div className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Required Quantity
                  </div>
                  <div className="text-sm font-bold text-white mb-3">
                    {mat.requiredQty}
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Assigned Custodians
                  </div>

                  {mat.claimedBy.length === 0 ? (
                    <div className="text-xs text-slate-500 mb-3 italic">
                      No custodians claimed yet. Claim below!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mat.claimedBy.map((person, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-200"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>{person}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {activeClaimId === mat.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        placeholder="Your name..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaim(mat.id)}
                          disabled={isClaiming}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{isClaiming ? 'Saving...' : 'Confirm'}</span>
                        </button>
                        <button
                          onClick={() => setActiveClaimId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveClaimId(mat.id);
                        setClaimName('');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-400" />
                      <span>I will bring {mat.name}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Readiness Verification Banner */}
        <div className="mt-8 p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-4 text-emerald-300 text-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Live Logistics Sync:</span>{' '}
            Material custodians are synced live in the cloud database. Check in outside R4 914 at 11:45 PM.
          </div>
        </div>

      </div>
    </section>
  );
};
