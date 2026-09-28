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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white flex flex-col">
      {/* Top Bar with Strict Contract */}
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

        {/* Strike Squad Roster & Pledge */}
        <SquadRoster />

        {/* Wishes and Roasts Wall */}
        <WishWall />
      </main>

      {/* Quiet Footer */}
      <Footer />

      {/* Emergency Raid Siren Modal */}
      {sirenActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-rose-950 to-slate-950 border-2 border-rose-600 p-6 sm:p-8 shadow-2xl shadow-rose-950/80 text-center animate-pulse-glow">
            <button
              onClick={() => setSirenActive(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900/60"
              aria-label="Close siren alert"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex p-3 rounded-full bg-rose-600/30 text-rose-400 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              Hostel Emergency Raid Siren Active
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              CODE RED: OPERATION SAHAJ GPL
            </h3>

            <p className="mt-3 text-sm text-rose-200 leading-relaxed">
              Attention all Floor 9 operatives! On <strong className="text-white">30th September at 12:00 AM Midnight</strong>, all strike members converge on <strong className="text-white underline">R4 914</strong>.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 text-xs text-slate-300 text-left space-y-1">
              <div className="font-semibold text-rose-400">Tactical Checklist:</div>
              <div>1) Belts secured & folded</div>
              <div>2) Rods prepped for acoustic door rattling</div>
              <div>3) Eggs chilled & ready for deployment</div>
              <div>4) Stick ready for squad command</div>
              <div>5) Dumbbell ready to wedge door 914</div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  sound.playAlarmSiren();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>Sound Siren Again</span>
              </button>

              <button
                onClick={handleConfetti}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-rose-950"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Confetti</span>
              </button>

              <button
                onClick={() => setSirenActive(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Dismiss Siren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
