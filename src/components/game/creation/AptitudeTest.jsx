import React, { useEffect, useRef, useState } from 'react';
import { useT } from '@/game/i18n/LangContext';

const PULSES = 10;

// Aptitude-testing minigame: essence pours into the vessel in pulses; the
// player must tap while the sweeping pulse is inside the stable arc. The
// resulting stability (0–100) feeds the final aptitude score as a small bonus.
export default function AptitudeTest({ onDone, onCancel }) {
  const { t } = useT();
  const [round, setRound] = useState(0);          // completed pulses
  const [flash, setFlash] = useState(null);       // 'hit' | 'miss'
  const [angle, setAngle] = useState(0);         // live marker angle (deg)
  const [zone, setZone] = useState(() => ({ start: 90, width: 60 }));
  const [running, setRunning] = useState(true);
  const state = useRef({ angle: 0, speed: 150, hits: 0, last: performance.now() });

  // pick a fresh sweep speed + stable arc for each pulse
  useEffect(() => {
    if (round >= PULSES) { setRunning(false); return; }
    state.current.speed = 140 + round * 14 + Math.random() * 40;
    state.current.angle = state.current.angle % 360;
    setZone({ start: Math.random() * 360, width: Math.max(34, 60 - round * 2.5) });
  }, [round]);

  useEffect(() => {
    if (!running) return;
    let raf;
    const loop = (now) => {
      const s = state.current;
      s.angle = (s.angle + (s.speed * (now - s.last)) / 1000) % 360;
      s.last = now;
      setAngle(s.angle);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const inZone = (a) => {
    let diff = (a - zone.start) % 360;
    if (diff < 0) diff += 360;
    return diff <= zone.width;
  };

  const pulse = () => {
    if (!running || round >= PULSES) return;
    const hit = inZone(state.current.angle);
    if (hit) state.current.hits += 1;
    setFlash(hit ? 'hit' : 'miss');
    setTimeout(() => setFlash(null), 350);
    setRound(r => r + 1);
  };

  if (round >= PULSES) {
    const perf = Math.round((state.current.hits / PULSES) * 100);
    return (
      <div className="text-center py-6 animate-pop">
        <div className="text-3xl mb-2">🫧</div>
        <div className="text-lg font-heading text-emerald-200">{t('aptGame.score', { n: perf })}</div>
        <div className="flex gap-2 justify-center mt-4">
          <button onClick={() => onDone(perf)} className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
            {t('ui.confirm')}
          </button>
        </div>
      </div>
    );
  }

  const fill = (round / PULSES) * 100;
  return (
    <div className="text-center animate-fade-in">
      <div className="text-[11px] uppercase tracking-widest text-emerald-300/80 mb-1">{t('aptGame.title')}</div>
      <div className="text-[11px] text-stone-400 mb-3">{t('aptGame.desc')}</div>
      <div className="text-[10px] text-stone-500 mb-2">{t('aptGame.pulse', { n: round + 1, total: PULSES })}</div>

      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* vessel outline + essence fill level */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1c2a22" strokeWidth="7" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeDasharray={`${(fill / 100) * 327} 327`} strokeLinecap="round" opacity="0.8" className="transition-all duration-500" />
          {/* stable arc */}
          <circle cx="60" cy="60" r="44" fill="none" stroke="#34d399" strokeWidth="10" opacity="0.5"
            strokeDasharray={`${(zone.width / 360) * 276} 276`} transform={`rotate(${zone.start} 60 60)`} />
        </svg>
        {/* sweeping pulse marker */}
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${angle}deg)` }}>
          <div className="absolute left-1/2 -top-0.5 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_10px_3px_rgba(103,232,249,0.8)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {flash && (
            <div key={round} className={`font-heading text-sm ${flash === 'hit' ? 'text-emerald-300' : 'text-rose-300'} animate-battle-dmg`}>
              {flash === 'hit' ? t('aptGame.hit') : t('aptGame.miss')}
            </div>
          )}
        </div>
      </div>

      <button onClick={pulse}
        className="mt-4 px-12 py-3 rounded-lg bg-sky-700 hover:bg-sky-600 border border-sky-400/40 text-white text-lg font-heading tracking-widest shadow-[0_0_16px_rgba(56,189,248,0.35)] active:scale-95 transition">
        ✦
      </button>
      <div className="mt-3">
        <button onClick={onCancel} className="text-xs text-stone-500 hover:text-stone-300">{t('ui.back')}</button>
      </div>
    </div>
  );
}