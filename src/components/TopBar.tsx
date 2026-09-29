import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Flame, Menu, X, Crosshair } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerAlert: () => void;
}

const NAV_LINKS = [
  { href: '#simulator', label: 'GPL Simulator' },
  { href: '#raid-plan', label: 'Raid Plan' },
  { href: '#squad', label: 'Live Squad' },
  { href: '#wishes', label: 'Transmissions' },
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
      // Intro is approximately 5.5 to 6 viewports tall
      const pastIntroThreshold = window.innerHeight * 3.8;
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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        isPastIntro
          ? 'bg-[#030712]/90 backdrop-blur-xl border-b border-white/5 py-2.5 sm:py-3'
          : 'bg-transparent border-b border-transparent py-4 pointer-events-none'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <a
            href="#simulator"
            className="flex items-center gap-2 font-display text-sm sm:text-base font-black tracking-tight text-white hover:text-rose-400 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-white">
              SAHAJ &bull; R4 914
            </span>
          </a>
        </div>

        {/* Desktop Nav - revealed smoothly once scrolled past cinematic hero */}
        <nav
          className={`hidden md:flex items-center gap-1.5 p-1 rounded-full bg-black/60 border border-white/10 text-xs font-mono transition-all duration-300 pointer-events-auto ${
            isPastIntro ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.replace('#', '');
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 uppercase tracking-wider ${
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

        {/* Functional Actions */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) sound.playTick();
            }}
            className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-300 bg-black/60 border border-white/10 rounded-xl hover:bg-slate-900 hover:text-white transition-colors backdrop-blur-md"
            title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Emergency Raid Siren Modal Trigger */}
          <button
            onClick={onTriggerAlert}
            className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all shadow-md shadow-rose-950/60 uppercase tracking-wider"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Raid Siren</span>
          </button>

          {/* Mobile Menu Toggle Button (only when past intro) */}
          {isPastIntro && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[38px] p-2 text-slate-400 hover:text-white rounded-xl bg-black/60 border border-white/10"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && isPastIntro && (
        <div className="md:hidden border-t border-white/10 bg-[#030712]/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-3 duration-200 font-mono text-xs pointer-events-auto">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
