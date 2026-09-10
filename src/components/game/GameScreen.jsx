import React, { useState, useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import TopBar from './TopBar';
import WorldView from './WorldView';
import CharacterPanel from './CharacterPanel';
import GuPanel from './GuPanel';
import RecipesPanel from './RecipesPanel';
import DaoMasteryPanel from './DaoMasteryPanel';
import InventoryPanel from './InventoryPanel';
import QuestsPanel from './QuestsPanel';
import MapPanel from './MapPanel';
import CombatView from './CombatView';
import EventModal from './EventModal';
import DialogueModal from './DialogueModal';
import ShopPanel from './ShopPanel';
import TutorialOverlay from './TutorialOverlay';
import RecoveryModal from './RecoveryModal';
import BreakthroughOverlay from './BreakthroughOverlay';
import Toasts from './Toasts';

export default function GameScreen() {
  const { state } = useGame();
  const [tab, setTab] = useState('world');
  const [shop, setShop] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => { if (state.combat) setTab('world'); }, [state.combat]);
  useEffect(() => { if (state.recovery) setTab('cultivation'); }, [state.recovery?.startedAt]);

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex flex-col">
      <TopBar tab={tab} setTab={setTab} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 pb-24">
        {tab === 'world' && <WorldView />}
        {tab === 'cultivation' && <CharacterPanel onRecover={() => setRecoveryOpen(true)} />}
        {tab === 'gu' && <GuPanel />}
        {tab === 'recipes' && <RecipesPanel />}
        {tab === 'dao' && <DaoMasteryPanel />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'quests' && <QuestsPanel />}
        {tab === 'map' && <MapPanel />}
      </main>
      {state.combat && <CombatView />}
      {state.pendingEvent && <EventModal />}
      {state.dialogue && <DialogueModal onShop={setShop} />}
      {shop && <ShopPanel npcId={shop} onClose={() => setShop(null)} />}
      <RecoveryModal open={recoveryOpen} onClose={() => setRecoveryOpen(false)} />
      <BreakthroughOverlay />
      <Toasts />
      <TutorialOverlay />
    </div>
  );
}