import React from 'react';
import { Volume2, VolumeX, Flame } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerAlert: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  soundEnabled,
  onToggleSound,
  onTriggerAlert,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-950/40 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand title, single element */}
        <a
          href="#countdown"
          className="font-display text-lg font-extrabold tracking-tight text-white hover:text-rose-400 transition-colors"
        >
          Sahaj Birthday · R4 914
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#countdown"
            className="hover:text-white transition-colors"
          >
            Countdown
          </a>
          <a
            href="#simulator"
            className="hover:text-white transition-colors text-rose-300 font-semibold"
          >
            GPL Target Practice
          </a>
          <a
            href="#directive"
            className="hover:text-white transition-colors"
          >
            R4 914 Directive
          </a>
          <a
            href="#materials"
            className="hover:text-white transition-colors"
          >
            Materials
          </a>
          <a
            href="#squad"
            className="hover:text-white transition-colors"
          >
            Squad Roster
          </a>
          <a
            href="#wishes"
            className="hover:text-white transition-colors"
          >
            Wishes & Roasts
          </a>
        </nav>

        {/* Zone 3: 1-2 primary functional actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) sound.playTick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
            title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          <button
            onClick={onTriggerAlert}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 active:scale-95 transition-all whitespace-nowrap shadow-sm shadow-rose-900/50"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Raid Siren</span>
          </button>
        </div>
      </div>
    </header>
  );
};
