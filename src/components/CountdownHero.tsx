import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, MapPin, Calendar, Clock, RotateCcw, AlertTriangle, ArrowRight, Crosshair } from 'lucide-react';
import { sound } from '../utils/sound';

interface CountdownHeroProps {
  onOpenSquadModal: () => void;
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({ onOpenSquadModal }) => {
  // Target: 30th September 2026 at 00:00:00 (12:00 AM Midnight)
  const [targetDate, setTargetDate] = useState<Date>(() => {
    return new Date(2026, 8, 30, 0, 0, 0); // Month 8 is September
  });

  const [simulatedMidnight, setSimulatedMidnight] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    totalMs: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    totalMs: 0,
  });

  const isExpired = simulatedMidnight || timeLeft.totalMs <= 0;

  useEffect(() => {
    const updateCountdown = () => {
      if (simulatedMidnight) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          totalMs: 0,
        });
        return;
      }

      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          totalMs: 0,
        });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const milliseconds = Math.floor((difference % 1000) / 10);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          milliseconds,
          totalMs: difference,
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 42); // Smooth ~24fps update

    return () => clearInterval(timer);
  }, [targetDate, simulatedMidnight]);

  const triggerConfettiExplosion = () => {
    sound.playCelebrationHorn();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
    });
  };

  const handleSimulateMidnight = () => {
    setSimulatedMidnight(true);
    triggerConfettiExplosion();
  };

  const handleResetCountdown = () => {
    setSimulatedMidnight(false);
    setTargetDate(new Date(2026, 8, 30, 0, 0, 0));
    sound.playTick();
  };

  return (
    <section id="countdown" className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-radial-spotlight">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-rose-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 right-1/4 w-[450px] h-[350px] bg-emerald-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Directive Kicker */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-rose-300 text-xs font-mono font-semibold uppercase tracking-wider mb-8 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>OPERATION SAHAJ GPL · TARGET R4 914</span>
        </div>

        {/* Primary Headline with editorial typography */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
          Sahaj&apos;s Midnight Birthday Countdown
        </h1>

        <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero hour locked for <strong className="text-white font-bold">30th September at 12:00 AM Midnight</strong>.
          The strike squad will breach <strong className="text-rose-400 font-bold">Hostel Room R4 914</strong> to execute the mandatory birthday protocol.
        </p>

        {/* Tactical Key Metadata */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-slate-200">Wednesday, 30 September 2026</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-200">12:00:00 AM (Midnight Sharp)</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">Hostel Room R4 914 · Floor 9</span>
          </div>
        </div>

        {/* Main Countdown Display Cards */}
        <div className="mt-14 max-w-4xl mx-auto">
          {isExpired ? (
            <div className="p-8 sm:p-14 rounded-3xl glass-panel border-2 border-rose-500/80 shadow-2xl text-center animate-pulse-glow">
              <div className="inline-flex p-3 rounded-2xl bg-rose-600/30 text-rose-300 mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-400 animate-bounce" />
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                IT IS 12:00 AM! BREACH ROOM 914!
              </h2>
              <p className="mt-4 text-base sm:text-lg text-rose-200/90 max-w-xl mx-auto leading-relaxed">
                All units move in! Belts, chilled eggs, rods, stick, and chocolate cake are live. Wish Sahaj a legendary 21st birthday!
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={triggerConfettiExplosion}
                  className="min-h-[44px] px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm transition-transform active:scale-95 shadow-xl shadow-rose-950/80 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Launch Birthday Confetti</span>
                </button>
                {simulatedMidnight && (
                  <button
                    onClick={handleResetCountdown}
                    className="min-h-[44px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Resume Live Clock</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {/* Days */}
              <div className="p-6 sm:p-8 rounded-2xl glass-panel glass-panel-hover">
                <div className="font-tabular text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-rose-400">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="p-6 sm:p-8 rounded-2xl glass-panel glass-panel-hover">
                <div className="font-tabular text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-400">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="p-6 sm:p-8 rounded-2xl glass-panel glass-panel-hover">
                <div className="font-tabular text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Minutes
                </div>
              </div>

              {/* Seconds + Milliseconds */}
              <div className="p-6 sm:p-8 rounded-2xl glass-panel glass-panel-hover">
                <div className="flex items-baseline justify-center gap-1 font-tabular text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-xl sm:text-2xl text-slate-500 font-normal">
                    .{String(timeLeft.milliseconds).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-sky-400">
                  Seconds
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href="#simulator"
            className="min-h-[44px] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 rounded-xl transition-all shadow-xl shadow-rose-950/80 active:scale-95 flex items-center gap-2"
          >
            <Crosshair className="w-4 h-4" />
            <span>Practice GPL on Sahaj</span>
          </a>

          <button
            onClick={onOpenSquadModal}
            className="min-h-[44px] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-xl transition-colors shadow-lg shadow-emerald-950/40"
          >
            Pledge Attendance
          </button>

          <a
            href="#directive"
            className="min-h-[44px] px-5 py-3 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/5 rounded-xl transition-colors"
          >
            Read Raid Directive
          </a>

          <a
            href="#materials"
            className="min-h-[44px] px-5 py-3 text-xs sm:text-sm font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 rounded-xl transition-colors"
          >
            Check 5 Materials
          </a>
        </div>

        {/* Simulated Midnight Preview Button */}
        {!isExpired && (
          <div className="mt-6">
            <button
              onClick={handleSimulateMidnight}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors font-mono"
            >
              [Preview 12:00 AM Midnight Strike Simulation]
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
