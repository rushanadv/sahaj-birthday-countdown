import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Send, MessageSquareHeart, Flame, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { useToast } from '../context/ToastContext';
import { sound } from '../utils/sound';
import { RealtimeStatus } from './RealtimeStatus';

export const WishWall: React.FC = () => {
  const { wishes, loading, error, connectionStatus, postWish, onLikeWish, hasLiked, refetch } =
    useWishes();
  const { success, error: toastError } = useToast();

  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [isRoast, setIsRoast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLike = async (id: string) => {
    if (hasLiked(id)) {
      toastError('Already liked from this device');
      return;
    }

    try {
      sound.playTick();
      await onLikeWish(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not register like';
      toastError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAuthor = author.trim();
    const cleanMessage = message.trim();

    if (!cleanAuthor) {
      setFormError('Please enter your name');
      return;
    }
    if (!cleanMessage) {
      setFormError('Please write a message');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      sound.playCelebrationHorn();
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.8 },
      });

      await postWish({
        author: cleanAuthor,
        message: cleanMessage,
        is_roast: isRoast,
      });

      success('Transmission logged. R4 914 has recorded your message.');
      setAuthor('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reach HQ. Try again.';
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="wishes" className="py-24 sm:py-32 border-t border-white/5 bg-[#030712] relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-3">
            <RealtimeStatus status={connectionStatus} />
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-rose-400">
              COMMUNITY TRANSMISSIONS &bull; {wishes.length} LOGGED
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight">
            Transmissions for Sahaj
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            Leave an indelible midnight note, blessing, or hostel roast for Sahaj. Synchronized in real time across all devices.
          </p>
        </div>

        {/* Transmission Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl"
        >
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Adv. Rushan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors font-sans"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
                Transmission Tone
              </label>
              <div className="flex gap-2 p-1 bg-black rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoast(false)}
                  className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    !isRoast
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquareHeart className="w-3.5 h-3.5" />
                  <span>Birthday Blessing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoast(true)}
                  className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isRoast
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hostel Roast 🔥</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 font-mono text-xs">
            <label className="block text-slate-300 mb-1.5 uppercase font-semibold">
              Transmission Message *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isRoast
                  ? "e.g. Sahaj bhai, door 914 won't save you tonight! Treat ready rakhna..."
                  : "e.g. Happy 21st Birthday Sahaj! May this year bring endless happiness and victories..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors font-sans"
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-slate-500">
              Broadcasting to Room 914 via realtime pipeline
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-950"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting...' : 'Dispatch Note'}</span>
            </button>
          </div>
        </form>

        {/* Transmission Cards List */}
        <div className="mt-12 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 animate-pulse space-y-3">
                  <div className="h-5 w-32 bg-slate-800 rounded" />
                  <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
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
                <span>Retry Loading</span>
              </button>
            </div>
          ) : wishes.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center max-w-md mx-auto space-y-2">
              <Radio className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <h3 className="font-display text-lg font-bold text-white">No Transmissions Yet</h3>
              <p className="text-xs text-slate-400">
                Be the first operative to dispatch a message to Room R4 914!
              </p>
            </div>
          ) : (
            wishes.map((item) => {
              const liked = hasLiked(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl bg-slate-950/80 border transition-all ${
                    item.isRoast ? 'border-amber-500/20' : 'border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-bold text-white text-base">
                        {item.author}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase ${
                          item.isRoast
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {item.isRoast ? 'Roast' : 'Blessing'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLike(item.id)}
                      className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        liked
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-black/60 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-slate-700'
                      }`}
                      title={liked ? 'Already acknowledged' : 'Acknowledge message'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="font-mono font-bold">{item.likes}</span>
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-slate-200 leading-relaxed font-sans">
                    {item.message}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>RECORDED AT R4 914</span>
                    <span>
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      &bull;{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};
