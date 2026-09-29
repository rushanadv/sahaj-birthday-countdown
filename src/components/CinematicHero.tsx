import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGplStats } from '../hooks/useGplStats';
import { useParticipants } from '../hooks/useParticipants';
import { useMaterials } from '../hooks/useMaterials';
import { useWishes } from '../hooks/useWishes';
import { ChevronDown, Crosshair, Users, Activity, Sparkles, Shield, ArrowDown } from 'lucide-react';
import sahajFallbackImg from '../assets/sahaj-target.webp';

interface CinematicHeroProps {
  onSkipToIntroEnd?: () => void;
  onOpenSquadModal?: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  onSkipToIntroEnd,
  onOpenSquadModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Live Supabase telemetry hooks
  const { globalHits } = useGplStats();
  const { participants } = useParticipants();
  const { materials } = useMaterials();
  const { wishes } = useWishes();

  // Loading & accessibility states
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(15);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Active HUD stage index (0 to 7) to avoid re-rendering entire component on every RAF frame
  const [hudStage, setHudStage] = useState(0);
  const [hudProgress, setHudProgress] = useState(0);

  // Countdown timer to 30 September 2026 00:00:00
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // Calculate live countdown
  useEffect(() => {
    const targetDate = new Date(2026, 8, 30, 0, 0, 0).getTime(); // 30 Sept 2026

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Preload and decoder warm-up
  useEffect(() => {
    let mounted = true;
    let v1Ready = false;
    let v2Ready = false;

    const checkReady = () => {
      if (!mounted) return;
      if (v1Ready && v2Ready) {
        setLoadProgress(100);
        setTimeout(() => {
          if (mounted) setIsLoaded(true);
        }, 300);
      } else if (v1Ready || v2Ready) {
        setLoadProgress(65);
      }
    };

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;

    const onV1Meta = () => {
      v1Ready = true;
      checkReady();
    };

    const onV2Meta = () => {
      v2Ready = true;
      checkReady();
    };

    if (v1) {
      if (v1.readyState >= 1) v1Ready = true;
      else v1.addEventListener('loadedmetadata', onV1Meta);
    }
    if (v2) {
      if (v2.readyState >= 1) v2Ready = true;
      else v2.addEventListener('loadedmetadata', onV2Meta);
    }

    checkReady();

    // Fallback timer so user is never stuck in preloader
    const timer = setTimeout(() => {
      if (mounted) {
        setIsLoaded(true);
      }
    }, 2400);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (v1) v1.removeEventListener('loadedmetadata', onV1Meta);
      if (v2) v2.removeEventListener('loadedmetadata', onV2Meta);
    };
  }, []);

  // iOS Safari / WebKit warm-up: allow immediate scrubbing without play-promise errors
  const warmUpVideos = useCallback(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (v1 && v1.paused) {
      v1.play().then(() => v1.pause()).catch(() => {});
    }
    if (v2 && v2.paused) {
      v2.play().then(() => v2.pause()).catch(() => {});
    }
  }, []);

  // Scroll listener & single RAF lerp loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let currentProgress = 0;
    let targetProgress = 0;
    let lastHudStage = 0;

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;

