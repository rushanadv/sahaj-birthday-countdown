import React, { useState, useEffect } from 'react';

// Exact zero-hour event timestamp in IST (Indian Standard Time, UTC+05:30)
// Wednesday, 30 September 2026 at 00:00:00 IST
export const RAID_EVENT_TIMESTAMP = new Date('2026-09-30T00:00:00+05:30').getTime();

interface CountdownHUDProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export const CountdownHUD: React.FC<CountdownHUDProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>(() => {
    const diff = Math.max(0, RAID_EVENT_TIMESTAMP - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isExpired: diff <= 0,
    };
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, RAID_EVENT_TIMESTAMP - now);

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    // Independent 1-second interval; completely decoupled from RAF scroll loop
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format numbers with leading zeros
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  // COMPACT VARIANT (Used during back shot or as a technical annotation)
  if (variant === 'compact') {
    if (timeLeft.isExpired) {
      return (
        <div className={`inline-flex items-center gap-2 font-mono text-xs font-bold text-rose-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>RAID ACTIVE · R4 914</span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 font-mono text-xs text-slate-300 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400">RAID IN:</span>
        <span className="font-bold text-white font-tabular">
          {pad(timeLeft.hours + timeLeft.days * 24)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // HERO VARIANT (Rendered on front stage)
  if (timeLeft.isExpired) {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <div className="font-mono text-xs font-bold tracking-[0.25em] text-rose-400 uppercase mb-2 animate-pulse">
          ZERO HOUR REACHED · 30 SEPTEMBER 00:00
        </div>
        <div className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
          RAID ACTIVE
        </div>
        <div className="font-mono text-xs text-rose-300/90 tracking-widest mt-2 uppercase">
          BREACH ROOM R4 914 NOW
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Kicker label */}
      <div className="font-mono text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-slate-400 uppercase mb-2 drop-shadow">
        COUNTDOWN TO 30 SEPT &bull; 00:00:00 IST
      </div>

      {/* Main Countdown Display: 00 : 02 : 36 : 18 */}
      <div className="flex items-center gap-2 sm:gap-4 font-mono font-black text-3xl sm:text-6xl lg:text-7xl text-white tracking-tight drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]">
        {/* Days */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[85px]">
          <span className="font-tabular leading-none">{pad(timeLeft.days)}</span>
          <span className="text-[9px] sm:text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase mt-1.5">
            DAYS
          </span>
        </div>

        <span className="text-slate-600 text-2xl sm:text-5xl font-light -mt-4">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[85px]">
          <span className="font-tabular leading-none">{pad(timeLeft.hours)}</span>
          <span className="text-[9px] sm:text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase mt-1.5">
            HOURS
          </span>
        </div>

        <span className="text-slate-600 text-2xl sm:text-5xl font-light -mt-4">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[85px]">
          <span className="font-tabular leading-none">{pad(timeLeft.minutes)}</span>
          <span className="text-[9px] sm:text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase mt-1.5">
            MINS
          </span>
        </div>

        <span className="text-slate-600 text-2xl sm:text-5xl font-light -mt-4">:</span>

        {/* Seconds (Subtle rose highlight) */}
        <div className="flex flex-col items-center min-w-[50px] sm:min-w-[85px]">
          <span className="font-tabular leading-none text-rose-400">{pad(timeLeft.seconds)}</span>
          <span className="text-[9px] sm:text-[11px] font-medium tracking-[0.2em] text-rose-400/80 uppercase mt-1.5">
            SECS
          </span>
        </div>
      </div>

      <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-slate-400/80 mt-3 drop-shadow">
        UNTIL MIDNIGHT &bull; ROOM R4 914
      </div>
    </div>
  );
};
