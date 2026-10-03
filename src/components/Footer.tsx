import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#030712] py-12 text-slate-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-2">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
          R4 / 914 &bull; 30.09.2026
        </div>
        <p className="text-xs text-slate-600 font-mono">
          Strictly brotherly love — hostel memories that last forever for our brother Sahaj.
        </p>
      </div>
    </footer>
  );
};

