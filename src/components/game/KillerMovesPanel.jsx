import React, { useState } from 'react';
import { useT } from '@/game/i18n/LangContext';
import { useGame } from '@/game/state/GameContext';
import { kmState, kmUnlocked } from '@/game/engine/killerMoves';
import ResearchTab from './killer/ResearchTab';
import KnownTab from './killer/KnownTab';
import BlueprintsTab from './killer/BlueprintsTab';
import LoadoutTab from './killer/LoadoutTab';
import { sfx } from '@/game/audio/sfx';

// KILLER MOVES — the dedicated menu (#1, #2). Nothing about a player's Killer
// Moves lives anywhere else: discover, review, blueprint and load out here.
export default function KillerMovesPanel() {
  const { state } = useGame();
  const { t } = useT();
  const [tab, setTab] = useState(state.killerMoves?.known?.length ? 'known' : 'research');
  const km = kmState(state);
  const knownN = (km.known || []).length;

  const TABS = [
    { id: 'known', label: `${t('km.tab.known')}${knownN ? ` (${knownN})` : ''}` },
    { id: 'research', label: t('km.tab.research') },
    { id: 'blueprints', label: t('km.tab.blueprints') },
    { id: 'loadout', label: t('km.tab.loadout') },
  ];

  // fewer than 2 Gu → the guided empty state instead of a confusing screen (#27)
  if ((state.ownedGu || []).length < 2) {
    return (
      <div className="rounded-lg border border-stone-700/60 bg-black/30 p-6 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <div className="text-xs font-heading text-stone-300">{t('km.locked.title')}</div>
        <p className="text-[11px] text-stone-500 mt-1.5">{t('km.locked.body')}</p>
        {!kmUnlocked(state) && <p className="text-[10px] text-stone-600 mt-1">{t('km.locked.lessons')}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-stone-500 mb-2">{t('km.tagline')}</p>
      <div className="flex gap-1 mb-3 flex-wrap">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => { sfx('ui'); setTab(tb.id); }}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
              tab === tb.id
                ? 'bg-amber-700/70 border-amber-500/60 text-amber-100'
                : 'bg-black/30 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab === 'known' && <KnownTab />}
      {tab === 'research' && <ResearchTab />}
      {tab === 'blueprints' && <BlueprintsTab />}
      {tab === 'loadout' && <LoadoutTab />}
    </div>
  );
}