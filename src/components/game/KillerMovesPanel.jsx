import React, { useEffect, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { sfx } from '@/game/audio/sfx';
import ResearchTab from './killer/ResearchTab';
import KnownTab from './killer/KnownTab';
import LoadoutTab from './killer/LoadoutTab';
import BlueprintsTab from './killer/BlueprintsTab';

// KILLER MOVES (SÁT CHIÊU) — the dedicated, always-visible home of the system:
// Known / Research / Blueprints / Loadout. Opening it clears the
// notification dot on the hotbar button.
const TABS = [
  { id: 'known', icon: '★' },
  { id: 'research', icon: '⚗️' },
  { id: 'blueprints', icon: '📐' },
  { id: 'loadout', icon: '️⚔️' },
];

export default function KillerMovesPanel() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const known = state.killerMoves?.known || [];
  const [tab, setTab] = useState(known.length ? 'known' : 'research');

  // opening the panel clears the "research now available" dot (#25)
  useEffect(() => { if (!state.killerMoves?.seen) dispatch({ type: 'KM_SEEN' }); }, []);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-stone-500 px-1">{t('km.subtitle')}</p>
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => { sfx('ui'); setTab(tb.id); }}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
              tab === tb.id ? 'bg-amber-900/50 border-amber-600/60 text-amber-100' : 'bg-black/30 border-stone-700 text-stone-400 hover:text-stone-200'}`}>
            {tb.icon} {t(`km.tab.${tb.id}`)}
            {tb.id === 'known' && known.length ? ` (${known.length})` : ''}
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