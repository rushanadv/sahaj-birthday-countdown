import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useParticipants } from '../hooks/useParticipants';
import { useToast } from '../context/ToastContext';
import { sound } from '../utils/sound';
import { RealtimeStatus } from './RealtimeStatus';

const ROLE_PRESETS = [
  'GPL Participant',
  'Cake Crew',
  'Birthday Squad',
  'Photographer',
  'Decoration Crew',
  'Midnight Attendee',
  'Custom',
];

const ETA_PRESETS = [
  '11:45 PM',
  '11:50 PM',
  '11:55 PM',
  '12:00 AM Midnight',
  'Custom',
];

const SQUAD_ASSIGNMENT_PRESETS = [
  'Cake Security & Transport',
  'Door Wedge Operator',
  'Confetti Artillery',
  'Acoustic Door Rattler',
  'Belt Custodian (Friendly Taps)',
  'Chief Photographer / Videographer',
  'General Squad / Moral Support',
];

export const SquadRoster: React.FC = () => {
  const { participants, loading, error, connectionStatus, addParticipant, refetch } =
    useParticipants();
  const { success, error: toastError } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLE_PRESETS[0]);
  const [customRole, setCustomRole] = useState('');
  const [eta, setEta] = useState(ETA_PRESETS[1]);
  const [customEta, setCustomEta] = useState('');
  const [assignedGear, setAssignedGear] = useState(SQUAD_ASSIGNMENT_PRESETS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Please enter your full name');
      return;
    }

    const finalRole = role === 'Custom' ? customRole.trim() || 'GPL Participant' : role;
    const finalEta = eta === 'Custom' ? customEta.trim() || '11:55 PM' : eta;

    setIsSubmitting(true);
    setFormError('');

    try {
      sound.playTick();
      await addParticipant({
        name: cleanName,
        role: finalRole,
        assigned_gear: assignedGear,
        eta: finalEta,
        notes: notes.trim() || undefined,
      });

      sound.playCelebrationHorn();
      success("You're in. R4 914 awaits.");

      setName('');
      setCustomRole('');
      setCustomEta('');
      setNotes('');
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm attendance';
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="squad" className="py-24 sm:py-32 border-t border-white/5 bg-[#030712] relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <RealtimeStatus status={connectionStatus} />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-emerald-400">
                VERIFIED OPERATIVES
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight">
                {participants.length}
              </span>
              <span className="font-display text-2xl sm:text-4xl font-extrabold text-emerald-400 uppercase tracking-wider">
                CONFIRMED
              </span>
            </div>

            <p className="text-slate-400 text-sm sm:text-base font-light max-w-lg leading-relaxed">
              Official attendance roster for the midnight operation at Room R4 914. Synchronized live with Supabase.
            </p>
          </div>

          <button
            onClick={() => {
              setModalOpen(true);
              sound.playTick();
            }}
            className="flex items-center gap-2.5 min-h-[44px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-emerald-950/60 active:scale-95 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>JOIN THE RAID</span>
          </button>
        </div>

        {/* Clean Editorial Participants Grid */}
        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 animate-pulse space-y-3">
                  <div className="h-6 w-32 bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-slate-950 border border-rose-900/40 text-center max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : participants.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center max-w-lg mx-auto space-y-4">
              <Users className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-display text-xl font-bold text-white">No Operatives Confirmed Yet</h3>
              <p className="text-xs text-slate-400">
                Be the first to pledge attendance for Sahaj's midnight birthday protocol!
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold tracking-wider uppercase"
              >
                Join First
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((member) => (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-display text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {member.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>CONFIRMED</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {member.role}
                    </div>

                    {member.assignedGear && (
                      <div className="mt-2 text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500">Gear:</span> {member.assignedGear}
                      </div>
                    )}

                    {member.notes && (
                      <p className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 italic">
                        &ldquo;{member.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>ETA {member.eta}</span>
                    </span>
                    <span>R4 FLOOR 9</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RSVP Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 transition-colors"
              aria-label="Close RSVP form"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 space-y-1">
              <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                RSVP PROTOCOL
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Pledge Attendance at R4 914
              </h3>
              <p className="text-xs text-slate-400">
                Join the midnight strike squad on 30th September at 12:00 AM.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Adv. Rushan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                    Squad Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {ROLE_PRESETS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                    ETA
                  </label>
                  <select
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {ETA_PRESETS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {role === 'Custom' && (
                <div>
                  <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                    Custom Role
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Tactical Whistle Blower"
                    className="w-full px-3.5 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {eta === 'Custom' && (
                <div>
                  <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                    Custom ETA
                  </label>
                  <input
                    type="text"
                    value={customEta}
                    onChange={(e) => setCustomEta(e.target.value)}
                    placeholder="e.g. 11:58 PM sharp"
                    className="w-full px-3.5 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                  Squad Assignment
                </label>
                <select
                  value={assignedGear}
                  onChange={(e) => setAssignedGear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {SQUAD_ASSIGNMENT_PRESETS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                  Optional Mission Note
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bringing the birthday cake directly from canteen..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-950"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Pledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
