import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-display text-base font-bold text-slate-300">
              Sahaj Birthday Countdown · Operation R4 914
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Hostel Block R4, Room 914 · 30th September at 12:00 AM Midnight.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#countdown" className="hover:text-slate-200 transition-colors">
              Countdown
            </a>
            <a href="#simulator" className="hover:text-rose-400 font-medium transition-colors">
              GPL Practice
            </a>
            <a href="#directive" className="hover:text-slate-200 transition-colors">
              Directive
            </a>
            <a href="#materials" className="hover:text-slate-200 transition-colors">
              Materials
            </a>
            <a href="#squad" className="hover:text-slate-200 transition-colors">
              Squad Roster
            </a>
            <a href="#wishes" className="hover:text-slate-200 transition-colors">
              Wishes & Roasts
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900/80 text-center text-xs text-slate-400">
          Crafted with love, laughter, and high-impact leather belts for our brother Sahaj.
        </div>
      </div>
    </footer>
  );
};
