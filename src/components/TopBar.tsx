import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Flame, Menu, X, Crosshair, Users, Sparkles, CheckCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerAlert: () => void;
}

const NAV_LINKS = [
  { href: '#countdown', label: 'Countdown' },
  { href: '#simulator', label: 'Target Practice', highlight: true },
  { href: '#directive', label: 'R4 914 Directive' },
  { href: '#materials', label: 'Arsenal' },
  { href: '#squad', label: 'Squad Roster' },
  { href: '#wishes', label: 'Wishes & Roasts' },
];

export const TopBar: React.FC<TopBarProps> = ({
  soundEnabled,
  onToggleSound,
  onTriggerAlert,
}) => {
  const [activeSection, setActiveSection] = useState('countdown');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['countdown', 'simulator', 'directive', 'materials', 'squad', 'wishes'];
      const scrollPos = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <a
            href="#countdown"
            className="flex items-center gap-2 font-display text-base sm:text-lg font-extrabold tracking-tight text-white hover:text-rose-400 transition-colors"
          >
            <span className="p-1 rounded-lg bg-rose-600/20 text-rose-500 border border-rose-500/30">
              <Flame className="w-4 h-4 fill-rose-500" />
            </span>
            <span>SAHAJ · R4 914</span>
          </a>
        </div>

        {/* Desktop Nav with Active Section Underline/Pill */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-slate-900/60 border border-white/5 text-xs font-semibold text-slate-300">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.replace('#', '');
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/10 font-bold'
                    : link.highlight
                    ? 'text-rose-300 hover:text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Functional Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) sound.playTick();
            }}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900/80 border border-white/5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
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

          {/* Emergency Raid Siren Modal Trigger */}
          <button
            onClick={onTriggerAlert}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all shadow-md shadow-rose-950/60"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Raid Siren</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-h-[40px] p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/5"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-3 duration-200">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
