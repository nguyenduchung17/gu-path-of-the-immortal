import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { ENEMIES, DANGER_LABEL, DANGER_COLOR, visualOf } from '@/game/data/enemies';
import { ITEM_BY_ID } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';

// Field records of every foe met on the road. A beast is named on first
// encounter; its weakness, spoils and lore are inscribed only once slain.
export default function BestiaryPanel() {
  const { state } = useGame();
  const { t } = useT();
  const bestiary = state.bestiary || {};
  const known = ENEMIES.filter(e => (bestiary[e.id]?.seen || 0) > 0);
  const slain = ENEMIES.filter(e => (bestiary[e.id]?.kills || 0) > 0);

  return (
    <div>
      <p className="text-[11px] text-stone-400 mb-3">
        {t('bestiary.progress', { known: known.length, total: ENEMIES.length, slain: slain.length })}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ENEMIES.map((e) => {
          const rec = bestiary[e.id] || {};
          const seen = rec.seen || 0;
          const kills = rec.kills || 0;
          const v = visualOf(e.id);
          if (!seen) return (
            <div key={e.id} className="rounded-xl border border-stone-800 bg-black/30 p-3 opacity-60 text-center py-5">
              <div className="font-heading text-lg text-stone-600">???</div>
              <div className="text-[10px] text-stone-600">{t('bestiary.notMet')}</div>
            </div>
          );
          return (
            <div key={e.id} className="rounded-xl border bg-[#131b16] p-3" style={{ borderColor: `${DANGER_COLOR[v.danger]}55` }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-stone-100">{e.name}</div>
                <span className="text-[10px] shrink-0" style={{ color: DANGER_COLOR[v.danger] }}>{DANGER_LABEL[v.danger]}</span>
              </div>
              <div className="text-[10px] text-stone-400 mb-2">
                {v.rank} · {t('bestiary.seen', { n: seen, k: kills })}
              </div>
              {kills > 0 ? (
                <div className="space-y-1 text-[11px] text-stone-300">
                  <div>🧬 {t('bestiary.stats', { hp: e.hp, atk: e.attack, def: e.defense })}</div>
                  <div>
                    ⚔️ {t('bestiary.weakness')}: <span className="text-amber-300">
                      {e.weakness === 'none'
                        ? t('ui.none')
                        : `${PATH_BY_ID[e.weakness]?.icon || ''} ${PATH_BY_ID[e.weakness]?.name || e.weakness}`}
                    </span>
                  </div>
                  <div>
                    🎁 {t('bestiary.drops')}: <span className="text-stone-400">
                      {(e.drops || []).map(d => `${d.chance}% ${ITEM_BY_ID[d.itemId]?.name || d.itemId}`).join(' · ')}
                    </span>
                  </div>
                  <div className="italic text-stone-400 pt-1">“{e.description}”</div>
                </div>
              ) : (
                <div className="text-[10px] text-stone-500">{t('bestiary.locked')}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}