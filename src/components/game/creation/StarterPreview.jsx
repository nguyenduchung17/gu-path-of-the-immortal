import React, { useEffect, useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import { GU_BY_ID } from '@/game/data/gu';
import { locGuDesc } from '@/game/i18n/tr';

const PATH_TINT = {
  fire: '#ff8a4a', lightning: '#ffe95a', water: '#4aa8ff', ice: '#a8e0ff',
  poison: '#b0e04a', wind: '#9fe8b0', earth: '#d9a04a', sword: '#dfe4f8',
  strength: '#e8975a',
};

const PATH_SFX = { fire: 'fire', wind: 'wind', earth: 'stone', water: 'water', strength: 'impact' };

// A tiny non-battle demonstration of a starter Gu: its attack animation, its
// signature status proc, and one line of description — before committing.
export default function StarterPreview({ guId }) {
  const { t } = useT();
  const gu = GU_BY_ID[guId];
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => { setPhase(2); sfx(PATH_SFX[gu?.path] || 'hit'); }, 1050);
    const t3 = setTimeout(() => setPhase(3), 1750);
    const t4 = setTimeout(() => setPhase(0), 2700);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [run, guId, gu?.path]);

  if (!gu) return null;
  const tint = PATH_TINT[gu.path] || '#8fd8a0';

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2.5" onClick={(e) => e.stopPropagation()}>
      <div className="relative h-24 overflow-hidden rounded bg-black/30">
        {/* ground band */}
        <div className="absolute bottom-0 inset-x-0 h-8 opacity-60"
          style={{ background: `repeating-linear-gradient(0deg, ${tint}22 0 3px, transparent 3px 7px)` }} />
        {/* cultivator token — lunges */}
        <div key={`p${run}${phase === 1 ? 'l' : ''}`}
          className={`absolute left-4 bottom-4 w-7 h-9 rounded-t-full ${phase === 1 ? 'animate-battle-lunge' : ''}`}
          style={{ background: 'linear-gradient(180deg, #2dd4bf, #134e4a)', boxShadow: `0 0 10px ${tint}66` }} />
        {/* foe token — reels when struck */}
        <div className={`absolute right-5 bottom-4 w-8 h-8 rounded-sm ${phase === 2 ? 'animate-battle-shake' : ''}`}
          style={{ background: 'linear-gradient(180deg, #9f1239, #4c0519)', opacity: phase >= 3 ? 0.45 : 1 }} />
        {/* projectile in flight — the Strength Path is pure melee: its fists
            lunge and connect, they never shoot a magical bolt */}
        {phase === 1 && gu.path !== 'strength' && (
          <div className="absolute left-14 bottom-6 w-2.5 h-2.5 rounded-full animate-battle-projectile"
            style={{ background: tint, boxShadow: `0 0 10px 3px ${tint}` }} />
        )}
        {/* impact burst + the Gu's signature status pop */}
        {phase === 2 && (
          <>
            <div className="absolute right-4 bottom-5 w-10 h-10 rounded-full border-2 animate-battle-impact"
              style={{ borderColor: tint, background: `radial-gradient(circle, ${tint}66, transparent 65%)` }} />
            <span key={`pop${run}`} className="absolute right-5 bottom-14 font-heading text-sm animate-battle-dmg whitespace-nowrap"
              style={{ color: tint, textShadow: '2px 2px 0 #000' }}>
              {t(`starter.${gu.id}.pop`)}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <p className="text-[10px] text-stone-400 leading-snug flex-1">{locGuDesc(gu)}</p>
        <button onClick={() => setRun((r) => r + 1)}
          className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-300 shrink-0">
          ▶ {t('starter.previewReplay')}
        </button>
      </div>
    </div>
  );
}