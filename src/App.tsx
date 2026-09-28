import { useState } from 'react';
import confetti from 'canvas-confetti';
import { TopBar } from './components/TopBar';
import { CountdownHero } from './components/CountdownHero';
import { MissionDirective } from './components/MissionDirective';
import { MaterialsArsenal } from './components/MaterialsArsenal';
import { GplSimulator } from './components/GplSimulator';
import { SquadRoster } from './components/SquadRoster';
import { WishWall } from './components/WishWall';
import { Footer } from './components/Footer';
import { ToastProvider } from './context/ToastContext';
import { sound } from './utils/sound';
import { AlertTriangle, Sparkles, X, Volume2 } from 'lucide-react';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sirenActive, setSirenActive] = useState(false);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.enabled = nextState;
  };

  const triggerRaidSiren = () => {
    setSirenActive(true);
    sound.playAlarmSiren();
  };

  const handleConfetti = () => {
    sound.playCelebrationHorn();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const scrollToSquad = () => {
    const el = document.getElementById('squad');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-rose-500 selection:text-white flex flex-col bg-tactical-grid">
        {/* Top Bar with Active Tracking & Audio Controls */}
        <TopBar
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onTriggerAlert={triggerRaidSiren}
        />

        {/* Main Content Sections */}
        <main className="flex-1">
          {/* Hero with Countdown Clock to 30th September 12:00 AM */}
          <CountdownHero onOpenSquadModal={scrollToSquad} />

          {/* GPL Live Target Practice Simulator (Placed directly after countdown) */}
          <GplSimulator />

          {/* The Exact R4 914 Mission Directive */}
          <MissionDirective />

          {/* The 5 Required Materials Checklist */}
          <MaterialsArsenal />

          {/* Strike Squad Roster & Pledge (Realtime Supabase) */}
          <SquadRoster />

          {/* Wishes and Roasts Wall (Realtime Supabase) */}
          <WishWall />
        </main>

        {/* Quiet Footer */}
        <Footer />

        {/* Emergency Raid Siren Modal */}
        {sirenActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-rose-950/95 to-slate-950/95 border-2 border-rose-600/80 p-6 sm:p-8 shadow-2xl shadow-rose-950/90 text-center animate-pulse-glow">
              <button
                onClick={() => setSirenActive(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 transition-colors"
                aria-label="Close siren alert"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex p-3.5 rounded-2xl bg-rose-600/30 text-rose-400 mb-4 animate-bounce border border-rose-500/30">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>

              <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-1">
                Hostel Emergency Raid Siren Active
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                CODE RED: OPERATION SAHAJ GPL
              </h3>

              <p className="mt-3 text-sm text-rose-200/90 leading-relaxed max-w-md mx-auto">
                Attention all Floor 9 operatives! On <strong className="text-white">30th September at 12:00 AM Midnight</strong>, all strike members converge on <strong className="text-white underline">R4 914</strong>.
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-slate-950/80 border border-rose-900/40 text-xs text-slate-300 text-left space-y-1.5 font-mono">
                <div className="font-bold text-rose-400 uppercase tracking-wider">Tactical Checklist:</div>
                <div>1) Belts secured & folded</div>
                <div>2) Rods prepped for acoustic door rattling</div>
                <div>3) Eggs chilled & ready for deployment</div>
                <div>4) Stick ready for squad command</div>
                <div>5) Dumbbell ready to wedge door 914</div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => sound.playAlarmSiren()}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  <span>Sound Siren Again</span>
                </button>

                <button
                  onClick={handleConfetti}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-rose-950 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Launch Confetti</span>
                </button>

                <button
                  onClick={() => setSirenActive(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Dismiss Siren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
