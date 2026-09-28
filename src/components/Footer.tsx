import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-14 text-slate-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-display text-base font-bold text-slate-200">
              Sahaj Birthday Countdown · Operation R4 914
            </div>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              Hostel Block R4, Room 914 · 30th September at 12:00 AM Midnight.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#countdown" className="hover:text-white transition-colors">
              Countdown
            </a>
            <a href="#simulator" className="hover:text-rose-400 transition-colors">
              GPL Practice
            </a>
            <a href="#directive" className="hover:text-white transition-colors">
              Directive
            </a>
            <a href="#materials" className="hover:text-white transition-colors">
              Materials
            </a>
            <a href="#squad" className="hover:text-white transition-colors">
              Squad Roster
            </a>
            <a href="#wishes" className="hover:text-white transition-colors">
              Wishes & Roasts
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-slate-500 font-mono">
          Strictly brotherly love — hostel memories that last forever for our brother Sahaj.
        </div>
      </div>
    </footer>
  );
};
