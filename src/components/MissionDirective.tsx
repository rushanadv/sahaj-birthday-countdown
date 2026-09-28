import React from 'react';
import { Target, DoorClosed, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const MissionDirective: React.FC = () => {
  return (
    <section id="directive" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-400">
            Hostel Operational Directive
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Operation: Sahaj Birthday GPL
          </h2>
          <p className="mt-3 text-slate-400 text-base sm:text-lg">
            Standard operating procedure for the midnight celebration and ritual bumps.
          </p>
        </div>

        {/* The Exact Prominent Statement Requested by User */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-rose-950/80 border-2 border-rose-600/70 p-6 sm:p-10 shadow-xl shadow-rose-950/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Target className="w-48 h-48 text-rose-500" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-4">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Official Mission Announcement</span>
          </div>

          <blockquote className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-snug tracking-tight max-w-3xl mx-auto">
            &ldquo;On 12:00 AM we will come to R4 914 and give him GPL.&rdquo;
          </blockquote>

          <p className="mt-4 text-sm sm:text-base text-rose-200/90 max-w-2xl mx-auto">
            No negotiations. No delays. Sahaj cannot escape through the balcony, under the bed, or into the common washroom. The strike squad moves in unison at 00:00:00.
          </p>
        </div>

        {/* Tactical Intel Bento Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Dossier */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Target Profile</h3>
            </div>
            
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Target Name</dt>
                <dd className="font-bold text-white">Sahaj</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Birthday Date</dt>
                <dd className="font-semibold text-rose-300">30th September</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Raid Time</dt>
                <dd className="font-bold text-amber-300 font-tabular">12:00 AM Sharp</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Defense Rating</dt>
                <dd className="font-medium text-emerald-400">0% (Completely Vulnerable)</dd>
              </div>
            </dl>
          </div>

          {/* Location Recon: R4 914 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <DoorClosed className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Rendezvous: R4 914</h3>
            </div>
            
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Hostel Block</dt>
                <dd className="font-bold text-white">Block R4</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Room Number</dt>
                <dd className="font-bold text-emerald-300">Room 914 (Floor 9)</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <dt className="text-slate-400">Assembly Corridor</dt>
                <dd className="font-medium text-slate-300">R4 9th Floor Wing</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Door Breach Protocol</dt>
                <dd className="font-medium text-rose-300">Fake knock / Master key</dd>
              </div>
            </dl>
          </div>

          {/* Code of Conduct / Rules */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Rules of Engagement</h3>
            </div>
            
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Maintain stealth in R4 corridor until exactly 11:59:50 PM.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Secure all balcony doors so Sahaj does not attempt a jump.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cake cutting initiates AFTER the first round of birthday bumps.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strictly brotherly love — hostel memories that last forever!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Timeline Sequence */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <h3 className="font-display text-lg font-bold text-white mb-6">
            Execution Timeline (Night of 29th &rarr; 30th September)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-amber-400 font-tabular">11:45 PM</div>
              <div className="font-semibold text-white text-sm mt-1">Material Inspection</div>
              <div className="text-xs text-slate-400 mt-1">
                Belts checked, rods sanitized, eggs chilled, sticks inspected, dumbbell positioned.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-sky-400 font-tabular">11:55 PM</div>
              <div className="font-semibold text-white text-sm mt-1">R4 9th Floor Assembly</div>
              <div className="text-xs text-slate-400 mt-1">
                Squad silent assembly outside room 914. No laughing, silent footsteps.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
              <div className="text-xs font-bold text-rose-400 font-tabular">12:00 AM (00:00)</div>
              <div className="font-semibold text-white text-sm mt-1">The Door Opens</div>
              <div className="text-xs text-rose-200/90 mt-1">
                Happy Birthday roar! Sahaj caught by surprise in R4 914.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 font-tabular">12:05 AM</div>
              <div className="font-semibold text-white text-sm mt-1">GPL & Cake Feast</div>
              <div className="text-xs text-slate-400 mt-1">
                Ritual GPL bumps administered, followed by chocolate cake and celebrations.
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