    const updateScrollTarget = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / totalScrollable));
      targetProgress = p;
    };

    const renderLoop = () => {
      // Smooth interpolation for jitter-free scrub
      const delta = targetProgress - currentProgress;
      if (Math.abs(delta) > 0.0001) {
        currentProgress += delta * 0.12;
      } else {
        currentProgress = targetProgress;
      }

      // VIRTUAL TIMELINE MAPPING:
      // Video 1 duration = 8.0s, Video 2 duration = 8.0s
      // Seam transition window: p ∈ [0.46, 0.54]
      // Video 1: 0.0s at p=0.00 -> 7.8s at p=0.54
      // Video 2: 0.0s at p=0.46 -> 8.0s at p=1.00
      const SEAM_START = 0.46;
      const SEAM_END = 0.54;

      if (v1) {
        // Video 1 scrub target
        let t1 = 0;
        if (currentProgress < SEAM_END) {
          t1 = Math.min(7.98, (currentProgress / SEAM_END) * 7.98);
        } else {
          t1 = 7.98;
        }

        if (Math.abs(v1.currentTime - t1) > 0.03 && v1.readyState >= 2) {
          v1.currentTime = t1;
        }

        // Opacity of Video 1
        if (currentProgress <= SEAM_START) {
          v1.style.opacity = '1';
        } else if (currentProgress >= SEAM_END) {
          v1.style.opacity = '0';
        } else {
          // Crossfade window: 1 -> 0
          const ratio = (currentProgress - SEAM_START) / (SEAM_END - SEAM_START);
          v1.style.opacity = String(1 - ratio);
        }
      }

      if (v2) {
        // Video 2 scrub target
        let t2 = 0;
        if (currentProgress <= SEAM_START) {
          t2 = 0.0;
        } else {
          t2 = Math.min(7.98, ((currentProgress - SEAM_START) / (1 - SEAM_START)) * 7.98);
        }

        if (Math.abs(v2.currentTime - t2) > 0.03 && v2.readyState >= 2) {
          v2.currentTime = t2;
        }

        // Opacity of Video 2
        if (currentProgress <= SEAM_START) {
          v2.style.opacity = '0';
        } else if (currentProgress >= SEAM_END) {
          v2.style.opacity = '1';
        } else {
          // Crossfade window: 0 -> 1
          const ratio = (currentProgress - SEAM_START) / (SEAM_END - SEAM_START);
          v2.style.opacity = String(ratio);
        }
      }

      // Determine active HUD stage for discrete telemetry rendering
      // Stage 0: 0.00 - 0.20 (Sahaj front portrait)
      // Stage 1: 0.20 - 0.38 (The Raid Begins At Midnight)
      // Stage 2: 0.38 - 0.50 (Live Squad & Attendees)
      // Stage 3: 0.50 - 0.64 (GPL Telemetry & Hits)
      // Stage 4: 0.64 - 0.76 (Arsenal Status)
      // Stage 5: 0.76 - 0.88 (Raid Directive Milestones)
      // Stage 6: 0.88 - 0.96 (Target Acquired: Sahaj from Behind)
      // Stage 7: 0.96 - 1.00 (Dissolve into Simulator)
      let stage = 0;
      if (currentProgress < 0.20) stage = 0;
      else if (currentProgress < 0.38) stage = 1;
      else if (currentProgress < 0.50) stage = 2;
      else if (currentProgress < 0.64) stage = 3;
      else if (currentProgress < 0.76) stage = 4;
      else if (currentProgress < 0.88) stage = 5;
      else if (currentProgress < 0.96) stage = 6;
      else stage = 7;

      if (stage !== lastHudStage) {
        lastHudStage = stage;
        setHudStage(stage);
      }
      setHudProgress(currentProgress);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', updateScrollTarget, { passive: true });
    window.addEventListener('touchstart', warmUpVideos, { passive: true, once: true });
    window.addEventListener('click', warmUpVideos, { passive: true, once: true });

    updateScrollTarget();
    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('resize', updateScrollTarget);
      window.removeEventListener('touchstart', warmUpVideos);
      window.removeEventListener('click', warmUpVideos);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion, warmUpVideos]);

  // Handle skip to interactive section
  const handleSkipIntro = () => {
    if (onSkipToIntroEnd) {
      onSkipToIntroEnd();
      return;
    }
    const simulatorEl = document.getElementById('simulator');
    if (simulatorEl) {
      simulatorEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ----------------------------------------------------
  // REDUCED MOTION ALTERNATIVE
  // ----------------------------------------------------
  if (prefersReducedMotion) {
    return (
      <section className="relative min-h-screen bg-[#030712] flex flex-col justify-center items-center px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-mono font-semibold uppercase tracking-wider">
            <span>OPERATION R4 914 · 30 SEPTEMBER 2026 · 00:00</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-none">
            SAHAJ
          </h1>

          <p className="text-xl sm:text-2xl font-light text-slate-300">
            THE RAID BEGINS AT MIDNIGHT.
          </p>

          <div className="flex items-center justify-center gap-4 py-6 font-mono text-2xl sm:text-4xl text-rose-400 font-bold">
            <div>
              {String(timeLeft.days).padStart(2, '0')}
              <span className="block text-xs text-slate-400 uppercase">Days</span>
            </div>
            <span>:</span>
            <div>
              {String(timeLeft.hours).padStart(2, '0')}
              <span className="block text-xs text-slate-400 uppercase">Hours</span>
            </div>
            <span>:</span>
            <div>
              {String(timeLeft.minutes).padStart(2, '0')}
              <span className="block text-xs text-slate-400 uppercase">Mins</span>
            </div>
            <span>:</span>
            <div>
              {String(timeLeft.seconds).padStart(2, '0')}
              <span className="block text-xs text-slate-400 uppercase">Secs</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleSkipIntro}
              className="min-h-[44px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl hover:from-rose-500 hover:to-rose-400 transition-all"
            >
              Enter GPL Simulator
            </button>
            {onOpenSquadModal && (
              <button
                onClick={onOpenSquadModal}
                className="min-h-[44px] px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Pledge Attendance ({participants.length} Confirmed)
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Materials quick summary for Stage 4 HUD
  const beltClaimed = materials.find((m) => m.id === 'belt')?.claimedBy?.length || 0;
  const rodsClaimed = materials.find((m) => m.id === 'rod')?.claimedBy?.length || 0;
  const eggsClaimed = materials.find((m) => m.id === 'egg')?.claimedBy?.length || 0;

  // Recent participant names for Stage 2 drifting HUD
  const recentNames = participants.slice(0, 4).map((p) => p.name.toUpperCase());

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#030712]"
      style={{ height: '600vh' }}
    >
      {/* Sticky 100vh Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden select-none"
      >
        {/* ======================================================== */}
        {/* PRELOADER SCREEN */}
        {/* ======================================================== */}
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] transition-opacity duration-700 ${
            isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="max-w-md w-full px-6 text-center space-y-5">
            <div className="font-mono text-xs font-bold tracking-[0.25em] text-rose-400 uppercase">
              SAHAJ · R4 914
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PREPARING MIDNIGHT PROTOCOL
            </h2>
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="font-mono text-[11px] text-slate-500 tracking-wider">
              CALIBRATING ZERO-HOUR TELEMETRY · 30 SEPT 00:00
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DUAL SEAMLESS VIDEO STACK */}
        {/* ======================================================== */}
        {/* Layer A: Video 1 (Front portrait -> mouth entry -> dark rose/emerald tunnel) */}
        <video
          ref={video1Ref}
          src="/videos/intro-1.mp4"
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'opacity',
          }}
        />

        {/* Layer B: Video 2 (Tunnel continuation -> camera emerges -> Sahaj from behind) */}
        <video
          ref={video2Ref}
          src="/videos/intro-2.mp4"
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{
            opacity: 0,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'opacity',
          }}
        />

        {/* Ambient Dark Tunnel Vignette overlay to smooth luminance differences */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 45%, rgba(3, 7, 18, 0.45) 85%, rgba(3, 7, 18, 0.95) 100%)',
            opacity: hudProgress > 0.40 && hudProgress < 0.90 ? 0.75 : 0.35,
          }}
        />

        {/* Bottom gradient mask: gradually emerges at p > 0.92 to dissolve into next section */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none transition-opacity duration-300"
          style={{
            height: '35vh',
            background: 'linear-gradient(to top, #030712 25%, transparent 100%)',
            opacity: hudProgress > 0.88 ? Math.min(1, (hudProgress - 0.88) / 0.12) : 0,
          }}
        />

        {/* ======================================================== */}
        {/* MINIMAL TOP UTILITY OVERLAY */}
        {/* ======================================================== */}
        <div className="absolute top-0 inset-x-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-white/90 drop-shadow">
              SAHAJ · R4 914
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkipIntro}
              className="px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono font-semibold tracking-wider text-slate-300 hover:text-white transition-all active:scale-95"
            >
              SKIP TO SIMULATOR &darr;
            </button>
          </div>
        </div>

        {/* Vertical subtle scroll indicator on right edge */}
        <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-3 font-mono text-[10px] tracking-widest text-slate-400/80 pointer-events-none">
          <span className={hudStage <= 1 ? 'text-white font-bold' : ''}>01 ENTER</span>
          <span className="w-0.5 h-6 bg-white/20 relative overflow-hidden">
            <span
              className="absolute top-0 left-0 right-0 bg-rose-500 transition-all duration-100"
              style={{ height: `${Math.min(100, (hudProgress / 0.38) * 100)}%` }}
            />
          </span>
          <span className={hudStage >= 2 && hudStage <= 5 ? 'text-rose-400 font-bold' : ''}>
            02 TUNNEL
          </span>
          <span className="w-0.5 h-6 bg-white/20 relative overflow-hidden">
            <span
              className="absolute top-0 left-0 right-0 bg-emerald-400 transition-all duration-100"
              style={{
                height: `${
                  hudProgress > 0.38
                    ? Math.min(100, ((hudProgress - 0.38) / 0.50) * 100)
                    : 0
                }%`,
              }}
            />
          </span>
          <span className={hudStage >= 6 ? 'text-emerald-400 font-bold' : ''}>03 TARGET</span>
        </div>

        {/* ======================================================== */}
        {/* 3D FLOATING LIVE-DATA HUD */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-8"
          style={{ perspective: '1000px' }}
        >
          {/* STAGE 0: Initial Sahaj front portrait (p: 0.00 - 0.20) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-4xl ${
              hudStage === 0
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 -translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md font-mono text-[11px] font-semibold text-rose-400 tracking-[0.2em] uppercase mb-4 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>COORDINATES: ROOM R4 914 · FLOOR 9</span>
            </div>

            <h1 className="font-display text-5xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight text-white drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] leading-none">
              SAHAJ
            </h1>

            <div className="mt-8 flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-300 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 animate-bounce">
              <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
              <span>SCROLL DOWN TO INITIATE PROTOCOL</span>
            </div>
          </div>

          {/* STAGE 1: Face approach & "THE RAID BEGINS AT MIDNIGHT" (p: 0.20 - 0.38) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-4xl ${
              hudStage === 1
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-90 translate-y-8 blur-sm pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-rose-400 font-bold mb-3 drop-shadow">
              30 SEPTEMBER 2026 · 00:00:00
            </div>

            <h2 className="font-display text-4xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
              THE RAID<br />BEGINS AT<br />MIDNIGHT.
            </h2>

            {/* Live Countdown telemetry */}
            <div className="mt-8 flex items-center gap-3 sm:gap-6 font-mono text-slate-200 bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
              {timeLeft.isExpired ? (
                <div className="text-rose-400 font-bold text-lg tracking-wider animate-pulse">
                  RAID ACTIVE · BREACH R4 914 NOW
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-2xl sm:text-4xl font-extrabold text-white">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Days
                    </span>
                  </div>
                  <span className="text-slate-600 text-2xl font-light">:</span>
                  <div className="text-center">
                    <span className="text-2xl sm:text-4xl font-extrabold text-white">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Hours
                    </span>
                  </div>
                  <span className="text-slate-600 text-2xl font-light">:</span>
                  <div className="text-center">
                    <span className="text-2xl sm:text-4xl font-extrabold text-white">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Mins
                    </span>
                  </div>
                  <span className="text-slate-600 text-2xl font-light">:</span>
                  <div className="text-center">
                    <span className="text-2xl sm:text-4xl font-extrabold text-rose-400">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Secs
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STAGE 2: Mouth Entry / Tunnel Starts -> LIVE SQUAD (p: 0.38 - 0.50) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-3xl ${
              hudStage === 2
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-emerald-400 font-bold mb-2">
              REALTIME ATTENDANCE
            </div>

            <div className="font-display text-6xl sm:text-8xl lg:text-9xl font-black text-white tracking-tight drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
              {participants.length || 12}
            </div>

            <div className="font-display text-2xl sm:text-4xl font-extrabold text-emerald-400 tracking-wider uppercase mt-1">
              CONFIRMED OPERATIVES
            </div>

            {/* Drifting attendee names in 3D */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 max-w-xl">
              {recentNames.length > 0 ? (
                recentNames.map((name, i) => (
                  <span
                    key={i}
                    className="font-mono text-xs sm:text-sm px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-200 tracking-wider backdrop-blur-md shadow-lg"
                    style={{
                      transform: `translate3d(${i % 2 === 0 ? '-10px' : '10px'}, 0, 0)`,
                    }}
                  >
                    &bull; {name}
                  </span>
                ))
              ) : (
                <span className="font-mono text-xs text-slate-400">
                  ADV. RUSHAN &bull; KUSH &bull; SQUAD COMMITTED
                </span>
              )}
            </div>
          </div>

          {/* STAGE 3: Tunnel Continuation / Seamless Video 2 Crossfade -> GPL TELEMETRY (p: 0.50 - 0.64) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-3xl ${
              hudStage === 3
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-rose-400 font-bold mb-2">
              GPL TELEMETRY
            </div>

            <div className="font-display text-5xl sm:text-8xl lg:text-9xl font-black text-white font-tabular tracking-tight drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
              {globalHits.toLocaleString()}
            </div>

            <div className="font-display text-xl sm:text-3xl font-extrabold text-rose-300 tracking-wider uppercase mt-2">
              GLOBAL TARGET HITS
            </div>

            <div className="mt-4 font-mono text-xs text-slate-300 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              LIVE SYNCHRONIZATION ACROSS ALL DEVICES
            </div>
          </div>

          {/* STAGE 4: ARSENAL STATUS (p: 0.64 - 0.76) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-2xl ${
              hudStage === 4
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-400 font-bold mb-2">
              ARSENAL STATUS
            </div>

            <h3 className="font-display text-3xl sm:text-6xl font-black text-white tracking-tight drop-shadow">
              5 REQUIRED MATERIALS
            </h3>

            {/* Editorial status fragments */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">01 LEATHER BELT</span>
                <span className="font-bold text-emerald-400">
                  {beltClaimed ? 'CLAIMED' : 'READY'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">02 ACOUSTIC ROD</span>
                <span className="font-bold text-emerald-400">
                  {rodsClaimed ? 'CLAIMED' : 'READY'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">03 CHILLED EGGS</span>
                <span className="font-bold text-amber-400">
                  {eggsClaimed ? 'CLAIMED' : 'STANDBY'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">04 HOSTEL STICK</span>
                <span className="font-bold text-emerald-400">INSPECTED</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">05 10KG DUMBBELL</span>
                <span className="font-bold text-emerald-400">POSITIONED</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-left">
                <span className="text-slate-400 text-[10px] block uppercase">06 CHOCOLATE CAKE</span>
                <span className="font-bold text-rose-400">ORDERED</span>
              </div>
            </div>
          </div>

          {/* STAGE 5: RAID DIRECTIVE TIMELINE (p: 0.76 - 0.88) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-2xl ${
              hudStage === 5
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-sky-400 font-bold mb-2">
              RAID DIRECTIVE
            </div>

            <h3 className="font-display text-3xl sm:text-6xl font-black text-white tracking-tight drop-shadow mb-6">
              EXECUTION TIMELINE
            </h3>

            <div className="space-y-2.5 w-full font-mono text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
                <span className="text-amber-400 font-bold">11:55 PM</span>
                <span className="text-white font-semibold">R4 9TH FLOOR CORRIDOR ASSEMBLY</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 backdrop-blur-md">
                <span className="text-rose-400 font-bold">00:00 MIDNIGHT</span>
                <span className="text-white font-bold">BREACH ROOM 914 · SURPRISE ROAR</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
                <span className="text-emerald-400 font-bold">00:05 AM</span>
                <span className="text-white font-semibold">GPL PROTOCOL & CHOCOLATE CAKE</span>
              </div>
            </div>
          </div>

          {/* STAGE 6: Camera Emerges Behind Sahaj -> TARGET ACQUIRED (p: 0.88 - 0.96) */}
          <div
            className={`transition-all duration-500 ease-out text-center flex flex-col items-center max-w-2xl ${
              hudStage === 6
                ? 'opacity-100 scale-100 translate-y-0 blur-none'
                : 'opacity-0 scale-95 translate-y-6 blur-sm pointer-events-none'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/30 border border-rose-500 text-rose-300 font-mono text-xs font-bold tracking-[0.25em] uppercase mb-4 shadow-xl">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>TARGET ACQUIRED</span>
            </div>

            <h2 className="font-display text-5xl sm:text-8xl font-black text-white tracking-tight drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
              SAHAJ
            </h2>

            <div className="font-mono text-sm sm:text-base text-slate-300 tracking-widest mt-2">
              HOSTEL ROOM R4 914
            </div>

            <p className="mt-4 font-mono text-xs text-rose-400/90 tracking-wider">
              [ENTERING GPL TARGET PRACTICE SIMULATOR]
            </p>
          </div>

          {/* STAGE 7: Dissolve into Simulator (p: 0.96 - 1.00) */}
          <div
            className={`transition-opacity duration-300 text-center ${
              hudStage === 7 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="font-mono text-xs tracking-widest uppercase text-slate-400">
              COMMENCING LIVE TARGET SIMULATION &darr;
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
