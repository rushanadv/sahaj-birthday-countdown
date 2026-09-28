import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Zap,
  Trash2,
  Crosshair,
  Upload,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { useGplStats } from '../hooks/useGplStats';
import { RealtimeStatus } from './RealtimeStatus';
import sahajTargetImg from '../assets/sahaj-target.webp';

interface SplatDecal {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: string;
  size: number;
  rotation: number;
  opacity: number;
}

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  icon: string;
}

interface ComicBubble {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

const WEAPONS = [
  {
    id: 'egg',
    name: 'Chilled Egg',
    icon: '🥚',
    color: '#fbbf24',
    impactDesc: 'Raw yolk splatter on face',
    damage: '+25 XP',
  },
  {
    id: 'belt',
    name: 'Leather Belt',
    icon: '🪢',
    color: '#ef4444',
    impactDesc: 'Hostel birthday bump slap',
    damage: '+30 XP',
  },
  {
    id: 'rod',
    name: 'Acoustic Rod',
    icon: '🦯',
    color: '#94a3b8',
    impactDesc: 'Door rattle metal clack',
    damage: '+20 XP',
  },
  {
    id: 'stick',
    name: 'Hostel Stick',
    icon: '🪵',
    color: '#b45309',
    impactDesc: 'Traditional wooden tap',
    damage: '+25 XP',
  },
  {
    id: 'dumbbell',
    name: '10kg Dumbbell',
    icon: '🏋️',
    color: '#64748b',
    impactDesc: 'Door barricade shockwave',
    damage: '+50 XP',
  },
  {
    id: 'cake',
    name: 'Chocolate Cake',
    icon: '🎂',
    color: '#d97706',
    impactDesc: 'Truffle frosting cream smash',
    damage: '+40 XP',
  },
  {
    id: 'balloon',
    name: 'Water Balloon',
    icon: '🎈',
    color: '#38bdf8',
    impactDesc: 'Hostel corridor splash',
    damage: '+15 XP',
  },
];

const COMIC_PHRASES = [
  'HAPPY BIRTHDAY SAHAJ!',
  'R4 914 DIRECT HIT!',
  'EGGED!',
  'DHISHUM!',
  'THWACK!',
  'BHAI CHOD DO!',
  'TREAT KAB DEGA?',
  'MIDNIGHT SPECIAL!',
  'ROOM 914 BREACHED!',
  'CHOCOLATE FACIAL!',
];

export const GplSimulator: React.FC = () => {
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0].id);
  const [splats, setSplats] = useState<SplatDecal[]>([]);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [comicBubbles, setComicBubbles] = useState<ComicBubble[]>([]);
  const [recoilStyle, setRecoilStyle] = useState<{
    x: number;
    y: number;
    rotate: number;
    scale: number;
  }>({ x: 0, y: 0, rotate: 0, scale: 1 });

  const [combo, setCombo] = useState(0);
  const [sessionHits, setSessionHits] = useState(0);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sahaj_custom_target_photo');
    } catch {
      return null;
    }
  });

  const { globalHits, connectionStatus, recordHit } = useGplStats();

  const photoContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recoilTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (recoilTimerRef.current) clearTimeout(recoilTimerRef.current);
      activeTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const playImpactSound = useCallback((weaponId: string) => {
    if (weaponId === 'egg' || weaponId === 'balloon') {
      sound.playEggSplatter();
    } else if (weaponId === 'belt') {
      sound.playWhip();
    } else if (weaponId === 'cake') {
      sound.playCakeSmash();
    } else if (weaponId === 'dumbbell') {
      sound.playThud(1.8);
    } else {
      sound.playThud(1.2);
    }
  }, []);

  // Launch projectile towards (x, y) coordinates on Sahaj target
  const throwItemAt = useCallback(
    (targetXPercent: number, targetYPercent: number) => {
      const weapon = WEAPONS.find((w) => w.id === selectedWeapon) || WEAPONS[0];
      const projectileId = Date.now() + Math.random();

      // Spawn projectile with GPU translate
      setFlyingItems((prev) => [
        ...prev.slice(-6),
        {
          id: projectileId,
          startX: 50 + (Math.random() * 20 - 10),
          startY: 105,
          targetX: targetXPercent,
          targetY: targetYPercent,
          icon: weapon.icon,
        },
      ]);

      const flightTimer = setTimeout(() => {
        // Remove projectile
        setFlyingItems((prev) => prev.filter((p) => p.id !== projectileId));

        // Impact audio
        playImpactSound(weapon.id);

        // GPU Target Recoil Animation: translate3d + rotate + scale
        const recoilX = (Math.random() - 0.5) * 8;
        const recoilY = 3 + Math.random() * 5;
        const recoilR = (Math.random() - 0.5) * 4;
        setRecoilStyle({ x: recoilX, y: recoilY, rotate: recoilR, scale: 0.985 });

        if (recoilTimerRef.current) clearTimeout(recoilTimerRef.current);
        recoilTimerRef.current = setTimeout(() => {
          setRecoilStyle({ x: 0, y: 0, rotate: 0, scale: 1 });
        }, 160);

        // Add splat decal with capped limit (max 25)
        const newSplat: SplatDecal = {
          id: Date.now() + Math.random(),
          x: targetXPercent,
          y: targetYPercent,
          type: weapon.id,
          size: weapon.id === 'dumbbell' ? 70 : weapon.id === 'cake' ? 65 : 55,
          rotation: Math.floor(Math.random() * 360),
          opacity: 0.92,
        };

        setSplats((prev) => [...prev.slice(-24), newSplat]);

        // Add comic speech bubble
        const phrase = COMIC_PHRASES[Math.floor(Math.random() * COMIC_PHRASES.length)];
        const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#fbbf24'];
        const bubbleId = Date.now() + Math.random();
        setComicBubbles((prev) => [
          ...prev.slice(-3),
          {
            id: bubbleId,
            text: phrase,
            x: targetXPercent,
            y: Math.max(12, targetYPercent - 14),
            color: colors[Math.floor(Math.random() * colors.length)],
          },
        ]);

        const bubbleTimer = setTimeout(() => {
          setComicBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
        }, 950);
        activeTimersRef.current.push(bubbleTimer);

        // Increment stats
        setSessionHits((prev) => {
          const next = prev + 1;
          if (next % 15 === 0) {
            sound.playCelebrationHorn();
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          return next;
        });

        setCombo((prev) => prev + 1);

        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setCombo(0), 1800);

        // Sync with Realtime Supabase RPC
        recordHit(1);
      }, 160);

      activeTimersRef.current.push(flightTimer);
    },
    [selectedWeapon, playImpactSound, recordHit]
  );

  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    throwItemAt(
      Math.max(8, Math.min(92, x)),
      Math.max(8, Math.min(92, y))
    );
  };

  // Keyboard spacebar trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        throwItemAt(
          50 + (Math.random() * 26 - 13),
          42 + (Math.random() * 26 - 13)
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [throwItemAt]);

  // Rapid barrage (7x salvo)
  const handleRapidBarrage = () => {
    sound.playCelebrationHorn();
    let count = 0;
    const interval = setInterval(() => {
      const rx = 36 + Math.random() * 28;
      const ry = 30 + Math.random() * 35;
      throwItemAt(rx, ry);
      count++;
      if (count >= 7) {
        clearInterval(interval);
      }
    }, 120);
  };

  const handleCleanPhoto = () => {
    sound.playSponge();
    setSplats([]);
    setCombo(0);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedPhotoUrl(result);
        try {
          localStorage.setItem('sahaj_custom_target_photo', result);
        } catch {
          // ignore
        }
        sound.playCelebrationHorn();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    setUploadedPhotoUrl(null);
    try {
      localStorage.removeItem('sahaj_custom_target_photo');
    } catch {
      // ignore
    }
    sound.playTick();
  };

  return (
    <section id="simulator" className="py-20 md:py-28 border-t border-slate-900 bg-slate-950 relative overflow-hidden bg-radial-spotlight">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-rose-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>Interactive Target Practice · Operation R4 914</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            GPL Live Target Simulator
          </h2>

          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Harmless virtual target practice. Throw eggs, belts, rods, sticks, and chocolate cake directly at Sahaj before the 12:00 AM midnight raid at <strong className="text-rose-400 font-bold">R4 914</strong>!
          </p>
        </div>

        {/* Simulator Grid: Mobile puts Target Board first (order-1), Controls second (order-2) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Target Photo Board & Arena (Right Column on desktop, Top on mobile) */}
          <div className="lg:col-span-8 flex flex-col items-center order-1 lg:order-2 w-full">
            
            {/* HUD Status Bar above target */}
            <div className="w-full max-w-[520px] flex items-center justify-between px-3 mb-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                <Crosshair className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>CLICK / TAP TARGET OR PRESS SPACE</span>
              </div>

              <div className="flex items-center gap-2">
                <RealtimeStatus status={connectionStatus} />
                {combo > 1 && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-bounce text-xs font-tabular shadow-lg shadow-rose-900/50">
                    <span>🔥 {combo}× COMBO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Target Assembly with GPU-Accelerated Transform Recoil */}
            <div
              style={{
                transform: `translate3d(${recoilStyle.x}px, ${recoilStyle.y}px, 0) rotate(${recoilStyle.rotate}deg) scale3d(${recoilStyle.scale}, ${recoilStyle.scale}, 1)`,
                transition: 'transform 0.08s ease-out',
                willChange: recoilStyle.scale !== 1 ? 'transform' : 'auto',
              }}
              className="w-full max-w-[520px] p-2.5 sm:p-3 rounded-[32px] bg-gradient-to-b from-slate-800/90 via-slate-900 to-slate-950 border border-slate-700/60 shadow-2xl shadow-black/80"
            >
              {/* Inner Target Chassis with Grid Texture & Scanner */}
              <div
                ref={photoContainerRef}
                onClick={handleTargetClick}
                className="relative w-full aspect-[3/4] rounded-[24px] bg-[#0c1017] border border-white/10 select-none overflow-hidden cursor-crosshair group shadow-inner"
              >
                {/* Tactical Grid Overlay */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                />

                {/* Ambient Soft Vignette */}
                <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10 opacity-70"
                     style={{ background: 'radial-gradient(circle at 50% 45%, transparent 50%, rgba(3, 7, 18, 0.75) 100%)' }} />

                {/* Subtle Radar Scanner Line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent animate-scanner pointer-events-none z-20" />

                {/* Corner Tactical Labels */}
                <div className="absolute top-3.5 left-3.5 z-20 px-2.5 py-1 rounded-md bg-black/75 border border-slate-700/80 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider text-slate-200">
                  TARGET: SAHAJ · R4 914
                </div>

                <div className="absolute top-3.5 right-3.5 z-20 px-2 py-1 rounded-md bg-black/75 border border-slate-700/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 font-semibold">
                  ELEVATION: FL 9
                </div>

                {/* Upper Whitespace & Centered Sahaj Portrait */}
                <div className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden pt-12">
                  <img
                    src={uploadedPhotoUrl || sahajTargetImg}
                    alt="Sahaj - Birthday Target at R4 914"
                    loading="eager"
                    decoding="async"
                    className="w-[84%] max-h-[92%] object-contain object-bottom pointer-events-none select-none transition-all duration-200 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]"
                    style={{
                      transform: 'translate3d(0, 0, 0)',
                    }}
                  />
                </div>

                {/* Splat Decals Layer */}
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {splats.map((splat) => {
                    const weapon = WEAPONS.find((w) => w.id === splat.type) || WEAPONS[0];
                    return (
                      <div
                        key={splat.id}
                        style={{
                          position: 'absolute',
                          left: `${splat.x}%`,
                          top: `${splat.y}%`,
                          transform: `translate3d(-50%, -50%, 0) rotate(${splat.rotation}deg) scale3d(1, 1, 1)`,
                          width: `${splat.size}px`,
                          height: `${splat.size}px`,
                          opacity: splat.opacity,
                        }}
                        className="flex items-center justify-center animate-in zoom-in-75 duration-100"
                      >
                        {splat.type === 'egg' ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-amber-400/90 rounded-full blur-[2px] shadow-lg shadow-amber-500/50" />
                            <div className="absolute w-6 h-6 bg-amber-300 rounded-full" />
                            <span className="relative text-2xl">🍳</span>
                          </div>
                        ) : splat.type === 'cake' ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute w-14 h-14 bg-amber-900/80 rounded-full blur-[3px]" />
                            <span className="relative text-3xl">🎂</span>
                          </div>
                        ) : splat.type === 'balloon' ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-sky-400/70 rounded-full blur-[3px]" />
                            <span className="relative text-2xl">💧</span>
                          </div>
                        ) : (
                          <span className="text-3xl filter drop-shadow-md select-none">{weapon.icon}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Flying Projectiles Layer */}
                <div className="absolute inset-0 pointer-events-none z-30">
                  {flyingItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        left: `${item.targetX}%`,
                        top: `${item.targetY}%`,
                        transform: 'translate3d(-50%, -50%, 0) scale3d(1.3, 1.3, 1)',
                        transition: 'all 0.16s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      }}
                      className="text-3xl filter drop-shadow-2xl animate-spin select-none"
                    >
                      {item.icon}
                    </div>
                  ))}
                </div>

                {/* Comic Speech Bubbles Layer */}
                <div className="absolute inset-0 pointer-events-none z-40">
                  {comicBubbles.map((bubble) => (
                    <div
                      key={bubble.id}
                      style={{
                        position: 'absolute',
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        transform: 'translate3d(-50%, -100%, 0)',
                      }}
                      className="animate-in zoom-in duration-150 whitespace-nowrap px-3 py-1 rounded-xl text-white font-extrabold text-[11px] font-display uppercase tracking-wider shadow-2xl border-2 border-white/40 filter drop-shadow-lg"
                      css-color={bubble.color}
                      style-bg={bubble.color}
                    >
                      <div
                        className="px-2.5 py-1 rounded-lg shadow-md"
                        style={{ backgroundColor: bubble.color }}
                      >
                        {bubble.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Glass HUD Telemetry Overlay (Bottom) */}
                <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-[11px] font-mono">
                  <div>
                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">Session Hits</div>
                    <div className="text-rose-400 font-bold text-sm font-tabular">{sessionHits}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">Global Hits</div>
                    <div className="text-white font-bold text-sm font-tabular">{globalHits.toLocaleString()}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-400 text-[9px] uppercase tracking-wider">Combo</div>
                    <div className="text-amber-400 font-bold text-sm font-tabular">×{combo}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Action Buttons beneath target */}
            <div className="mt-4 flex items-center justify-center gap-3 w-full max-w-[520px]">
              <button
                onClick={handleRapidBarrage}
                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/60 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Rapid Barrage (7× Salvo)</span>
              </button>

              <button
                onClick={handleCleanPhoto}
                className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs transition-colors active:scale-95"
                title="Wash splatters"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>🧽 Sponge Wash</span>
              </button>
            </div>
          </div>

          {/* Left Column: Material Selector & Arsenal Controls (Order-2 on mobile, Order-1 on desktop) */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-1 w-full">
            
            {/* Weapon Selector Card */}
            <div className="p-5 rounded-2xl glass-panel">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Select Throwing Material
                </span>
                <span className="text-[11px] text-amber-400 font-mono font-semibold">
                  {WEAPONS.length} Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {WEAPONS.map((w) => {
                  const isSelected = selectedWeapon === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWeapon(w.id);
                        sound.playTick();
                      }}
                      className={`min-h-[48px] flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-rose-600/90 text-white shadow-lg shadow-rose-950/80 font-bold border border-rose-400/50 scale-[1.01]'
                          : 'bg-slate-950/60 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1 bg-black/30 rounded-lg">{w.icon}</span>
                        <div>
                          <div className="text-sm font-semibold">{w.name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                            {w.impactDesc}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-300'
                        }`}
                      >
                        {w.damage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Customizer */}
            <div className="p-5 rounded-2xl glass-panel space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Custom Target Calibration
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>Upload Friend Photo</span>
                </button>

                {uploadedPhotoUrl && (
                  <button
                    onClick={handleResetPhoto}
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-700 text-xs text-rose-400 transition-colors"
                    title="Reset to default Sahaj portrait"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                {uploadedPhotoUrl
                  ? 'Using custom uploaded friend portrait.'
                  : 'Currently targeting Sahaj (R4 914). You can also upload a friend photo!'}
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
