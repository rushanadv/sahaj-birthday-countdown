import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGplStats } from '../hooks/useGplStats';
import { useParticipants } from '../hooks/useParticipants';
import { useMaterials } from '../hooks/useMaterials';
import { useWishes } from '../hooks/useWishes';
import { CountdownHUD } from './CountdownHUD';
import { TargetStar } from './TargetStar';
import { Volume2, VolumeX, Flame } from 'lucide-react';
import { sound } from '../utils/sound';

interface CinematicHeroProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerAlert: () => void;
  onSkipToIntroEnd?: () => void;
  onOpenSquadModal?: () => void;
}

// EXACT CLEAN OFFSET WHERE THE TUNNEL IS GONE AND SAHAJ'S BACK SILHOUETTE IS VISIBLE
const VIDEO_2_START_OFFSET = 5.00;
// MAXIMUM TIME FOR VIDEO 1 BEFORE THE MOUTH DARKNESS BECOMES TUNNEL
const VIDEO_1_MAX_TIME = 5.40;

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  soundEnabled,
  onToggleSound,
  onTriggerAlert,
  onSkipToIntroEnd,
  onOpenSquadModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const occlusionRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);

  // Live Supabase telemetry
  const { globalHits } = useGplStats();
  const { participants } = useParticipants();
  const { wishes } = useWishes();

  // Loading & accessibility states
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(20);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Active HUD stage for back scene (0 = front, 1 = back intro, 2 = squad, 3 = hits, 4 = raid directive, 5 = morph)
  const [hudStage, setHudStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reduced motion detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Preload and decoder readiness
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
        }, 200);
      } else if (v1Ready || v2Ready) {
        setLoadProgress(70);
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
      if (v2 && v2.currentTime < VIDEO_2_START_OFFSET) {
        try {
          v2.currentTime = VIDEO_2_START_OFFSET;
        } catch {
          // ignore
        }
      }
      checkReady();
    };

    if (v1) {
      if (v1.readyState >= 1) v1Ready = true;
      else v1.addEventListener('loadedmetadata', onV1Meta);
    }
    if (v2) {
      if (v2.readyState >= 1) {
        v2Ready = true;
        try {
          v2.currentTime = VIDEO_2_START_OFFSET;
        } catch {}
      } else {
        v2.addEventListener('loadedmetadata', onV2Meta);
      }
    }

    checkReady();

    const fallback = setTimeout(() => {
      if (mounted) setIsLoaded(true);
    }, 2200);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      if (v1) v1.removeEventListener('loadedmetadata', onV1Meta);
      if (v2) v2.removeEventListener('loadedmetadata', onV2Meta);
    };
  }, []);

  // iOS Safari decoder warm-up
  const warmUpVideos = useCallback(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (v1 && v1.paused) {
      v1.play().then(() => v1.pause()).catch(() => {});
    }
    if (v2 && v2.paused) {
      v2.play().then(() => {
        v2.pause();
        if (v2.currentTime < VIDEO_2_START_OFFSET) {
          v2.currentTime = VIDEO_2_START_OFFSET;
        }
      }).catch(() => {});
    }
  }, []);

  // ========================================================
  // SINGLE RAF LERP SCROLL TIMELINE (NO TUNNEL)
  // ========================================================
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let currentProgress = 0;
    let targetProgress = 0;
    let lastHudStage = 0;

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    const occlusion = occlusionRef.current;

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
      const delta = targetProgress - currentProgress;
      if (Math.abs(delta) > 0.0001) {
        currentProgress += delta * 0.14; // smooth responsive lerp
      } else {
        currentProgress = targetProgress;
      }

      // ========================================================
      // TIMELINE CHOREOGRAPHY:
      // p in [0.00, 0.68): FRONT STAGE (Video 1: 0.0s -> 5.40s)
      // p in [0.68, 0.72]: OCCLUSION MATCH CUT (100-200ms duration)
      // p in (0.72, 1.00]: BACK STAGE (Video 2: 5.00s -> 7.98s)
      // ========================================================
      const CUT_START = 0.68;
      const CUT_END = 0.72;

      // 0. FRONT COUNTDOWN HUD (Clean early fade out: p in [0.05, 0.14])
      if (countdownRef.current) {
        if (currentProgress < 0.05) {
          countdownRef.current.style.opacity = '1';
          countdownRef.current.style.transform = 'translate3d(0, 0, 0)';
          countdownRef.current.style.visibility = 'visible';
          countdownRef.current.style.pointerEvents = 'auto';
        } else if (currentProgress < 0.14) {
          const fadeRatio = (currentProgress - 0.05) / (0.14 - 0.05);
          countdownRef.current.style.opacity = String(1 - fadeRatio);
          countdownRef.current.style.transform = `translate3d(0, ${fadeRatio * 14}px, 0)`;
          countdownRef.current.style.visibility = 'visible';
          countdownRef.current.style.pointerEvents = 'none';
        } else {
          countdownRef.current.style.opacity = '0';
          countdownRef.current.style.transform = 'translate3d(0, 14px, 0)';
          countdownRef.current.style.visibility = 'hidden';
          countdownRef.current.style.pointerEvents = 'none';
        }
      }

      // 1. VIDEO 1 (FRONT -> MOUTH APPROACH)
      if (v1) {
        if (currentProgress < CUT_START) {
          // Map 0 -> CUT_START linearly to 0.0s -> VIDEO_1_MAX_TIME
          const t1 = Math.min(VIDEO_1_MAX_TIME, (currentProgress / CUT_START) * VIDEO_1_MAX_TIME);
          if (Math.abs(v1.currentTime - t1) > 0.03 && v1.readyState >= 2) {
            v1.currentTime = t1;
          }
          v1.style.opacity = '1';
        } else if (currentProgress >= CUT_END) {
          v1.style.opacity = '0';
          v1.currentTime = VIDEO_1_MAX_TIME;
        } else {
          // Inside occlusion cut: fade 1 -> 0
          const ratio = (currentProgress - CUT_START) / (CUT_END - CUT_START);
          v1.style.opacity = String(1 - ratio);
          v1.currentTime = VIDEO_1_MAX_TIME;
        }
      }

      // 2. VIDEO 2 (SAHAJ FROM BEHIND - NEVER SEEKS TUNNEL)
      if (v2) {
        if (currentProgress <= CUT_START) {
          v2.style.opacity = '0';
          // Strictly clamp at VIDEO_2_START_OFFSET! Never seek below this!
          if (Math.abs(v2.currentTime - VIDEO_2_START_OFFSET) > 0.05 && v2.readyState >= 2) {
            v2.currentTime = VIDEO_2_START_OFFSET;
          }
        } else if (currentProgress < CUT_END) {
          // Inside occlusion cut: fade 0 -> 1 while sitting at clean back start frame
          const ratio = (currentProgress - CUT_START) / (CUT_END - CUT_START);
          v2.style.opacity = String(ratio);
          v2.currentTime = VIDEO_2_START_OFFSET;
        } else {
          // Back scene progression: 5.00s -> 7.98s
          v2.style.opacity = '1';
          const backProgress = (currentProgress - CUT_END) / (1 - CUT_END);
          const t2 = Math.min(
            7.98,
            Math.max(VIDEO_2_START_OFFSET, VIDEO_2_START_OFFSET + backProgress * (7.98 - VIDEO_2_START_OFFSET))
          );
          if (Math.abs(v2.currentTime - t2) > 0.03 && v2.readyState >= 2) {
            v2.currentTime = t2;
          }
        }
      }

      // 3. BRIEF NATURAL BLACK OCCLUSION OVERLAY
      if (occlusion) {
        if (currentProgress >= CUT_START && currentProgress <= CUT_END) {
          // Bell curve opacity peaking at 0.3 to ensure zero seam or luminance pop
          const mid = (CUT_START + CUT_END) / 2;
          const dist = Math.abs(currentProgress - mid) / ((CUT_END - CUT_START) / 2);
          const occOpacity = (1 - dist) * 0.3;
          occlusion.style.opacity = String(occOpacity);
        } else {
          occlusion.style.opacity = '0';
        }
      }

      // 4. DISCRETE HUD STAGES FOR THE BACK SCENE
      // Stage 0: Front scene (Countdown HUD is active)
      // Stage 1: Back reveal annotation (0.72 - 0.78)
      // Stage 2: Live Squad (0.78 - 0.84)
      // Stage 3: Global GPL hits (0.84 - 0.90)
      // Stage 4: Raid directive & wishes (0.90 - 0.95)
      // Stage 5: Target Simulator morph (0.95 - 1.00)
      let stage = 0;
      if (currentProgress < CUT_END) stage = 0;
      else if (currentProgress < 0.78) stage = 1;
      else if (currentProgress < 0.84) stage = 2;
      else if (currentProgress < 0.90) stage = 3;
      else if (currentProgress < 0.95) stage = 4;
      else stage = 5;

      if (stage !== lastHudStage) {
        lastHudStage = stage;
        setHudStage(stage);
      }
      setScrollProgress(currentProgress);

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

  // Recent participant names for Stage 2
  const recentNames = participants.slice(0, 3).map((p) => p.name.toUpperCase());

  // ----------------------------------------------------
  // REDUCED MOTION FALLBACK
  // ----------------------------------------------------
  if (prefersReducedMotion) {
    return (
      <section className="relative min-h-screen bg-[#030712] flex flex-col justify-center items-center px-4 py-20 text-center select-none">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-white/10 font-mono text-xs font-bold text-rose-400 uppercase tracking-widest">
            <span>● SAHAJ &bull; R4 914</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-black text-white tracking-tight leading-none">
            SAHAJ
          </h1>

          <CountdownHUD variant="hero" />

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <button
              onClick={handleSkipIntro}
              className="min-h-[44px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-xl hover:from-rose-500 hover:to-rose-400 transition-all"
            >
              Enter GPL Simulator &darr;
            </button>
            {onOpenSquadModal && (
              <button
                onClick={onOpenSquadModal}
                className="min-h-[44px] px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Pledge Attendance ({participants.length} Confirmed)
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#030712]"
      style={{ height: '380vh' }}
    >
      {/* Pinned 100vh Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden select-none"
      >
        {/* ======================================================== */}
        {/* MINIMAL PRELOAD SCREEN */}
        {/* ======================================================== */}
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] transition-opacity duration-500 ${
            isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="max-w-xs w-full px-6 text-center space-y-4">
            <TargetStar size={44} showText={false} className="mx-auto text-rose-500/80 animate-pulse" />
            <div className="font-mono text-xs font-bold tracking-[0.25em] text-white uppercase">
              ● SAHAJ &bull; R4 914
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="font-mono text-[10px] text-slate-500 tracking-wider">
              CALIBRATING ZERO-HOUR TELEMETRY
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DUAL DIRECT-CUT VIDEO LAYERS */}
        {/* ======================================================== */}
        {/* Layer 1: Sahaj Front Portrait -> Mouth Approach */}
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
            willChange: scrollProgress < 0.75 ? 'opacity' : 'auto',
          }}
        />

        {/* Layer 2: Sahaj From Behind (Tunnel 0-5s Skipped Completely!) */}
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
            willChange: scrollProgress > 0.65 ? 'opacity' : 'auto',
          }}
        />

        {/* Brief Full-Black Occlusion Overlay during mouth match cut */}
        <div
          ref={occlusionRef}
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-75 z-10"
          style={{ opacity: 0 }}
        />

        {/* Subtle Ambient Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 55%, rgba(3, 7, 18, 0.6) 88%, rgba(3, 7, 18, 0.95) 100%)',
          }}
        />

        {/* Bottom gradient dissolve as back shot morphs into simulator */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            height: '35vh',
            background: 'linear-gradient(to top, #030712 25%, transparent 100%)',
            opacity: scrollProgress > 0.92 ? Math.min(1, (scrollProgress - 0.92) / 0.08) : 0,
          }}
        />

        {/* ======================================================== */}
        {/* TOP CANONICAL NAVIGATION (SINGLE BRAND MARK ONLY) */}
        {/* ======================================================== */}
        <div className="absolute top-0 inset-x-0 z-30 p-5 sm:p-7 flex items-center justify-between pointer-events-auto">
          {/* Top-Left: ONLY ONE BRAND MARK */}
          <div className="flex items-center gap-2.5 font-mono text-xs font-bold tracking-[0.2em] text-white drop-shadow">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>SAHAJ &bull; R4 914</span>
          </div>

          {/* Top-Right: Sound, Siren, Skip */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) sound.playTick();
              }}
              className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 bg-black/60 border border-white/10 rounded-xl hover:bg-slate-900 hover:text-white transition-colors backdrop-blur-md"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Sound</span>
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
              className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl hover:from-rose-500 hover:to-rose-400 transition-all shadow-md shadow-rose-950/60 uppercase"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Siren</span>
            </button>

            <button
              onClick={handleSkipIntro}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 backdrop-blur-md font-mono text-xs text-slate-300 hover:text-white transition-all uppercase tracking-wider"
            >
              Skip &darr;
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM-LEFT: CUSTOM R4 914 TARGET STAR MARK */}
        {/* ======================================================== */}
        <div className="absolute bottom-6 left-6 z-30 pointer-events-auto">
          <TargetStar size={36} showText={true} />
        </div>

        {/* ======================================================== */}
        {/* RIGHT EDGE: MINIMAL 3-STEP PROGRESS INDICATOR */}
        {/* ======================================================== */}
        <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3 font-mono text-[10px] tracking-widest text-slate-500/50 pointer-events-none select-none">
          <span className={scrollProgress < 0.68 ? 'text-white font-bold' : 'text-slate-400/30'}>
            01 — SAHAJ
          </span>
          <div className="w-[1px] h-8 bg-white/15 relative overflow-hidden">
            <div
              className="w-full bg-rose-500 transition-all duration-75"
              style={{
                height: `${Math.min(100, (scrollProgress / 0.68) * 100)}%`,
              }}
            />
          </div>
          <span className={scrollProgress >= 0.68 && scrollProgress < 0.94 ? 'text-emerald-400 font-bold' : 'text-slate-400/30'}>
            02 — BEHIND
          </span>
          <div className="w-[1px] h-8 bg-white/15 relative overflow-hidden">
            <div
              className="w-full bg-emerald-400 transition-all duration-75"
              style={{
                height: `${
                  scrollProgress >= 0.68
                    ? Math.min(100, ((scrollProgress - 0.68) / 0.26) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <span className={scrollProgress >= 0.94 ? 'text-white font-bold' : 'text-slate-400/30'}>
            03 — GPL
          </span>
        </div>

        {/* ======================================================== */}
        {/* FRONT STAGE: COUNTDOWN HUD (Left negative space desktop / bottom-center mobile) */}
        {/* Completely fades out early between p = 0.05 and p = 0.14 */}
        {/* ======================================================== */}
        <div
          className="absolute z-20 pointer-events-none select-none
                     bottom-[8svh] left-1/2 -translate-x-1/2
                     md:bottom-auto md:left-[clamp(32px,7vw,120px)] md:top-[62%] md:-translate-y-1/2 md:translate-x-0"
        >
          <div
            ref={countdownRef}
            className="pointer-events-auto transition-none"
            style={{ willChange: 'opacity, transform' }}
          >
            <CountdownHUD variant="hero" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK STAGE: RESTRAINED LIVE DATA IN NEGATIVE SPACE (0.72 - 0.95) */}
        {/* ======================================================== */}
        {scrollProgress >= 0.70 && (
          <div className="absolute inset-0 z-20 pointer-events-none p-6 sm:p-12 flex flex-col justify-between">
            
            {/* Top Annotation Bar (Subject + Compact Countdown) */}
            <div
              className="flex items-center justify-between pt-14 sm:pt-16 transition-all duration-300"
              style={{
                opacity: hudStage >= 1 && hudStage <= 4 ? 1 : 0,
                transform: `translate3d(0, ${hudStage >= 1 ? 0 : 15}px, 0)`,
              }}
            >
              <div className="font-mono text-xs text-slate-300 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="text-slate-500">SUBJECT:</span> SAHAJ &bull; R4 914
              </div>

              <CountdownHUD variant="compact" className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md" />
            </div>

            {/* Negative Space Story Overlay (One dominant story at a time) */}
            <div className="flex-1 flex items-center justify-between max-w-5xl mx-auto w-full px-2 sm:px-8">
              
              {/* STAGE 2: LIVE ATTENDANCE (Left negative space) */}
              <div
                className="transition-all duration-500 text-left max-w-xs"
                style={{
                  opacity: hudStage === 2 ? 1 : 0,
                  transform: `translate3d(${hudStage === 2 ? '0px' : '-20px'}, 0, 0)`,
                }}
              >
                <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
                  LIVE ATTENDANCE
                </div>
                <div className="font-display text-5xl sm:text-7xl font-black text-white leading-none">
                  {participants.length || 1}
                </div>
                <div className="font-display text-base sm:text-xl font-bold text-emerald-400 uppercase tracking-wider mt-1">
                  CONFIRMED OPERATIVES
                </div>
                {recentNames.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px] text-slate-300">
                    {recentNames.map((name, i) => (
                      <span key={i} className="bg-black/60 px-2 py-0.5 rounded border border-white/10">
                        &bull; {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* STAGE 3: GLOBAL GPL HITS (Right negative space) */}
              <div
                className="transition-all duration-500 text-right max-w-xs ml-auto"
                style={{
                  opacity: hudStage === 3 ? 1 : 0,
                  transform: `translate3d(${hudStage === 3 ? '0px' : '20px'}, 0, 0)`,
                }}
              >
                <div className="font-mono text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">
                  GLOBAL GPL HITS
                </div>
                <div className="font-display text-5xl sm:text-7xl font-black text-white font-tabular leading-none">
                  {globalHits.toLocaleString()}
                </div>
                <div className="font-display text-sm sm:text-lg font-bold text-rose-300 uppercase tracking-wider mt-1">
                  RECORDED ACROSS DEVICES
                </div>
                <div className="mt-2 font-mono text-[10px] text-slate-400">
                  REALTIME SYNCHRONIZED
                </div>
              </div>

            </div>

            {/* STAGE 4: RAID DIRECTIVE & WISHES (Bottom negative space) */}
            <div
              className="pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-300 transition-all duration-500"
              style={{
                opacity: hudStage === 4 ? 1 : 0,
                transform: `translate3d(0, ${hudStage === 4 ? 0 : 15}px, 0)`,
              }}
            >
              <div className="bg-black/70 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <span className="text-amber-400 font-bold">11:55 PM</span> ASSEMBLY &bull;{' '}
                <span className="text-rose-400 font-bold">00:00 AM</span> BREACH &bull;{' '}
                <span className="text-emerald-400 font-bold">00:05 AM</span> CELEBRATION
              </div>

              <div className="bg-black/70 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <span className="text-rose-400 font-bold">{wishes.length}</span> LIVE TRANSMISSIONS
              </div>
            </div>

          </div>
        )}

        {/* STAGE 5: MORPH INTO GPL SIMULATOR HINT (0.95 - 1.00) */}
        <div
          className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center text-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: hudStage === 5 ? 1 : 0 }}
        >
          <div className="font-mono text-xs uppercase tracking-widest text-rose-400 animate-bounce">
            COMMENCING GPL TARGET PRACTICE &darr;
          </div>
        </div>

      </div>
    </div>
  );
};
