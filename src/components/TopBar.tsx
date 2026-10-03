import React, { useState, useEffect } from 'react';
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
  const [isPastIntro, setIsPastIntro] = useState(false);

  useEffect(() => {
    let ticking = false;
    let lastPastIntro = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Intro container is ~440vh. Threshold to reveal sticky nav is around 3.2 viewports
          const pastIntro = window.scrollY >= window.innerHeight * 3.2;
          if (pastIntro !== lastPastIntro) {
            lastPastIntro = pastIntro;
            setIsPastIntro(pastIntro);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // During cinematic hero, TopBar stays invisible to prevent any duplicate branding.
  // It smoothly emerges once the user scrolls into the downstream sections.
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isPastIntro
          ? 'bg-[#030712]/95 backdrop-blur-xl border-b border-white/5 py-3 opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Single Canonical Brand / Logo */}
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] text-white">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <a href="#simulator" className="hover:text-rose-400 transition-colors">
            SAHAJ &bull; R4 914
          </a>
        </div>

        {/* GPL Nav Target */}
        <nav className="flex items-center text-xs font-mono">
          <a
            href="#simulator"
            className="px-3.5 py-1.5 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider transition-all"
          >
            GPL
          </a>
        </nav>

        {/* Downstream Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) sound.playTick();
            }}
            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 bg-black/60 border border-white/10 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Audio</span>
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
            className="min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl hover:from-rose-500 hover:to-rose-400 transition-all shadow-md shadow-rose-950/60 uppercase"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Siren</span>
          </button>
        </div>

      </div>
    </header>
  );
};
