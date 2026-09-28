import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Send, MessageSquareHeart, Flame, AlertCircle, RefreshCw } from 'lucide-react';
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

      success('Wish posted. R4 914 has recorded your message.');
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
    <section id="wishes" className="py-20 md:py-28 border-t border-slate-900 bg-slate-950/70 content-visibility-auto">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <RealtimeStatus status={connectionStatus} />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-400">
              COMMUNITY LOG
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Birthday Wishes & Friendly Roasts
          </h2>

          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Leave a live message for Sahaj before the 12:00 AM midnight raid at R4 914. Synchronized in real time.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-12 p-6 sm:p-8 rounded-2xl glass-panel shadow-2xl"
        >
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Adv. Rushan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Message Tone
              </label>
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
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
                  <span>Sweet Birthday Wish</span>
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

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Message *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isRoast
                  ? "e.g. Sahaj bhai, door 914 won't save you tonight! Treat ready rakhna..."
                  : "e.g. Happy 21st Birthday Sahaj! May this year bring endless success and happiness..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Broadcasting live to all connected visitors via Supabase
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-950"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post Message'}</span>
            </button>
          </div>
        </form>

        {/* Wishes List */}
        <div className="mt-12 space-y-4">
          {loading ? (
            /* Skeleton Loading */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl glass-panel animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 w-32 bg-slate-800 rounded" />
                    <div className="h-5 w-16 bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State with Retry */
            <div className="p-8 rounded-2xl glass-panel text-center max-w-lg mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          ) : wishes.length === 0 ? (
            /* Empty State */
            <div className="p-12 rounded-2xl glass-panel text-center max-w-lg mx-auto border-dashed border-slate-700/60">
              <MessageSquareHeart className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-white mb-1">No Messages Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Be the first to leave a birthday blessing or friendly hostel roast for Sahaj!
              </p>
            </div>
          ) : (
            /* Messages List */
            wishes.map((item) => {
              const liked = hasLiked(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl glass-panel glass-panel-hover transition-all animate-in fade-in duration-300 ${
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
                        {item.isRoast ? 'Hostel Roast' : 'Birthday Wish'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLike(item.id)}
                      className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        liked
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-slate-700'
                      }`}
                      title={liked ? 'Already liked' : 'Like message'}
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
                    <span>TRANSMITTED TO R4 914</span>
                    <span>
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      ·{' '}
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
