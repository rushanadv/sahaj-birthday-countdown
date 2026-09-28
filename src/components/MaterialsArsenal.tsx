import React, { useState } from 'react';
import { ShieldCheck, Plus, UserCheck, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import { useMaterials } from '../hooks/useMaterials';
import { useToast } from '../context/ToastContext';
import { sound } from '../utils/sound';
import { RealtimeStatus } from './RealtimeStatus';

export const MaterialsArsenal: React.FC = () => {
  const { materials, loading, error, connectionStatus, claimMaterial } = useMaterials();
  const { success, error: toastError } = useToast();

  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [claimName, setClaimName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async (matId: string, matName: string) => {
    const cleanName = claimName.trim();
    if (!cleanName) return;

    setIsClaiming(true);
    sound.playTick();

    try {
      await claimMaterial(matId, cleanName);
      sound.playCelebrationHorn();
      success(`Material assigned: ${matName} claimed by ${cleanName}`);
      setClaimName('');
      setActiveClaimId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim material';
      toastError(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const getStatusColor = (status: string) => {
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
    <section id="materials" className="py-20 md:py-28 border-t border-slate-900 bg-slate-950 content-visibility-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <RealtimeStatus status={connectionStatus} />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
              LOGISTICS & INVENTORY
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            The 5 Required Materials
          </h2>

          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Mandatory hostel inventory for the midnight ceremony at room 914. Claim responsibility below.
          </p>
        </div>

        {/* Materials List */}
        <div className="mt-12 space-y-6">
          {materials.map((mat) => {
            const isClaimBoxOpen = activeClaimId === mat.id;
            return (
              <div
                key={mat.id}
                className="p-6 sm:p-7 rounded-2xl glass-panel glass-panel-hover transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        ITEM 0{mat.orderNumber}
                      </span>
                      <h3 className="font-display text-2xl font-extrabold text-white">
                        {mat.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
                        {mat.codename}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold uppercase ${getStatusColor(
                          mat.status
                        )}`}
                      >
                        {mat.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {mat.specification}
                    </p>

                    <div className="pt-1 text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1 font-mono">
                      <span>
                        REQUIRED QTY: <strong className="text-slate-200">{mat.requiredQty}</strong>
                      </span>
                      <span>
                        ROLE: <strong className="text-emerald-400">{mat.hostelUse}</strong>
                      </span>
                    </div>

                    <div className="pt-2 text-[11px] text-amber-300/80 italic">
                      💡 Tip: {mat.tacticalTip}
                    </div>
                  </div>

                  {/* Right: Claimants & Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                        Claimed By Operatives
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end">
                        {mat.claimedBy && mat.claimedBy.length > 0 ? (
                          mat.claimedBy.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-semibold"
                            >
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>{c}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-rose-400/80 italic font-mono">
                            Unassigned — Volunteer needed
                          </span>
                        )}
                      </div>
                    </div>

                    {!isClaimBoxOpen ? (
                      <button
                        onClick={() => {
                          setActiveClaimId(mat.id);
                          sound.playTick();
                        }}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Claim This Item</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          value={claimName}
                          onChange={(e) => setClaimName(e.target.value)}
                          placeholder="Your Name (Room)"
                          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleClaim(mat.id, mat.name)}
                          disabled={isClaiming || !claimName.trim()}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider"
                        >
                          {isClaiming ? 'Claiming...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setActiveClaimId(null)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
