import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Send, MessageSquareHeart, Radio, Trash2 } from 'lucide-react';
import { BirthdayWish } from '../types';
import { sound } from '../utils/sound';
import { localStore } from '../utils/storage';

export const WishWall: React.FC = () => {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [isRoast, setIsRoast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sahaj_liked_wishes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const unsubscribe = localStore.subscribe<BirthdayWish[]>('wishes', (list) => {
      setWishes(list || []);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLike = (id: string) => {
    if (likedMap[id]) return;

    sound.playTick();
    const updatedMap = { ...likedMap, [id]: true };
    setLikedMap(updatedMap);
    localStorage.setItem('sahaj_liked_wishes', JSON.stringify(updatedMap));

    localStore.likeWish(id);
  };

  const handleDelete = (id: string) => {
    localStore.deleteWish(id);
    sound.playTick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      sound.playCelebrationHorn();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      localStore.addWish({
        author: author.trim(),
        message: message.trim(),
        isRoast,
      });

      setAuthor('');
      setMessage('');
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="wishes" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950/60">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold mb-2">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Live Database Active</span>
          </div>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Birthday Wishes & Friendly Roasts
          </h2>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Leave a live message for Sahaj before the 12:00 AM midnight raid at R4 914!
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tone Mode
              </label>
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoast(false)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
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
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isRoast
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Friendly Hostel Roast 🔥</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Message for Sahaj *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isRoast
                  ? 'Drop a funny roast about room 914 or his birthday bumps...'
                  : 'Wish Sahaj a fantastic birthday filled with success and happiness...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-rose-950 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post to Live Wall'}</span>
            </button>
          </div>
        </form>

        {/* Wishes List */}
        {loading ? (
          <div className="mt-10 py-12 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm">Loading wishes from live database...</p>
          </div>
        ) : wishes.length === 0 ? (
          <div className="mt-10 p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <MessageSquareHeart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="font-display font-bold text-white text-lg">No Messages Yet</h4>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              Be the first to leave a birthday message or roast for Sahaj!
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishes.map((w) => (
              <div
                key={w.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors group relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-display font-bold text-white text-sm">
                      {w.author}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          w.isRoast
                            ? 'text-amber-300 bg-amber-950/40 border-amber-800/40'
                            : 'text-rose-300 bg-rose-950/40 border-rose-800/40'
                        }`}
                      >
                        {w.isRoast ? 'Hostel Roast 🔥' : 'Birthday Wish 🎂'}
                      </span>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete wish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    &ldquo;{w.message}&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleLike(w.id)}
                    disabled={likedMap[w.id]}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                      likedMap[w.id]
                        ? 'text-rose-400 bg-rose-950/30'
                        : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        likedMap[w.id] ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span className="font-tabular font-medium">{w.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
