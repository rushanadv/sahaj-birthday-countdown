import React, { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle2, Shield, Clock, Trash2, Radio } from 'lucide-react';
import { SquadMember } from '../types';
import { sound } from '../utils/sound';
import { localStore } from '../utils/storage';

interface SquadRosterProps {
  modalOpen?: boolean;
  onCloseModal?: () => void;
}

export const SquadRoster: React.FC<SquadRosterProps> = () => {
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [role, setRole] = useState('GPL Striker');
  const [assignedGear, setAssignedGear] = useState('1) Belts (Leather Strap)');
  const [eta, setEta] = useState('11:50 PM');
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time synchronization with localStore
  useEffect(() => {
    const unsubscribe = localStore.subscribe<SquadMember[]>('squad', (list) => {
      setSquad(list || []);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      sound.playTick();

      localStore.addSquadMember({
        name: name.trim(),
        role: role.trim() || 'GPL Striker',
        assignedGear,
        eta,
        confirmed: true,
        notes: notes.trim(),
      });

      // Play celebration horn on acceptance
      sound.playCelebrationHorn();

      setName('');
      setNotes('');
      setShowAddForm(false);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj.message || 'Failed to submit pledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (id: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from the R4 914 attendance roster?`)) return;
    localStore.deleteSquadMember(id);
    sound.playTick();
  };

  return (
    <section id="squad" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold mb-2">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live Database Active</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              R4 914 Deployment Squad
            </h2>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl">
              Live RSVP roster for everyone who accepts to come to R4 914 on 30th September at 12:00 AM Midnight.
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              sound.playTick();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-950 shrink-0 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Accept & Pledge Attendance'}</span>
          </button>
        </div>

        {/* Add Operative Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-emerald-500/30 max-w-2xl mx-auto shadow-2xl animate-in fade-in duration-200"
          >
            <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Confirm Your Attendance at R4 914</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operative Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Belts Specialist, Door Breaker"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assigned Material
                </label>
                <select
                  value={assignedGear}
                  onChange={(e) => setAssignedGear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1) Belts (Leather Strap)">1) Belts (Leather Strap)</option>
                  <option value="2) Rods (Intimidation Bar)">2) Rods (Intimidation Bar)</option>
                  <option value="3) Eggs (Artillery)">3) Eggs (Artillery)</option>
                  <option value="4) Stick (Hostel Lathi)">4) Stick (Hostel Lathi)</option>
                  <option value="5) Dumbbell (Door Stopper)">5) Dumbbell (Door Stopper)</option>
                  <option value="Birthday Cake & Candles">Birthday Cake & Candles</option>
                  <option value="High-Res 4K Camera">High-Res 4K Camera</option>
                  <option value="Cheering & Chorus">Cheering & Chorus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Arrival ETA at R4 9th Floor
                </label>
                <select
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="11:45 PM">11:45 PM (Early Recon)</option>
                  <option value="11:50 PM">11:50 PM (Corridor formation)</option>
                  <option value="11:55 PM">11:55 PM (Outside Room 914)</option>
                  <option value="12:00 AM Sharp">12:00 AM Sharp (Breach moment)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hostel Mission Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bringing extra belts and candles"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving to Database...' : 'Confirm Pledge to R4 914'}
              </button>
            </div>
          </form>
        )}

        {/* Squad Members Cards */}
        {loading ? (
          <div className="mt-10 py-12 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm">Connecting to cloud database...</p>
          </div>
        ) : squad.length === 0 ? (
          <div className="mt-10 p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="font-display font-bold text-white text-lg">No Attendees Registered Yet</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              Be the first to accept and pledge your attendance for Sahaj&apos;s birthday midnight raid at R4 914!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Accept & Pledge Now</span>
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {squad.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-base leading-tight">
                          {member.name}
                        </h4>
                        <span className="text-xs text-slate-400">{member.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accepted</span>
                      </span>
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Remove attendee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Gear:</span>
                      <span className="font-semibold text-slate-200 text-right truncate max-w-[170px]">
                        {member.assignedGear}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>ETA:</span>
                      <span className="font-tabular font-medium text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {member.eta}
                      </span>
                    </div>
                  </div>
                </div>

                {member.notes && (
                  <div className="mt-3 text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    &ldquo;{member.notes}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Counter Summary */}
        <div className="mt-8 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 gap-3">
          <div>
            Total Confirmed Operatives:{' '}
            <strong className="text-white font-tabular">{squad.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Users className="w-4 h-4" />
            <span>Synced in real-time across all devices</span>
          </div>
        </div>

      </div>
    </section>
  );
};
