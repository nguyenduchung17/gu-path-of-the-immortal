import React, { useEffect, useRef, useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';

// Experimentation minigame (#9): 3 resonance pulses sweep a bar; striking
// inside the golden band steadies the fusion. Each hit adds research chance
// — it raises the odds, never guarantees success.
const ROUNDS = 3;
const BONUS_PER_HIT = 8;   // % research chance per hit
const SPEED = 0.05;        // % of the bar per ms

export default function ResonanceGame({ onDone, onCancel }) {
  const { t } = useT();
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const [pos, setPos] = useState(0);
  const [zone, setZone] = useState({ start: 38, width: 24 });
  const posRef = useRef(0);
  const locked = useRef(false);

  // sweep the pulse across the bar
  useEffect(() => {
    let raf, prev = performance.now();
    const loop = (now) => {
      const dt = now - prev;
      prev = now;
      posRef.current = (posRef.current + dt * SPEED) % 100;
      setPos(posRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // fresh band each round, narrowing as the fusion gets demanding
  useEffect(() => {
    const width = Math.max(12, 24 - round * 5);
    setZone({ start: 15 + Math.random() * (70 - width), width });
    locked.current = false;
  }, [round]);

  const strike = () => {
    if (locked.current) return;
    locked.current = true;
    const inBand = posRef.current >= zone.start && posRef.current <= zone.start + zone.width;
    const nextHits = hits + (inBand ? 1 : 0);
    setHits(nextHits);
    setFlash(inBand ? 'hit' : 'miss');
    sfx(inBand ? 'chime' : 'fail');
    setTimeout(() => {
      setFlash(null);
      if (round + 1 >= ROUNDS) {
        onDone(nextHits * BONUS_PER_HIT);
      } else {
        setRound(r => r + 1);
      }
    }, 550);
  };

  return (
    <div className="rounded-lg border border-amber-700/50 bg-black/60 p-3 animate-pop">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading text-amber-200">⚡ {t('km.game.title')}</span>
        <span className="text-[10px] text-stone-400">{t('km.game.round', { n: round + 1, total: ROUNDS })}</span>
      </div>
      <p className="text-[10px] text-stone-400 mb-2">{t('km.game.hint')}</p>

      <div className="relative h-7 rounded bg-stone-900 border border-stone-700 overflow-hidden">
        <div className="absolute inset-y-0 bg-amber-500/40 border-x border-amber-400"
          style={{ left: `${zone.start}%`, width: `${zone.width}%` }} />
        <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"
          style={{ left: `${pos}%` }} />
      </div>

      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className={`text-[11px] ${flash === 'hit' ? 'text-emerald-300' : flash === 'miss' ? 'text-rose-300' : 'text-stone-500'}`}>
          {flash === 'hit' ? `✔ ${t('km.game.hit')} +${BONUS_PER_HIT}%` : flash === 'miss' ? `✖ ${t('km.game.miss')}` : `• ${hits}/${ROUNDS}`}
        </span>
        <div className="flex gap-1.5">
          <button onClick={onCancel} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-stone-300 text-[11px] hover:bg-white/10">
            {t('ui.close')}
          </button>
          <button onClick={strike} disabled={!!flash}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-heading tracking-wide">
            ⚡ ATTUNE
          </button>
        </div>
      </div>
    </div>
  );
}