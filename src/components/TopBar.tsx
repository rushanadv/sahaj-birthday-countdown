import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Flame, Menu, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerAlert: () => void;
}

const NAV_LINKS = [
  { href: '#simulator', label: 'GPL' },
  { href: '#raid-plan', label: 'Raid Plan' },
  { href: '#squad', label: 'Squad' },
  { href: '#wishes', label: 'Wishes' },
];

export const TopBar: React.FC<TopBarProps> = ({
  soundEnabled,
  onToggleSound,
  onTriggerAlert,
}) => {
  const [activeSection, setActiveSection] = useState('simulator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPastIntro, setIsPastIntro] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Intro container is 380vh. Threshold to reveal sticky nav is around 2.8 viewports
      const pastIntroThreshold = window.innerHeight * 2.8;
      setIsPastIntro(window.scrollY >= pastIntroThreshold);

      const sections = ['simulator', 'raid-plan', 'squad', 'wishes'];
      const scrollPos = window.scrollY + 180;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
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

        {/* 4 Core Editorial Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-black/60 border border-white/10 text-xs font-mono">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.replace('#', '');
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-150 uppercase tracking-wider ${
                  isActive
                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            );
          })}
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

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-h-[36px] p-2 text-slate-400 hover:text-white rounded-xl bg-black/60 border border-white/10"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#030712] px-4 py-3 space-y-1 font-mono text-xs animate-in slide-in-from-top-2 duration-150">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
