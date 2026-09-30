import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGplStats } from '../hooks/useGplStats';
import { useParticipants } from '../hooks/useParticipants';
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

// MATH UTILITIES
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp01((value - min) / (max - min));
  return x * x * (3 - 2 * x);
};

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
  const bottomDissolveRef = useRef<HTMLDivElement>(null);

  // Right-side progress indicator refs (updated via RAF, zero React re-render)
  const step1FillRef = useRef<HTMLDivElement>(null);
  const step2FillRef = useRef<HTMLDivElement>(null);
  const step1TextRef = useRef<HTMLSpanElement>(null);
  const step2TextRef = useRef<HTMLSpanElement>(null);
  const step3TextRef = useRef<HTMLSpanElement>(null);

  // Back stage live-data refs (updated via RAF with smoothstep)
  // Back stage live-data refs (updated via RAF with smoothstep)
  const backStageRef = useRef<HTMLDivElement>(null);
  const backAnnotationRef = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLDivElement>(null);
  const stage3Ref = useRef<HTMLDivElement>(null);
  const stage4Ref = useRef<HTMLDivElement>(null);
  const stage5Ref = useRef<HTMLDivElement>(null);

  // Interactive landing portrait system refs
  const portraitWrapperRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBWrapperRef = useRef<HTMLDivElement>(null);
  const layerBImgRef = useRef<HTMLImageElement>(null);
  const visorReflectionRef = useRef<HTMLDivElement>(null);
  const bgArtRef = useRef<SVGSVGElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // Interactive pointer physics refs (zero React re-renders)
  const pointerTargetXRef = useRef(0);
  const pointerTargetYRef = useRef(0);
  const pointerCurrentXRef = useRef(0);
  const pointerCurrentYRef = useRef(0);
  const isPointerInsideRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const currentHoverOpacityRef = useRef(0);
  const debugRegistrationRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Master RAF and timeline refs
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const v1TimeRef = useRef(0);
  const v2TimeRef = useRef(VIDEO_2_START_OFFSET);
  const v1SeekingRef = useRef(false);
  const v2SeekingRef = useRef(false);
  const v2DurationRef = useRef(7.98);
  const isGpuActiveRef = useRef(false);

  // Live Supabase telemetry
  const { globalHits } = useGplStats();
  const { participants } = useParticipants();
  const { wishes } = useWishes();

  // Loading & accessibility states (Only discrete state, never updated per scroll frame)
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(20);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
        }, 150);
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
      if (v2) {
        if (v2.duration && !isNaN(v2.duration)) {
          v2DurationRef.current = v2.duration;
        }
        if (v2.currentTime < VIDEO_2_START_OFFSET) {
          try {
            v2.currentTime = VIDEO_2_START_OFFSET;
          } catch {
            // ignore
          }
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
        if (v2.duration && !isNaN(v2.duration)) {
          v2DurationRef.current = v2.duration;
        }
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
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      if (v1) v1.removeEventListener('loadedmetadata', onV1Meta);
      if (v2) v2.removeEventListener('loadedmetadata', onV2Meta);
    };
  }, []);

  // iOS Safari decoder warm-up on initial touch/click
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

  // Dev-only visual registration tester (Toggle full 50% overlay on 'H')
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        debugRegistrationRef.current = !debugRegistrationRef.current;
        console.log(
          `[R4 914 Debug] Registration overlay: ${debugRegistrationRef.current ? 'ACTIVE (opacity 0.5, no mask)' : 'INACTIVE (interactive mask)'}`
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Pointer & Touch handlers for the landing portrait interaction
  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPointerInsideRef.current = true;
    if (portraitWrapperRef.current) {
      const rect = portraitWrapperRef.current.getBoundingClientRect();
      pointerTargetXRef.current = e.clientX - rect.left;
      pointerTargetYRef.current = e.clientY - rect.top;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPointerInsideRef.current = true;
    if (portraitWrapperRef.current) {
      const rect = portraitWrapperRef.current.getBoundingClientRect();
      pointerTargetXRef.current = e.clientX - rect.left;
      pointerTargetYRef.current = e.clientY - rect.top;
    }
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      if (hintRef.current) hintRef.current.style.opacity = '0';
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    isPointerInsideRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // If primarily vertical gesture, allow native scroll without revealing helmet
    if (dy > dx * 1.3) {
      isPointerInsideRef.current = false;
      return;
    }

    if (portraitWrapperRef.current) {
      const rect = portraitWrapperRef.current.getBoundingClientRect();
      pointerTargetXRef.current = touch.clientX - rect.left;
      pointerTargetYRef.current = touch.clientY - rect.top;
      isPointerInsideRef.current = true;
    }
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      if (hintRef.current) hintRef.current.style.opacity = '0';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isPointerInsideRef.current = false;
  }, []);


  // ========================================================
  // MASTER VELOCITY-AWARE RAF SCROLL ENGINE (ZERO REACT RERENDERS)
  // ========================================================
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let cachedContainerTop = 0;
    let cachedTotalScrollable = 1;

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    const occlusion = occlusionRef.current;

    let cachedHeroWidth = 1920;
    let cachedHeroHeight = 1080;

    // Feature detect CSS masking support for graceful crossfade fallback
    const supportsMask =
      typeof CSS !== 'undefined' &&
      (CSS.supports('mask-image', 'radial-gradient(circle, black, transparent)') ||
        CSS.supports('-webkit-mask-image', 'radial-gradient(circle, black, transparent)'));

    // Cache layout dimensions to prevent getBoundingClientRect() during scroll
    const measureLayout = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      cachedContainerTop = window.scrollY + rect.top;
      cachedTotalScrollable = Math.max(1, containerRef.current.offsetHeight - window.innerHeight);
      if (portraitWrapperRef.current) {
        cachedHeroWidth = portraitWrapperRef.current.offsetWidth || window.innerWidth;
        cachedHeroHeight = portraitWrapperRef.current.offsetHeight || window.innerHeight;
      } else {
        cachedHeroWidth = window.innerWidth;
        cachedHeroHeight = window.innerHeight;
      }
    };

    // Fast scroll target update - reads only window.scrollY without triggering layout
    const updateScrollTarget = () => {
      const scrolled = window.scrollY - cachedContainerTop;
      targetProgressRef.current = clamp01(scrolled / cachedTotalScrollable);
    };

    // Seeking unlock handlers
    const onV1Seeked = () => { v1SeekingRef.current = false; };
    const onV2Seeked = () => { v2SeekingRef.current = false; };
    if (v1) v1.addEventListener('seeked', onV1Seeked);
    if (v2) v2.addEventListener('seeked', onV2Seeked);

    // Coordinate with requestVideoFrameCallback where supported
    let rvfc1Id: number | null = null;
    let rvfc2Id: number | null = null;
    if (v1 && typeof (v1 as any).requestVideoFrameCallback === 'function') {
      const onV1Rvfc = () => {
        v1SeekingRef.current = false;
        if (v1) rvfc1Id = (v1 as any).requestVideoFrameCallback(onV1Rvfc);
      };
      rvfc1Id = (v1 as any).requestVideoFrameCallback(onV1Rvfc);
    }
    if (v2 && typeof (v2 as any).requestVideoFrameCallback === 'function') {
      const onV2Rvfc = () => {
        v2SeekingRef.current = false;
        if (v2) rvfc2Id = (v2 as any).requestVideoFrameCallback(onV2Rvfc);
      };
      rvfc2Id = (v2 as any).requestVideoFrameCallback(onV2Rvfc);
    }

    // MATCH CUT CONFIGURATION
    const CUT_START = 0.68;
    const CUT_END = 0.72;
    const SEEK_THRESHOLD = 0.024; // 24ms seek threshold prevents decoder choking
    const VIDEO_SMOOTHING = 0.28;  // Video time follow responsiveness

    // Master 60fps render loop
    const renderLoop = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const delta = target - current;
      const absDelta = Math.abs(delta);

      velocityRef.current = absDelta;

      // Velocity-aware smoothing:
      // Slow micro-scrolls: ~0.075 (smooth, steady, no stepping)
      // Normal scrolls: ~0.095 (responsive)
      // Fast flicks: ~0.135 (quick catchup without floatiness)
      const speedFactor = Math.min(1, absDelta * 7.5);
      const smoothing = 0.075 + speedFactor * 0.06;

      if (absDelta > 0.00003) {
        currentProgressRef.current += delta * smoothing;
      } else {
        currentProgressRef.current = target;
      }

      const p = currentProgressRef.current;

      // GPU Compositing will-change management (Only active when inside cinematic scrub)
      const isScrubbing = p > 0.005 && p < 0.995;
      if (isScrubbing !== isGpuActiveRef.current) {
        isGpuActiveRef.current = isScrubbing;
        const willChangeVal = isScrubbing ? 'opacity, transform' : 'auto';
        if (v1) v1.style.willChange = willChangeVal;
        if (v2) v2.style.willChange = willChangeVal;
        if (countdownRef.current) countdownRef.current.style.willChange = willChangeVal;
      }

      // ========================================================
      // LANDING INTERACTIVE PORTRAIT SYSTEM (Active only before scrolling)
      // ========================================================
      const DISABLE_START = 0.025;
      const DISABLE_END = 0.065;

      if (portraitWrapperRef.current) {
        if (p >= DISABLE_END) {
          // Bypassed completely during cinematic scroll
          portraitWrapperRef.current.style.opacity = '0';
          portraitWrapperRef.current.style.visibility = 'hidden';
          portraitWrapperRef.current.style.pointerEvents = 'none';
          if (layerBWrapperRef.current) {
            layerBWrapperRef.current.style.opacity = '0';
          }
        } else {
          portraitWrapperRef.current.style.visibility = 'visible';
          const isLandingIdle = p <= DISABLE_START;
          portraitWrapperRef.current.style.pointerEvents = isLandingIdle ? 'auto' : 'none';

          // Seamless scroll fade: 1 when idle, fades to 0 as cinematic starts
          const scrollFade = isLandingIdle ? 1 : Math.max(0, 1 - (p - DISABLE_START) / (DISABLE_END - DISABLE_START));
          portraitWrapperRef.current.style.opacity = String(scrollFade);

          if (layerBWrapperRef.current) {
            if (debugRegistrationRef.current && import.meta.env.DEV) {
              // Dev visual registration tester: 50% opacity, no mask
              layerBWrapperRef.current.style.opacity = '0.5';
              layerBWrapperRef.current.style.maskImage = 'none';
              layerBWrapperRef.current.style.webkitMaskImage = 'none';
            } else {
              // Smooth hover opacity transition (approx 250ms enter, 400ms leave)
              const targetHover = isPointerInsideRef.current && isLandingIdle ? 1 : 0;
              const fadeRate = isPointerInsideRef.current ? 0.088 : 0.045;
              currentHoverOpacityRef.current += (targetHover - currentHoverOpacityRef.current) * fadeRate;

              const effectiveOpacity = currentHoverOpacityRef.current * scrollFade;

              if (effectiveOpacity < 0.005) {
                layerBWrapperRef.current.style.opacity = '0';
              } else {
                layerBWrapperRef.current.style.opacity = String(effectiveOpacity);

                // Inertia pointer interpolation (0.082 factor gives ideal weight)
                const tx = pointerTargetXRef.current;
                const ty = pointerTargetYRef.current;
                pointerCurrentXRef.current += (tx - pointerCurrentXRef.current) * 0.082;
                pointerCurrentYRef.current += (ty - pointerCurrentYRef.current) * 0.082;

                const cx = pointerCurrentXRef.current;
                const cy = pointerCurrentYRef.current;
                const w = cachedHeroWidth || 1920;
                const h = cachedHeroHeight || 1080;

                // Subtle restrained parallax: normal ±2px, helmet ±3px, background ±6px
                const normPx = (cx - w * 0.5) / (w * 0.5);
                const normPy = (cy - h * 0.5) / (h * 0.5);

                if (layerARef.current) {
                  layerARef.current.style.transform = `translate3d(${(normPx * 2).toFixed(2)}px, ${(normPy * 2).toFixed(2)}px, 0)`;
                }
                layerBWrapperRef.current.style.transform = `translate3d(${(normPx * 3).toFixed(2)}px, ${(normPy * 3).toFixed(2)}px, 0)`;
                if (bgArtRef.current) {
                  bgArtRef.current.style.transform = `translate3d(${(normPx * 6).toFixed(2)}px, ${(normPy * 6).toFixed(2)}px, 0)`;
                }
                if (visorReflectionRef.current) {
                  visorReflectionRef.current.style.transform = `translate3d(${(normPx * 45).toFixed(1)}px, 0, 0)`;
                }

                // Proximity prioritization: head/face centered at (w*0.5, h*0.42)
                const distFromSubject = Math.hypot((cx - w * 0.5) / (w * 0.32), (cy - h * 0.42) / (h * 0.35));
                const subjectProximity = Math.max(0.18, Math.min(1.0, 1.35 - distFromSubject * 0.85));

                if (supportsMask) {
                  // 3 Soft Overlapping Organic Lobes with alive time-wobble
                  const t = performance.now() * 0.0012;
                  const baseRx = Math.min(w, h) * 0.22 * subjectProximity;
                  const baseRy = baseRx * 1.18;

                  const rx1 = baseRx;
                  const ry1 = baseRy;
                  const l1x = cx + Math.sin(t * 0.8) * 8;
                  const l1y = cy + Math.cos(t * 0.9) * 8;

                  const rx2 = baseRx * 0.75;
                  const ry2 = baseRy * 0.82;
                  const l2x = cx + baseRx * 0.38 + Math.cos(t * 1.1) * 12;
                  const l2y = cy - baseRy * 0.32 + Math.sin(t * 1.3) * 12;

                  const rx3 = baseRx * 0.70;
                  const ry3 = baseRy * 0.76;
                  const l3x = cx - baseRx * 0.35 + Math.sin(t * 1.2) * 10;
                  const l3y = cy + baseRy * 0.30 + Math.cos(t * 1.0) * 10;

                  const grad1 = `radial-gradient(ellipse ${rx1.toFixed(1)}px ${ry1.toFixed(1)}px at ${l1x.toFixed(1)}px ${l1y.toFixed(1)}px, black 25%, rgba(0,0,0,0.85) 50%, transparent 80%)`;
                  const grad2 = `radial-gradient(ellipse ${rx2.toFixed(1)}px ${ry2.toFixed(1)}px at ${l2x.toFixed(1)}px ${l2y.toFixed(1)}px, black 20%, rgba(0,0,0,0.7) 48%, transparent 75%)`;
                  const grad3 = `radial-gradient(ellipse ${rx3.toFixed(1)}px ${ry3.toFixed(1)}px at ${l3x.toFixed(1)}px ${l3y.toFixed(1)}px, black 15%, rgba(0,0,0,0.6) 45%, transparent 72%)`;

                  const maskStr = `${grad1}, ${grad2}, ${grad3}`;
                  layerBWrapperRef.current.style.maskImage = maskStr;
                  layerBWrapperRef.current.style.webkitMaskImage = maskStr;
                } else {
                  layerBWrapperRef.current.style.opacity = String(effectiveOpacity * subjectProximity);
                }
              }
            }
          }
        }
      }

      // ========================================================
      // 0. FRONT COUNTDOWN HUD (Smoothstep early fade: p in [0.05, 0.14])
      // ========================================================
      if (countdownRef.current) {
        const fade = smoothstep(0.05, 0.14, p);
        countdownRef.current.style.opacity = String(1 - fade);
        countdownRef.current.style.transform = `translate3d(0, ${fade * 14}px, 0)`;
        countdownRef.current.style.visibility = fade >= 0.99 ? 'hidden' : 'visible';
        countdownRef.current.style.pointerEvents = fade > 0.1 ? 'none' : 'auto';
      }

      // ========================================================
      // 1. VIDEO 1 (FRONT PORTRAIT -> MOUTH APPROACH)
      // ========================================================
      if (v1) {
        if (p < CUT_START) {
          const targetV1Time = Math.min(VIDEO_1_MAX_TIME, (p / CUT_START) * VIDEO_1_MAX_TIME);
          v1TimeRef.current += (targetV1Time - v1TimeRef.current) * VIDEO_SMOOTHING;
          if (v1.readyState >= 2 && !v1SeekingRef.current) {
            if (Math.abs(v1.currentTime - v1TimeRef.current) > SEEK_THRESHOLD) {
              v1SeekingRef.current = true;
              v1.currentTime = v1TimeRef.current;
              setTimeout(() => { v1SeekingRef.current = false; }, 50);
            }
          }
          v1.style.opacity = '1';
        } else if (p >= CUT_END) {
          v1.style.opacity = '0';
          v1TimeRef.current = VIDEO_1_MAX_TIME;
          if (v1.readyState >= 2 && Math.abs(v1.currentTime - VIDEO_1_MAX_TIME) > 0.05 && !v1SeekingRef.current) {
            v1SeekingRef.current = true;
            v1.currentTime = VIDEO_1_MAX_TIME;
            setTimeout(() => { v1SeekingRef.current = false; }, 50);
          }
        } else {
          // Inside occlusion match cut (0.68 -> 0.72)
          const ratio = (p - CUT_START) / (CUT_END - CUT_START);
          v1.style.opacity = String(1 - ratio);
          v1TimeRef.current = VIDEO_1_MAX_TIME;
          if (v1.readyState >= 2 && Math.abs(v1.currentTime - VIDEO_1_MAX_TIME) > 0.05 && !v1SeekingRef.current) {
            v1SeekingRef.current = true;
            v1.currentTime = VIDEO_1_MAX_TIME;
            setTimeout(() => { v1SeekingRef.current = false; }, 50);
          }
        }
      }

      // ========================================================
      // 2. VIDEO 2 (SAHAJ FROM BEHIND - NEVER SEEKS TUNNEL 0-5s)
      // ========================================================
      if (v2) {
        const v2Dur = v2DurationRef.current || 7.98;
        if (p <= CUT_START) {
          v2.style.opacity = '0';
          v2TimeRef.current = VIDEO_2_START_OFFSET;
          if (v2.readyState >= 2 && Math.abs(v2.currentTime - VIDEO_2_START_OFFSET) > 0.05 && !v2SeekingRef.current) {
            v2SeekingRef.current = true;
            v2.currentTime = VIDEO_2_START_OFFSET;
            setTimeout(() => { v2SeekingRef.current = false; }, 50);
          }
        } else if (p < CUT_END) {
          const ratio = (p - CUT_START) / (CUT_END - CUT_START);
          v2.style.opacity = String(ratio);
          v2TimeRef.current = VIDEO_2_START_OFFSET;
          if (v2.readyState >= 2 && Math.abs(v2.currentTime - VIDEO_2_START_OFFSET) > 0.05 && !v2SeekingRef.current) {
            v2SeekingRef.current = true;
            v2.currentTime = VIDEO_2_START_OFFSET;
            setTimeout(() => { v2SeekingRef.current = false; }, 50);
          }
        } else {
          v2.style.opacity = '1';
          const backProgress = (p - CUT_END) / (1 - CUT_END);
          const targetV2Time = Math.min(
            v2Dur,
            Math.max(VIDEO_2_START_OFFSET, VIDEO_2_START_OFFSET + backProgress * (v2Dur - VIDEO_2_START_OFFSET))
          );
          v2TimeRef.current += (targetV2Time - v2TimeRef.current) * VIDEO_SMOOTHING;
          if (v2.readyState >= 2 && !v2SeekingRef.current) {
            if (Math.abs(v2.currentTime - v2TimeRef.current) > SEEK_THRESHOLD) {
              v2SeekingRef.current = true;
              v2.currentTime = v2TimeRef.current;
              setTimeout(() => { v2SeekingRef.current = false; }, 50);
            }
          }
        }
      }

      // ========================================================
      // 3. BRIEF NATURAL BLACK OCCLUSION MATCH CUT (0.68 - 0.72)
      // ========================================================
      if (occlusion) {
        if (p >= CUT_START && p <= CUT_END) {
          const mid = (CUT_START + CUT_END) / 2;
          const dist = Math.abs(p - mid) / ((CUT_END - CUT_START) / 2);
          const occOpacity = (1 - dist) * 0.35;
          occlusion.style.opacity = String(occOpacity);
        } else {
          occlusion.style.opacity = '0';
        }
      }

      // ========================================================
      // 4. RIGHT EDGE 3-STEP PROGRESS INDICATOR
      // ========================================================
      if (step1FillRef.current) {
        step1FillRef.current.style.height = `${Math.min(100, (p / 0.68) * 100)}%`;
      }
      if (step2FillRef.current) {
        step2FillRef.current.style.height = `${p >= 0.68 ? Math.min(100, ((p - 0.68) / 0.26) * 100) : 0}%`;
      }
      if (step1TextRef.current) {
        step1TextRef.current.className = p < 0.68 ? 'text-white font-bold' : 'text-slate-400/30';
      }
      if (step2TextRef.current) {
        step2TextRef.current.className = p >= 0.68 && p < 0.94 ? 'text-emerald-400 font-bold' : 'text-slate-400/30';
      }
      if (step3TextRef.current) {
        step3TextRef.current.className = p >= 0.94 ? 'text-rose-400 font-bold' : 'text-slate-400/30';
      }

      // ========================================================
      // 5. BOTTOM DISSOLVE INTO GPL SIMULATOR
      // ========================================================
      if (bottomDissolveRef.current) {
        const dissolveOp = p > 0.91 ? smoothstep(0.91, 1.0, p) : 0;
        bottomDissolveRef.current.style.opacity = String(dissolveOp);
      }

      // ========================================================
      // 6. BACK STAGE LIVE TELEMETRY IN NEGATIVE SPACE
      // ========================================================
      if (backStageRef.current) {
        const isBackActive = p >= 0.69 && p <= 0.99;
        backStageRef.current.style.visibility = isBackActive ? 'visible' : 'hidden';
        backStageRef.current.style.opacity = isBackActive ? '1' : '0';
      }

      if (backAnnotationRef.current) {
        const inVal = smoothstep(0.72, 0.76, p);
        const outVal = 1 - smoothstep(0.94, 0.97, p);
        const op = inVal * outVal;
        backAnnotationRef.current.style.opacity = String(op);
        backAnnotationRef.current.style.transform = `translate3d(0, ${lerp(12, 0, inVal)}px, 0)`;
      }

      if (stage2Ref.current) {
        const inVal = smoothstep(0.77, 0.81, p);
        const outVal = 1 - smoothstep(0.84, 0.87, p);
        const op = inVal * outVal;
        stage2Ref.current.style.opacity = String(op);
        stage2Ref.current.style.transform = `translate3d(${lerp(-24, 0, inVal)}px, 0, 0)`;
      }

      if (stage3Ref.current) {
        const inVal = smoothstep(0.83, 0.87, p);
        const outVal = 1 - smoothstep(0.90, 0.93, p);
        const op = inVal * outVal;
        stage3Ref.current.style.opacity = String(op);
        stage3Ref.current.style.transform = `translate3d(${lerp(24, 0, inVal)}px, 0, 0)`;
      }

      if (stage4Ref.current) {
        const inVal = smoothstep(0.89, 0.93, p);
        const outVal = 1 - smoothstep(0.95, 0.98, p);
        const op = inVal * outVal;
        stage4Ref.current.style.opacity = String(op);
        stage4Ref.current.style.transform = `translate3d(0, ${lerp(14, 0, inVal)}px, 0)`;
      }

      if (stage5Ref.current) {
        const op = smoothstep(0.94, 0.99, p);
        stage5Ref.current.style.opacity = String(op);
        stage5Ref.current.style.visibility = op > 0.01 ? 'visible' : 'hidden';
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    measureLayout();
    updateScrollTarget();
    pointerTargetXRef.current = cachedHeroWidth * 0.5;
    pointerTargetYRef.current = cachedHeroHeight * 0.42;
    pointerCurrentXRef.current = cachedHeroWidth * 0.5;
    pointerCurrentYRef.current = cachedHeroHeight * 0.42;

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', measureLayout, { passive: true });
    window.addEventListener('orientationchange', measureLayout, { passive: true });
    window.addEventListener('touchstart', warmUpVideos, { passive: true, once: true });
    window.addEventListener('click', warmUpVideos, { passive: true, once: true });

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('resize', measureLayout);
      window.removeEventListener('orientationchange', measureLayout);
      window.removeEventListener('touchstart', warmUpVideos);
      window.removeEventListener('click', warmUpVideos);
      if (v1) v1.removeEventListener('seeked', onV1Seeked);
      if (v2) v2.removeEventListener('seeked', onV2Seeked);
      if (rvfc1Id !== null && v1 && typeof (v1 as any).cancelVideoFrameCallback === 'function') {
        (v1 as any).cancelVideoFrameCallback(rvfc1Id);
      }
      if (rvfc2Id !== null && v2 && typeof (v2 as any).cancelVideoFrameCallback === 'function') {
        (v2 as any).cancelVideoFrameCallback(rvfc2Id);
      }
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
      style={{ height: '440vh' }}
    >
      {/* Pinned 100svh Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden select-none"
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
          poster="/images/sahaj-normal.jpg"
          preload="auto"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
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
            backfaceVisibility: 'hidden',
          }}
        />

        {/* ======================================================== */}
        {/* LANDING PORTRAIT SYSTEM (Active only before scrolling, p <= 0.03) */}
        {/* ======================================================== */}
        <div
          ref={portraitWrapperRef}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto z-[8] select-none"
          style={{
            opacity: 1,
            touchAction: 'pan-y',
            transition: 'opacity 0.15s ease-out',
          }}
        >
          {/* Subtle Editorial Backlight Spotlight behind Sahaj */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(244, 63, 94, 0.05) 0%, rgba(15, 23, 42, 0.35) 50%, transparent 80%)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Abstract R4 914 Editorial Background Contours (3-6% Opacity) */}
          <svg
            ref={bgArtRef}
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            style={{
              opacity: 0.045,
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
            }}
          >
            <defs>
              <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="curveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Dynamic Racing Line Ribbon */}
            <path
              d="M -100 850 C 400 900, 750 650, 960 520 C 1200 370, 1550 250, 2050 180"
              fill="none"
              stroke="url(#curveGrad1)"
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />
            {/* Apex Contour Curve */}
            <path
              d="M 100 200 C 600 120, 850 300, 960 440 C 1100 620, 1400 950, 1900 1000"
              fill="none"
              stroke="url(#curveGrad2)"
              strokeWidth="1.5"
            />
            {/* Subtle 914 Radial Arc */}
            <circle
              cx="960"
              cy="460"
              r="380"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="4 12"
            />
          </svg>

          {/* LAYER A: Normal Sahaj Hero Portrait */}
          <img
            ref={layerARef}
            src="/images/sahaj-normal.jpg"
            alt="Sahaj"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          />

          {/* LAYER B: Sahaj R4 914 Helmet State (Organic Sculptural Reveal Mask) */}
          <div
            ref={layerBWrapperRef}
            className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
            style={{
              opacity: 0,
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              willChange: 'opacity, transform',
            }}
          >
            <img
              ref={layerBImgRef}
              src="/images/sahaj-helmet-state.jpg"
              alt="Sahaj R4 914 Motorsport Helmet"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              style={{
                transform:
                  'translate(var(--helmet-state-x, 0%), var(--helmet-state-y, 1.1%)) scale(var(--helmet-state-scale, 0.93))',
                transformOrigin: '50% 50%',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* Subtle Visor Reflective Streak Overlay (Masked inside Layer B) */}
            <div
              ref={visorReflectionRef}
              className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen"
              style={{
                background:
                  'linear-gradient(115deg, transparent 44%, rgba(255,255,255,0.12) 49%, rgba(255,240,245,0.18) 51%, transparent 56%)',
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform',
              }}
            />
          </div>

          {/* Understated Landing Instruction: MOVE TO REVEAL */}
          <div
            ref={hintRef}
            className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none transition-opacity duration-700 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-slate-400/70 uppercase"
            style={{ opacity: 1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/70 animate-pulse" />
            <span>MOVE TO REVEAL</span>
          </div>
        </div>

        {/* Brief Full-Black Occlusion Overlay during mouth match cut */}
        <div
          ref={occlusionRef}
          className="absolute inset-0 bg-black pointer-events-none z-10 transition-none"
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
          ref={bottomDissolveRef}
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10 transition-none"
          style={{
            height: '35vh',
            background: 'linear-gradient(to top, #030712 25%, transparent 100%)',
            opacity: 0,
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
          <span ref={step1TextRef} className="text-white font-bold transition-colors duration-150">
            01 — SAHAJ
          </span>
          <div className="w-[1px] h-8 bg-white/15 relative overflow-hidden">
            <div
              ref={step1FillRef}
              className="w-full bg-rose-500 transition-none"
              style={{ height: '0%' }}
            />
          </div>
          <span ref={step2TextRef} className="text-slate-400/30 transition-colors duration-150">
            02 — BEHIND
          </span>
          <div className="w-[1px] h-8 bg-white/15 relative overflow-hidden">
            <div
              ref={step2FillRef}
              className="w-full bg-emerald-400 transition-none"
              style={{ height: '0%' }}
            />
          </div>
          <span ref={step3TextRef} className="text-slate-400/30 transition-colors duration-150">
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
            style={{ willChange: 'opacity, transform', backfaceVisibility: 'hidden' }}
          >
            <CountdownHUD variant="hero" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK STAGE: RESTRAINED LIVE DATA IN NEGATIVE SPACE (0.70 - 0.98) */}
        {/* ======================================================== */}
        <div
          ref={backStageRef}
          className="absolute inset-0 z-20 pointer-events-none p-6 sm:p-12 flex flex-col justify-between transition-none select-none"
          style={{ visibility: 'hidden', opacity: 0 }}
        >
          {/* Top Annotation Bar (Subject + Compact Countdown) */}
          <div
            ref={backAnnotationRef}
            className="flex items-center justify-between pt-14 sm:pt-16 transition-none"
            style={{ opacity: 0, transform: 'translate3d(0, 12px, 0)' }}
          >
            <div className="font-mono text-xs text-slate-300 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
              <span className="text-slate-500">SUBJECT:</span> SAHAJ &bull; R4 914
            </div>

            <CountdownHUD variant="compact" className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md" />
          </div>

          {/* Negative Space Story Overlay (Smooth continuous opacity transitions) */}
          <div className="flex-1 flex items-center justify-between max-w-5xl mx-auto w-full px-2 sm:px-8">
            {/* STAGE 2: LIVE ATTENDANCE (Left negative space) */}
            <div
              ref={stage2Ref}
              className="text-left max-w-xs transition-none"
              style={{ opacity: 0, transform: 'translate3d(-24px, 0, 0)' }}
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
              ref={stage3Ref}
              className="text-right max-w-xs ml-auto transition-none"
              style={{ opacity: 0, transform: 'translate3d(24px, 0, 0)' }}
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
            ref={stage4Ref}
            className="pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-300 transition-none"
            style={{ opacity: 0, transform: 'translate3d(0, 14px, 0)' }}
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

        {/* STAGE 5: MORPH INTO GPL SIMULATOR HINT */}
        <div
          ref={stage5Ref}
          className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center text-center pointer-events-none transition-none"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <div className="font-mono text-xs uppercase tracking-widest text-rose-400 animate-bounce">
            COMMENCING GPL TARGET PRACTICE &darr;
          </div>
        </div>

      </div>
    </div>
  );
};
