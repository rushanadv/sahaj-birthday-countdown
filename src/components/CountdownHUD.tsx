import React, { useState, useEffect } from 'react';

// Unambiguous absolute timestamp: 30 September 2026, 00:00:00 IST (UTC+05:30)
// Equivalently: Date.UTC(2026, 8, 29, 18, 30, 0)
export const EVENT_TIME = new Date('2026-09-30T00:00:00+05:30').getTime();

interface CountdownHUDProps {
  variant?: 'hero' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export const CountdownHUD: React.FC<CountdownHUDProps> = ({
  variant = 'hero',
  className = '',
  style,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>(() => {
    const totalSeconds = Math.max(0, Math.floor((EVENT_TIME - Date.now()) / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isExpired: totalSeconds <= 0,
    };
  });

  useEffect(() => {
    const updateCountdown = () => {
      const totalSeconds = Math.max(0, Math.floor((EVENT_TIME - Date.now()) / 1000));
      if (totalSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    updateCountdown();
    // Independent 1-second interval; runs continuously even when visually hidden
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  // ========================================================
  // COMPACT VARIANT (For the back scene technical annotation)
  // ========================================================
  if (variant === 'compact') {
    if (timeLeft.isExpired) {
      return (
        <div
          className={`inline-flex items-center gap-2 font-mono text-xs font-bold text-rose-400 select-none ${className}`}
          style={style}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>RAID ACTIVE &bull; R4 914</span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-2 font-mono text-xs text-slate-300 select-none ${className}`}
        style={style}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400">RAID IN:</span>
        <span
          className="font-bold text-white"
          style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}
        >
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // ========================================================
  // HERO VARIANT (Left negative-space desktop / bottom-center mobile)
  // ========================================================
  if (timeLeft.isExpired) {
    return (
      <div
        className={`flex flex-col items-center md:items-start text-center md:text-left select-none ${className}`}
        style={style}
        aria-live="polite"
      >
        <span className="font-mono text-xs font-bold tracking-[0.2em] text-rose-400 uppercase mb-1">
          RAID ACTIVE
        </span>
        <span className="font-mono text-[11px] text-slate-400 tracking-wider">
          R4 914 &bull; MIDNIGHT PROTOCOL
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center md:items-start text-center md:text-left select-none ${className}`}
      style={style}
      aria-label={`Time until midnight raid: ${timeLeft.days > 0 ? `${timeLeft.days} days, ` : ''}${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
    >
      {/* Tiny Kicker Label */}
      <div className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase mb-2 drop-shadow">
        MIDNIGHT IN
      </div>

      {/* Main Numeric Display with Units Below: 01 : 58 : 21 */}
      <div className="flex items-start justify-center md:justify-start gap-1 sm:gap-2 font-mono drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)]">
        {/* Days (Only shown when days > 0) */}
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
              <span
                className="font-black text-slate-100 leading-none"
                style={{
                  fontSize: 'clamp(36px, 3.8vw, 64px)',
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {pad(timeLeft.days)}
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-2">
                DAYS
              </span>
            </div>
            <div
              className="flex items-center justify-center text-slate-600 font-light select-none px-0.5"
              style={{
                height: 'clamp(36px, 3.8vw, 64px)',
                fontSize: 'clamp(24px, 2.5vw, 42px)',
              }}
            >
              :
            </div>
          </>
        )}

        {/* Hours */}
        <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
          <span
            className="font-black text-slate-100 leading-none"
            style={{
              fontSize: 'clamp(36px, 3.8vw, 64px)',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {pad(timeLeft.hours)}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-2">
            HRS
          </span>
        </div>

        {/* Colon */}
        <div
          className="flex items-center justify-center text-slate-600 font-light select-none px-0.5"
          style={{
            height: 'clamp(36px, 3.8vw, 64px)',
            fontSize: 'clamp(24px, 2.5vw, 42px)',
          }}
        >
          :
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
          <span
            className="font-black text-slate-100 leading-none"
            style={{
              fontSize: 'clamp(36px, 3.8vw, 64px)',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {pad(timeLeft.minutes)}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-2">
            MIN
          </span>
        </div>

        {/* Colon */}
        <div
          className="flex items-center justify-center text-slate-600 font-light select-none px-0.5"
          style={{
            height: 'clamp(36px, 3.8vw, 64px)',
            fontSize: 'clamp(24px, 2.5vw, 42px)',
          }}
        >
          :
        </div>

        {/* Seconds (Urgent Rose Accent) */}
        <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
          <span
            className="font-black text-rose-400 leading-none"
            style={{
              fontSize: 'clamp(36px, 3.8vw, 64px)',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {pad(timeLeft.seconds)}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-rose-400/90 uppercase mt-2">
            SEC
          </span>
        </div>
      </div>

      {/* Subtle Supporting Metadata */}
      <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] text-slate-500 uppercase mt-2.5">
        30 SEPT &bull; R4 914
      </div>
    </div>
  );
};
