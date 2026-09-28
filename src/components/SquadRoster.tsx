import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Shield,
  Clock,
  Radio,
  AlertCircle,
  X,
  Sparkles,
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

      // Reset and close
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
    <section id="squad" className="py-20 md:py-28 border-t border-slate-900 bg-slate-950 content-visibility-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <RealtimeStatus status={connectionStatus} />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
                LIVE SQUAD · {participants.length} CONFIRMED
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              R4 914 Deployment Squad
            </h2>

            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Official attendance roster for the midnight operation at room 914. Only verified real RSVPs appear below.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => {
                setModalOpen(true);
                sound.playTick();
              }}
              className="flex items-center gap-2.5 min-h-[44px] px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/70 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Accept & Pledge Attendance</span>
            </button>
          </div>
        </div>

        {/* Squad Grid / States */}
        <div className="mt-10">
          {loading ? (
            /* Skeleton Loading State */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl glass-panel animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-slate-800 rounded-md" />
                      <div className="h-3 w-20 bg-slate-800/60 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-4 w-48 bg-slate-800/40 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State with Retry */
            <div className="p-8 rounded-2xl glass-panel text-center max-w-lg mx-auto">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-white mb-2">Couldn't Reach HQ</h3>
              <p className="text-sm text-slate-400 mb-5">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : participants.length === 0 ? (
            /* Empty State */
            <div className="p-12 rounded-2xl glass-panel text-center max-w-xl mx-auto border-dashed border-slate-700/60">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-950/40 text-emerald-400 mb-4 border border-emerald-800/30">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">HQ Standby</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                Be the first operative to confirm attendance at R4 914 for Sahaj's midnight birthday bumps!
              </p>
              <button
                onClick={() => {
                  setModalOpen(true);
                  sound.playTick();
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950"
              >
                <UserPlus className="w-4 h-4" />
                <span>Pledge Attendance Now</span>
              </button>
            </div>
          ) : (
            /* Live Real Squad Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {participants.map((member) => (
                <div
                  key={member.id}
                  className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-display text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {member.name}
                        </h4>
                        <span className="text-xs font-medium text-emerald-400">
                          {member.role}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono font-semibold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>CONFIRMED</span>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      {member.assignedGear && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-500 font-mono text-[10px] uppercase">Assignment:</span>
                          <span className="font-medium text-slate-200">{member.assignedGear}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>ETA: <strong className="text-amber-300 font-mono">{member.eta}</strong></span>
                      </div>

                      {member.notes && (
                        <p className="mt-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-300 italic leading-relaxed">
                          &ldquo;{member.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>HOSTEL CORRIDOR SQUAD</span>
                    <span>{new Date(member.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RSVP Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border-emerald-500/30 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900/60 transition-colors"
              aria-label="Close RSVP form"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Pledge Attendance at R4 914
                </h3>
                <p className="text-xs text-slate-400">
                  Join the midnight strike squad on 30th September at 12:00 AM.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Adv. Rushan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Squad Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {ROLE_PRESETS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Time of Arrival (ETA)
                  </label>
                  <select
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Specify Custom Role
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Tactical Whistle Blower"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              {eta === 'Custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Specify Custom ETA
                  </label>
                  <input
                    type="text"
                    value={customEta}
                    onChange={(e) => setCustomEta(e.target.value)}
                    placeholder="e.g. 11:58 PM sharp"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Squad Assignment (Optional / Playful)
                </label>
                <select
                  value={assignedGear}
                  onChange={(e) => setAssignedGear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {SQUAD_ASSIGNMENT_PRESETS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Mission Note
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bringing the birthday cake directly from canteen..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-950"
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
