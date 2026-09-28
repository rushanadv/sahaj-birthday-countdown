import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  Zap,
  Camera,
  Trash2,
  Volume2,
  Radio,
  Crosshair,
  Award,
  Upload,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { localStore } from '../utils/storage';

interface SplatDecal {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: string;
  size: number;
  rotation: number;
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
    sound: 'egg',
    impactDesc: 'Raw yolk splatter on face',
    damage: '+25 XP',
  },
  {
    id: 'belt',
    name: 'Leather Belt',
    icon: '🪢',
    color: '#ef4444',
    sound: 'whip',
    impactDesc: 'Hostel birthday bump slap',
    damage: '+30 XP',
  },
  {
    id: 'rod',
    name: 'Acoustic Rod',
    icon: '🦯',
    color: '#94a3b8',
    sound: 'thud',
    impactDesc: 'Door rattle metal clack',
    damage: '+20 XP',
  },
  {
    id: 'stick',
    name: 'Hostel Stick',
    icon: '🪵',
    color: '#b45309',
    sound: 'thud',
    impactDesc: 'Traditional wooden tap',
    damage: '+25 XP',
  },
  {
    id: 'dumbbell',
    name: '10kg Dumbbell',
    icon: '🏋️',
    color: '#64748b',
    sound: 'heavy',
    impactDesc: 'Door barricade shockwave',
    damage: '+50 XP',
  },
  {
    id: 'cake',
    name: 'Chocolate Cake',
    icon: '🎂',
    color: '#d97706',
    sound: 'cake',
    impactDesc: 'Truffle frosting cream smash',
    damage: '+40 XP',
  },
  {
    id: 'balloon',
    name: 'Water Balloon',
    icon: '🎈',
    color: '#38bdf8',
    sound: 'egg',
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
  const [isWobbling, setIsWobbling] = useState(false);
  const [combo, setCombo] = useState(0);
  const [sessionHits, setSessionHits] = useState(0);
  const [globalHits, setGlobalHits] = useState<number>(142);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(() => {
    return localStorage.getItem('sahaj_custom_target_photo');
  });

  const photoContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboTimerRef = useRef<number | null>(null);

  // Sync Global GPL Counter with localStore
  useEffect(() => {
    const unsubscribe = localStore.subscribe<number>('gpl_hits', (hits) => {
      setGlobalHits(hits || 247);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Play weapon impact sound
  const playImpactSound = (weaponId: string) => {
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
  };

  // Launch projectile towards (x, y) on Sahaj
  const throwItemAt = (targetXPercent: number, targetYPercent: number) => {
    const weapon = WEAPONS.find((w) => w.id === selectedWeapon) || WEAPONS[0];
    const projectileId = Date.now() + Math.random();

    // Spawning animation
    setFlyingItems((prev) => [
      ...prev,
      {
        id: projectileId,
        startX: 50 + (Math.random() * 20 - 10),
        startY: 110,
        targetX: targetXPercent,
        targetY: targetYPercent,
        icon: weapon.icon,
      },
    ]);

    // Fly animation time (180ms)
    setTimeout(() => {
      // Remove projectile
      setFlyingItems((prev) => prev.filter((p) => p.id !== projectileId));

      // Trigger impact sound & wobble
      playImpactSound(weapon.id);
      setIsWobbling(true);
      setTimeout(() => setIsWobbling(false), 220);

      // Add splat decal
      const newSplat: SplatDecal = {
        id: Date.now() + Math.random(),
        x: targetXPercent,
        y: targetYPercent,
        type: weapon.id,
        size: weapon.id === 'dumbbell' ? 70 : weapon.id === 'cake' ? 65 : 55,
        rotation: Math.floor(Math.random() * 360),
      };

      setSplats((prev) => [...prev.slice(-30), newSplat]);

      // Add comic speech bubble
      const phrase = COMIC_PHRASES[Math.floor(Math.random() * COMIC_PHRASES.length)];
      const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#fbbf24'];
      const bubbleId = Date.now() + Math.random();
      setComicBubbles((prev) => [
        ...prev.slice(-4),
        {
          id: bubbleId,
          text: phrase,
          x: targetXPercent,
          y: Math.max(10, targetYPercent - 15),
          color: colors[Math.floor(Math.random() * colors.length)],
        },
      ]);

      setTimeout(() => {
        setComicBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      }, 1000);

      // Increment stats
      setSessionHits((prev) => prev + 1);
      setCombo((prev) => prev + 1);

      // Reset combo if idle
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => setCombo(0), 1800);

      // Increment localStore counter (synced cross-tab & persistent)
      localStore.incrementHits(1);

      // Confetti every 15 hits
      if ((sessionHits + 1) % 15 === 0) {
        sound.playCelebrationHorn();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 180);
  };

  // Click on target board handler
  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    throwItemAt(
      Math.max(5, Math.min(95, x)),
      Math.max(5, Math.min(95, y))
    );
  };

  // Keyboard Spacebar trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        throwItemAt(
          50 + (Math.random() * 30 - 15),
          45 + (Math.random() * 30 - 15)
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Rapid fire burst
  const handleRapidBarrage = () => {
    sound.playCelebrationHorn();
    let count = 0;
    const interval = setInterval(() => {
      const rx = 35 + Math.random() * 30;
      const ry = 30 + Math.random() * 40;
      throwItemAt(rx, ry);
      count++;
      if (count >= 7) {
        clearInterval(interval);
      }
    }, 130);
  };

  // Clean / Wash with sponge
  const handleCleanPhoto = () => {
    sound.playSponge();
    setSplats([]);
    setCombo(0);
  };

  // Handle user photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedPhotoUrl(result);
        localStorage.setItem('sahaj_custom_target_photo', result);
        sound.playCelebrationHorn();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    setUploadedPhotoUrl(null);
    localStorage.removeItem('sahaj_custom_target_photo');
    sound.playTick();
  };

  return (
    <section id="simulator" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950/90 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/40 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>Interactive Target Practice · Operation R4 914</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            GPL Live Target Simulator
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Practice throwing belts, chilled eggs, rods, sticks, dumbbells, and cake directly at Sahaj before the 12:00 AM raid at <strong className="text-rose-400">R4 914</strong>!
          </p>
        </div>

        {/* Simulator Main Stage */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Weapon Selector & Arsenal Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Weapon Selector Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Throwing Material
                </span>
                <span className="text-[11px] text-amber-400 font-semibold font-tabular">
                  {WEAPONS.length} Available
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
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 font-bold border border-rose-400/50'
                          : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1 bg-black/20 rounded-lg">{w.icon}</span>
                        <div>
                          <div className="text-sm font-semibold">{w.name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                            {w.impactDesc}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-300'
                      }`}>
                        {w.damage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Photo Switcher */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Hostel Tactics & Controls
              </div>

              {/* Rapid Fire Button */}
              <button
                onClick={handleRapidBarrage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-950 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>Rapid Fire Barrage (7x Salvo)</span>
              </button>

              {/* Sponge Clean Button */}
              <button
                onClick={handleCleanPhoto}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>🧽 Sponge Wash (Clear Splatters)</span>
              </button>

              {/* Photo Upload / Switcher */}
              <div className="pt-2 border-t border-slate-800">
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
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                    title="Upload or change Sahaj's photo"
                  >
                    <Upload className="w-3.5 h-3.5 text-rose-400" />
                    <span>Upload Sahaj Photo</span>
                  </button>

                  {uploadedPhotoUrl && (
                    <button
                      onClick={handleResetPhoto}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-700 text-xs text-rose-400 transition-colors"
                      title="Reset to default portrait"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">
                  {uploadedPhotoUrl
                    ? 'Using custom uploaded Sahaj photo.'
                    : 'Click above to upload IMG20260923133805.jpg or any friend photo!'}
                </p>
              </div>
            </div>

            {/* Live Stats Box */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <div>
                  <div className="text-slate-400 font-medium">Live Global Hits</div>
                  <div className="font-tabular font-bold text-white text-base">
                    {globalHits} Delivered
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-400 font-medium">Your Session</div>
                <div className="font-tabular font-bold text-rose-400 text-base">
                  {sessionHits} Hits
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: The Target Photo Board & Arena (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            {/* Top Bar above target: Instruction and Combo meter */}
            <div className="w-full flex items-center justify-between px-2 mb-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">Click or tap anywhere on Sahaj to throw!</span>
              </div>

              {combo > 1 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-bounce text-xs font-tabular">
                  <span>🔥 {combo}x COMBO!</span>
                </div>
              )}
            </div>

            {/* Main Interactive Target Canvas Container */}
            <div
              ref={photoContainerRef}
              onClick={handleTargetClick}
              className={`relative w-full max-w-[500px] aspect-[3/4] rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl shadow-rose-950/40 select-none overflow-hidden cursor-crosshair group transition-transform duration-100 ${
                isWobbling ? 'scale-[0.98] rotate-1 ring-4 ring-rose-500/50' : 'hover:border-slate-700'
              }`}
            >
              {/* Photo Display: Either Uploaded Photo OR Stylized Sahaj Portrait */}
              {uploadedPhotoUrl ? (
                <img
                  src={uploadedPhotoUrl}
                  alt="Sahaj - Birthday Target at R4 914"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              ) : (
                /* High-fidelity Vector Portrait matching user's photo of Sahaj */
                <div className="relative w-full h-full bg-gradient-to-b from-stone-200 via-amber-50 to-stone-300 flex flex-col items-center justify-end overflow-hidden pointer-events-none">
                  {/* Hostel Bathroom Tiled Background with Mirror */}
                  <div className="absolute inset-0 opacity-40">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                    <div className="absolute top-4 left-6 right-6 h-36 bg-slate-300/40 border-2 border-slate-400/30 rounded-xl" />
                  </div>

                  {/* Room Tag in Corner */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/75 border border-slate-700 text-white text-xs font-bold font-mono tracking-wider">
                    TARGET: SAHAJ · R4 914
                  </div>

                  {/* Character Illustration */}
                  <div className="relative flex flex-col items-center w-full">
                    {/* Head with Black Headband & White Glasses */}
                    <div className="relative w-44 h-52 flex flex-col items-center z-10 -mb-4">
                      {/* Dark Hair */}
                      <div className="w-40 h-28 bg-stone-900 rounded-t-full relative">
                        {/* Black Headband / Sweatband */}
                        <div className="absolute bottom-2 left-0 right-0 h-7 bg-black rounded-sm border-t border-b border-stone-800 flex items-center justify-center">
                          <span className="text-[9px] text-stone-500 font-mono tracking-widest">R4 SQUAD</span>
                        </div>
                      </div>

                      {/* Face Skin */}
                      <div className="w-36 h-36 bg-[#f5d0b0] rounded-b-[45px] -mt-2 relative shadow-inner flex flex-col items-center">
                        {/* Eyebrows */}
                        <div className="w-28 flex justify-between mt-3 px-2">
                          <div className="w-8 h-2 bg-stone-900 rounded-full rotate-6" />
                          <div className="w-8 h-2 bg-stone-900 rounded-full -rotate-6" />
                        </div>

                        {/* White-Framed Glasses (matching photo) */}
                        <div className="w-32 flex justify-between items-center mt-1 z-10">
                          {/* Left Lens */}
                          <div className="w-13 h-10 rounded-xl border-4 border-white bg-white/20 shadow-md flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-stone-900 rounded-full" />
                          </div>
                          {/* Bridge */}
                          <div className="w-4 h-1.5 bg-white -mt-2" />
                          {/* Right Lens */}
                          <div className="w-13 h-10 rounded-xl border-4 border-white bg-white/20 shadow-md flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-stone-900 rounded-full" />
                          </div>
                        </div>

                        {/* Beaming Birthday Grin (matching photo) */}
                        <div className="w-16 h-8 bg-stone-900 rounded-b-full border-t-2 border-stone-900 flex items-start justify-center overflow-hidden mt-3 shadow-sm">
                          <div className="w-12 h-3.5 bg-white rounded-b-md flex justify-around">
                            <div className="w-0.5 h-full bg-stone-200" />
                            <div className="w-0.5 h-full bg-stone-200" />
                            <div className="w-0.5 h-full bg-stone-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Torso: White Ribbed Tank Top / Banyan */}
                    <div className="relative w-64 h-52 bg-white rounded-t-[55px] shadow-lg flex flex-col items-center border-t-4 border-stone-200 overflow-hidden">
                      {/* Ribbed lines */}
                      <div className="absolute inset-0 opacity-15 flex justify-evenly">
                        <div className="w-0.5 h-full bg-stone-400" />
                        <div className="w-0.5 h-full bg-stone-400" />
                        <div className="w-0.5 h-full bg-stone-400" />
                        <div className="w-0.5 h-full bg-stone-400" />
                      </div>

                      {/* Neck Scoop */}
                      <div className="w-24 h-12 bg-[#f5d0b0] rounded-b-full" />

                      {/* Arms on Sides */}
                      <div className="absolute -left-4 top-10 w-12 h-44 bg-[#f5d0b0] rounded-full rotate-12" />
                      <div className="absolute -right-4 top-10 w-12 h-44 bg-[#f5d0b0] rounded-full -rotate-12" />

                      {/* Folded Shirt held in hands */}
                      <div className="mt-auto w-48 h-16 bg-stone-800 rounded-t-2xl shadow-md border-t border-stone-700 flex items-center justify-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          Ready for 12 AM GPL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Crosshair Watermark Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full border border-rose-500 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border border-rose-500" />
                </div>
              </div>

              {/* Rendered Permanent Splat Decals on Photo */}
              {splats.map((s) => (
                <div
                  key={s.id}
                  className="absolute pointer-events-none select-none transition-transform"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                  }}
                >
                  {/* Egg Splat Decal */}
                  {s.type === 'egg' && (
                    <div className="relative">
                      {/* Albumen Splatter */}
                      <div className="w-14 h-14 rounded-full bg-white/85 shadow-lg border border-amber-200/60 blur-[0.5px]" />
                      {/* Dripping Egg Yolk Center */}
                      <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md border border-amber-600/30" />
                      {/* Drips */}
                      <div className="absolute -bottom-2 left-4 w-2 h-4 bg-yellow-400/90 rounded-b-full" />
                    </div>
                  )}

                  {/* Belt Sting Decal */}
                  {s.type === 'belt' && (
                    <div className="w-16 h-3 bg-gradient-to-r from-transparent via-rose-600/90 to-transparent rounded-full shadow-lg shadow-rose-900/80 border-t border-rose-300/40" />
                  )}

                  {/* Rod Clack Spark Decal */}
                  {s.type === 'rod' && (
                    <div className="text-xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                      ⚡💥
                    </div>
                  )}

                  {/* Stick Whack Decal */}
                  {s.type === 'stick' && (
                    <div className="text-2xl filter drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">
                      💢
                    </div>
                  )}

                  {/* Dumbbell Crater Decal */}
                  {s.type === 'dumbbell' && (
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-rose-500 bg-black/40 flex items-center justify-center font-bold text-xs text-rose-400">
                      CRACK
                    </div>
                  )}

                  {/* Cake Smash Decal */}
                  {s.type === 'cake' && (
                    <div className="relative w-16 h-16 rounded-full bg-amber-950/90 border border-amber-700/80 shadow-xl flex items-center justify-center">
                      <span className="text-xl">🎂</span>
                      <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-rose-500" />
                    </div>
                  )}

                  {/* Water Balloon Decal */}
                  {s.type === 'balloon' && (
                    <div className="w-16 h-16 rounded-full bg-sky-400/40 border border-sky-300/70 shadow-lg blur-[0.5px]" />
                  )}
                </div>
              ))}

              {/* In-Flight Animated Projectiles */}
              {flyingItems.map((item) => (
                <div
                  key={item.id}
                  className="absolute pointer-events-none text-4xl filter drop-shadow-xl z-30 transition-all duration-200"
                  style={{
                    left: `${item.targetX}%`,
                    top: `${item.targetY}%`,
                    transform: 'translate(-50%, -50%) scale(1.1)',
                  }}
                >
                  {item.icon}
                </div>
              ))}

              {/* Floating Comic Exclamations */}
              {comicBubbles.map((bubble) => (
                <div
                  key={bubble.id}
                  className="absolute z-40 pointer-events-none font-display font-extrabold text-sm sm:text-base px-2.5 py-1 rounded-lg bg-black/90 border border-white/40 shadow-2xl animate-bounce"
                  style={{
                    left: `${bubble.x}%`,
                    top: `${bubble.y}%`,
                    color: bubble.color,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                >
                  {bubble.text}
                </div>
              ))}

              {/* Bottom Quick Bar inside canvas */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none px-2 py-1 rounded-xl bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-300">
                <span>Selected: <strong className="text-white">{WEAPONS.find((w) => w.id === selectedWeapon)?.name}</strong></span>
                <span className="text-rose-400 font-semibold">{splats.length} Splats Active</span>
              </div>
            </div>

            {/* Helper Caption */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                Tap anywhere on photo
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Spacebar</kbd>
                Auto Toss
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Live Cloud Sync
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
