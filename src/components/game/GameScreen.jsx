import React, { useState, useEffect } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE } from '@/game/config/balance';
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
import MissionBoard from './MissionBoard';
import ContributionShopPanel from './ContributionShopPanel';
import ArenaPanel from './ArenaPanel';
import TutorialOverlay from './TutorialOverlay';
import RecoveryModal from './RecoveryModal';
import BreakthroughOverlay from './BreakthroughOverlay';
import InnModal from './InnModal';
import SleepOverlay from './SleepOverlay';
import MemorialPanel from './MemorialPanel';
import Toasts from './Toasts';

export default function GameScreen() {
  const { state, dispatch, activeSlot, exitToSlots, deleteSlot } = useGame();
  const [tab, setTab] = useState('world');
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [inn, setInn] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => { if (state.combat) setTab('world'); }, [state.combat]);
  useEffect(() => { if (state.recovery) setTab('cultivation'); }, [state.recovery?.startedAt]);

  // real-time heartbeat of the accelerated game clock (1s = 1 in-game minute,
  // configured in BALANCE.time). Paused while sleeping — sleep jumps to 07:00.
  useEffect(() => {
    if (state.sleeping || state.deceased) return;
    const t = setInterval(() => dispatch({ type: 'TIME_TICK' }), BALANCE.time.tickMs);
    return () => clearInterval(t);
  }, [state.sleeping, state.deceased, dispatch]);

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
      {state.dialogue && <DialogueModal onShop={setShop} onService={setService} onInn={setInn} />}
      {shop && <ShopPanel npcId={shop} onClose={() => setShop(null)} />}
      {service === 'missions' && <MissionBoard onClose={() => setService(null)} />}
      {service === 'contribution' && <ContributionShopPanel onClose={() => setService(null)} />}
      {service === 'arena' && <ArenaPanel onClose={() => setService(null)} />}
      {inn && <InnModal npcId={inn} onClose={() => setInn(null)} />}
      {state.sleeping && <SleepOverlay />}
      {state.deceased && (
        <MemorialPanel
          record={state.deceased}
          onCloseLabel="Return to Save Slots"
          onClose={exitToSlots}
          onDeleteLabel="Delete Save"
          onDelete={() => { deleteSlot(activeSlot); exitToSlots(); }}
        />
      )}
      <RecoveryModal open={recoveryOpen} onClose={() => setRecoveryOpen(false)} />
      <BreakthroughOverlay />
      <Toasts />
      <TutorialOverlay />
    </div>
  );
}