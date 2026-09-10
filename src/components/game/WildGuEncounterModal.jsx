import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { SPECIES_BY_ID, captureChanceOf, CONDITION_FRAC, conditionLabel } from '@/game/data/wildGu';
import { ITEM_BY_ID } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';
import { BALANCE } from '@/game/config/balance';
import { getWildGuSheet } from '@/game/gfx/wildGuSprites';
import { sfx } from '@/game/audio/sfx';

const RARITY_COLOR = {
  common: 'text-stone-300', uncommon: 'text-lime-300', rare: 'text-amber-300',
  epic: 'text-fuchsia-300', legendary: 'text-orange-300',
};

function SpeciesSprite({ sp }) {
  const ref = useRef(null);
  useEffect(() => {
    let f = 0;
    const iv = setInterval(() => {
      f = 1 - f;
      const c = ref.current;
      if (!c) return;
      const g = c.getContext('2d');
      g.clearRect(0, 0, 16, 16);
      g.drawImage(getWildGuSheet(sp.id).frames[f], 0, 0);
    }, sp.pace || 300);
    return () => clearInterval(iv);
  }, [sp.id]);
  return <canvas ref={ref} width={16} height={16} className="pixelated" style={{ width: 80, height: 80 }} />;
}

// A face-to-face meeting with a wild Gu — never an auto-fight. Observe to
// learn its ways (and steady the capture), capture with a containment item,
// attack for materials, or leave it in peace.
export default function WildGuEncounterModal() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const e = state.wildEncounter;
  const wg = (state.worldState.wildGu || []).find(w => w.id === e?.worldId && !w.gone);
  const [jarId, setJarId] = useState(null);

  // default to the best containment item the player carries
  useEffect(() => {
    if (jarId) return;
    const owned = Object.keys(BALANCE.capture.jarBonus)
      .filter(id => (state.inventory.guGear?.[id] || 0) > 0)
      .sort((a, b) => (BALANCE.capture.jarBonus[b] || 0) - (BALANCE.capture.jarBonus[a] || 0));
    if (owned.length) setJarId(owned[0]);
  }, [e?.worldId]);

  if (!e || !wg) return null;
  const sp = SPECIES_BY_ID[wg.speciesId];
  const frac = CONDITION_FRAC(wg);
  const chance = captureChanceOf(state, wg, e, jarId);
  const jars = Object.keys(BALANCE.capture.jarBonus).map(id => ({ id, count: state.inventory.guGear?.[id] || 0 }));

  const act = (type, extra = {}) => { sfx('confirm'); dispatch({ type, ...extra }); };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="max-w-md w-full rounded-2xl border border-emerald-800/60 bg-[#0d1410] p-5 animate-pop">
        <div className="text-center text-[11px] font-heading tracking-[0.25em] text-amber-200/90">{t('enc.title')}</div>

        <div className="flex gap-4 mt-3">
          <div className="shrink-0 flex flex-col items-center">
            <div className="rounded-xl border border-emerald-700/40 bg-black/40 p-1">
              <SpeciesSprite sp={sp} />
            </div>
            <div className="text-[9px] text-stone-500 mt-1">{PATH_BY_ID[sp.path]?.icon} {sp.behavior === 'passive' ? '🍃' : sp.behavior === 'territorial' ? '⚔️' : '👁️'}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-emerald-100">{sp.name}</div>
            <div className={`text-xs ${RARITY_COLOR[sp.rarity] || 'text-stone-300'} capitalize`}>{t('enc.rarity')}: {sp.rarity}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[11px]">
              <span className="text-stone-400">{t('enc.rank')}</span><span className="text-stone-200">{sp.rank}</span>
              <span className="text-stone-400">{t('enc.path')}</span><span className="text-stone-200">{PATH_BY_ID[sp.path]?.name}</span>
              <span className="text-stone-400">{t('enc.condition')}</span>
              <span className={frac > 0.85 ? 'text-emerald-300' : frac > 0.4 ? 'text-amber-300' : 'text-rose-300'}>{t(conditionLabel(frac))}</span>
              <span className="text-stone-400">{t('enc.temperament')}</span>
              <span className="text-stone-200">{t(`enc.beh.${sp.behavior === 'territorial' ? 'territorial' : 'passive'}`)}</span>
            </div>
            {e.observed && (
              <div className="mt-2 text-[10px] text-sky-300/90 space-y-0.5">
                <div>🔍 {t('enc.observed')} · {t('bestiary.weakness')}: {sp.weakness === 'none' ? t('ui.none') : PATH_BY_ID[sp.weakness]?.name}</div>
                <div>🍖 {t('enc.food')}: {ITEM_BY_ID[sp.foodType]?.name || sp.foodType}</div>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-stone-400 italic mt-3">{sp.sense}</p>

        {/* capture planning */}
        <div className="mt-3 rounded-lg border border-emerald-900/50 bg-emerald-900/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-stone-300">{t('enc.captureChance')}</div>
            <div className="text-lg font-semibold text-emerald-300">{chance}%</div>
          </div>
          {jars.some(j => j.count > 0) ? (
            <div className="flex gap-1.5 mt-2">
              {jars.filter(j => j.count > 0).map(j => (
                <button key={j.id} onClick={() => { sfx('ui'); setJarId(j.id); }}
                  className={`text-[10px] px-2 py-1 rounded-lg border ${jarId === j.id ? 'border-emerald-500 bg-emerald-800/40 text-emerald-200' : 'border-stone-700 bg-black/30 text-stone-300'}`}>
                  {ITEM_BY_ID[j.id].name} ×{j.count}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-amber-300/80 mt-1">{t('enc.noContainer')}</div>
          )}
          {e.observed && <div className="text-[9px] text-sky-300/70 mt-1.5">+{BALANCE.capture.observeBonus}% {t('enc.observed')}</div>}
          <div className="text-[9px] text-stone-500 mt-1">{t('enc.containerSpent')}</div>
          <div className={`text-[9px] mt-0.5 ${sp.behavior === 'passive' ? 'text-amber-300/70' : 'text-rose-300/70'}`}>
            {sp.behavior === 'passive' ? t('enc.mayFlee') : t('enc.willFight')}
          </div>
        </div>

        {/* options — capture / attack / observe / leave */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => act('ENCOUNTER_CAPTURE', { itemId: jarId })}
            disabled={!jarId}
            className={`py-2.5 rounded-lg text-sm font-medium ${jarId ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
            🐉 {t('enc.capture')}
          </button>
          <button onClick={() => act('ENCOUNTER_ATTACK')}
            className="py-2.5 rounded-lg bg-rose-800/70 hover:bg-rose-700 text-rose-100 text-sm font-medium">
            ⚔️ {t('enc.attack')}
          </button>
          <button onClick={() => { sfx('ui'); dispatch({ type: 'ENCOUNTER_OBSERVE' }); }} disabled={e.observed}
            className={`py-2 rounded-lg text-sm ${e.observed ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-sky-800/60 hover:bg-sky-700 text-sky-100'}`}>
            🔍 {t('enc.observe')}
          </button>
          <button onClick={() => act('ENCOUNTER_LEAVE')}
            className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-sm">
            🚶 {t('enc.leave')}
          </button>
        </div>
      </div>
    </div>
  );
}