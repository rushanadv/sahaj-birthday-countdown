import React, { useState } from 'react';
import { Target, Clock, ShieldCheck, Plus, UserCheck, CheckCircle2, ChevronRight, AlertCircle, Compass } from 'lucide-react';
import { useMaterials } from '../hooks/useMaterials';
import { useToast } from '../context/ToastContext';
import { sound } from '../utils/sound';
import { RealtimeStatus } from './RealtimeStatus';

export const RaidPlan: React.FC = () => {
  const { materials, connectionStatus, claimMaterial } = useMaterials();
  const { success, error: toastError } = useToast();

  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [claimName, setClaimName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async (matId: string, matName: string) => {
    const clean = claimName.trim();
    if (!clean) return;

    setIsClaiming(true);
    sound.playTick();

    try {
      await claimMaterial(matId, clean);
      sound.playCelebrationHorn();
      success(`Material assigned: ${matName} claimed by ${clean}`);
      setClaimName('');
      setActiveClaimId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim material';
      toastError(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <section id="raid-plan" className="py-24 sm:py-32 border-t border-slate-900 bg-[#030712] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-rose-950/20 rounded-full blur-[180px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-white/10 font-mono text-[11px] font-bold text-rose-400 uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>OPERATIONAL DOSSIER · FLOOR 9</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight">
            The Raid Plan
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            Strict protocol for the midnight birthday operation at Room R4 914. No delays. No compromises.
          </p>
        </div>

        {/* Central Core Statement Banner */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-rose-950/40 via-slate-900/50 to-slate-950/80 border border-rose-600/30 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="font-mono text-xs font-bold text-rose-400 tracking-[0.25em] uppercase mb-4">
            OFFICIAL MISSION DIRECTIVE
          </div>
          <blockquote className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
            &ldquo;On 12:00 AM we will come to R4 914 and give him GPL.&rdquo;
          </blockquote>
          <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-mono">
            Target is trapped on the 9th floor. Balconies and exits sealed by strike operatives.
          </p>
        </div>

        {/* Chronological Scroll Milestones */}
        <div className="mt-20 space-y-16">
          
          {/* Milestone 1: 11:45 PM - MATERIAL INSPECTION & INLINE CLAIMS */}
          <div className="relative pl-6 sm:pl-10 border-l border-amber-500/40 space-y-6">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#030712] border-2 border-amber-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-amber-400 tracking-widest uppercase">
                PHASE 01 · 11:45 PM
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                Material Inspection & Arsenal Status
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Operatives verify and claim equipment prior to corridor movement. All claims synchronize in real time with HQ.
              </p>
            </div>

            {/* Curated Materials Grid with Realtime Claiming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {materials.map((mat) => {
                const isClaimOpen = activeClaimId === mat.id;
                const hasClaims = mat.claimedBy && mat.claimedBy.length > 0;

                return (
                  <div
                    key={mat.id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          ITEM 0{mat.orderNumber} &bull; {mat.codename}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            hasClaims
                              ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                              : 'bg-rose-950/60 border border-rose-800/40 text-rose-400'
                          }`}
                        >
                          {hasClaims ? 'ASSIGNED' : 'REQUIRED'}
                        </span>
                      </div>

                      <h4 className="font-display text-lg font-bold text-white">
                        {mat.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {mat.specification}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        {hasClaims ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Assigned:</span>
                            {mat.claimedBy.map((name, idx) => (
                              <span
                                key={idx}
                                className="font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30 text-[11px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-rose-400/90 italic">
                            Unassigned &bull; Volunteer needed
                          </span>
                        )}
                      </div>

                      {/* Claim Interaction */}
                      {!isClaimOpen ? (
                        <button
                          onClick={() => {
                            setActiveClaimId(mat.id);
                            sound.playTick();
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-mono font-semibold text-slate-200 transition-colors self-start sm:self-auto"
                        >
                          + Claim Item
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={claimName}
                            onChange={(e) => setClaimName(e.target.value)}
                            placeholder="Your Name"
                            className="w-28 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            onClick={() => handleClaim(mat.id, mat.name)}
                            disabled={isClaiming || !claimName.trim()}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono font-bold text-[11px]"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setActiveClaimId(null)}
                            className="px-1.5 py-1 text-slate-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone 2: 11:55 PM - SQUAD ASSEMBLY */}
          <div className="relative pl-6 sm:pl-10 border-l border-sky-500/40 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#030712] border-2 border-sky-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-sky-400 tracking-widest uppercase">
                PHASE 02 · 11:55 PM
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                Hostel R4 9th Floor Assembly
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Operatives converge quietly on the 9th floor corridor. No laughing, silent footfalls. Belts concealed, cake guarded, camera ready.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Rendezvous: Outside Room 914 corridor wing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-600" />
                <span>Acoustic stealth: Phones on silent until zero hour</span>
              </div>
            </div>
          </div>

          {/* Milestone 3: 00:00 MIDNIGHT - BREACH & CELEBRATION */}
          <div className="relative pl-6 sm:pl-10 border-l border-rose-500/50 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#030712] border-2 border-rose-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-rose-400 tracking-widest uppercase">
                PHASE 03 · 12:00 AM (00:00:00)
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                Zero Hour: Door 914 Breach
              </h3>
              <p className="text-rose-200/90 text-sm mt-2 max-w-2xl leading-relaxed">
                The fake knock / master turn initiates. Door swings open. The birthday chorus erupts. Sahaj is encircled by the squad.
              </p>
            </div>
          </div>

          {/* Milestone 4: 00:05 AM - GPL RITUAL & CAKE */}
          <div className="relative pl-6 sm:pl-10 border-l border-emerald-500/40 space-y-4">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#030712] border-2 border-emerald-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-emerald-400 tracking-widest uppercase">
                PHASE 04 · 12:05 AM
              </div>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
                GPL Protocol & Chocolate Cake
              </h3>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Mandatory birthday ritual bumps administered with brotherly love, followed by lighting candles on the chocolate truffle cake.
              </p>
            </div>
          </div>

        </div>

        {/* Recon Profile Snippet */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div>TARGET: <span className="text-white font-bold">SAHAJ (ROOM R4 914)</span></div>
          <div>DATE: <span className="text-rose-400 font-bold">30 SEPTEMBER 2026</span></div>
          <div>STATUS: <span className="text-emerald-400 font-bold">ACTIVE PROTOCOL</span></div>
        </div>

      </div>
    </section>
  );
};
