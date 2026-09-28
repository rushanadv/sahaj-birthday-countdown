import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, MapPin, Calendar, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/sound';

interface CountdownHeroProps {
  onOpenSquadModal: () => void;
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({ onOpenSquadModal }) => {
  // Target: 30th September 2026 at 00:00:00 (12:00 AM)
  const [targetDate, setTargetDate] = useState<Date>(() => {
    // Current year is 2026 as per environment time
    const target = new Date(2026, 8, 30, 0, 0, 0); // Month 8 is September (0-indexed)
    return target;
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
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
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
    const timer = setInterval(updateCountdown, 43); // ~24fps update for smooth millisecond visual

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
    <section id="countdown" className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-rose-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 right-1/4 w-[400px] h-[300px] bg-amber-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Subtitle / Directive Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Operation Sahaj Birthday · Mission R4 914</span>
        </div>

        {/* Primary Headline with text-wrap: balance */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight" style={{ textWrap: 'balance' }}>
          Sahaj&apos;s Birthday Countdown
        </h1>

        <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto">
          Target date locked: <strong className="text-white">30th September at 12:00 AM Midnight</strong>.
          The strike squad will assemble at <strong className="text-rose-400">R4 914</strong> to execute the mandatory birthday GPL.
        </p>

        {/* Tactical Key Metadata - Clean typographic layout */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span className="text-slate-200 font-medium">Wednesday, 30 September 2026</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-slate-200 font-medium">12:00:00 AM (Midnight Sharp)</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-medium">Hostel Room R4 914</span>
          </div>
        </div>

        {/* Main Countdown Display Cards */}
        <div className="mt-12 max-w-4xl mx-auto">
          {isExpired ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-rose-950/70 to-slate-950/90 border-2 border-rose-600 shadow-2xl shadow-rose-950/50 text-center animate-pulse-glow">
              <div className="inline-flex p-3 rounded-full bg-rose-600/30 text-rose-300 mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-400 animate-bounce" />
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                IT IS 12:00 AM! SAHAJ IS CAUGHT IN R4 914!
              </h2>
              <p className="mt-3 text-lg text-rose-200 max-w-xl mx-auto">
                All units advance! Belts, rods, eggs, stick, and dumbbells are live.
                Wish our brother Sahaj a legendary birthday!
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={triggerConfettiExplosion}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Birthday Confetti</span>
                </button>
                {simulatedMidnight && (
                  <button
                    onClick={handleResetCountdown}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Resume Live Countdown</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {/* Days */}
              <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="font-tabular text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose-400">
                  Days
                </div>
              </div>

              {/* Hours */}
              <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="font-tabular text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Hours
                </div>
              </div>

              {/* Minutes */}
              <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="font-tabular text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Minutes
                </div>
              </div>

              {/* Seconds + Milliseconds */}
              <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all hover:border-slate-700">
                <div className="flex items-baseline justify-center gap-1 font-tabular text-4xl sm:text-6xl font-bold text-white tracking-tight">
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-xl sm:text-2xl text-slate-500 font-normal">
                    .{String(timeLeft.milliseconds).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-sky-400">
                  Seconds
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#simulator"
            className="px-6 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-900/50 active:scale-95 flex items-center gap-2"
          >
            <span>🎯 Practice GPL on Sahaj</span>
          </a>

          <a
            href="#directive"
            className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            Read R4 914 Raid Plan
          </a>

          <button
            onClick={onOpenSquadModal}
            className="px-6 py-3 text-sm font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-xl transition-colors"
          >
            Pledge Attendance
          </button>

          <a
            href="#materials"
            className="px-6 py-3 text-sm font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 rounded-xl transition-colors"
          >
            Check 5 Materials
          </a>

          {!isExpired && (
            <button
              onClick={handleSimulateMidnight}
              className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-4 transition-colors"
              title="Preview what happens at 12:00 AM midnight"
            >
              Preview 12:00 AM Midnight Strike
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
