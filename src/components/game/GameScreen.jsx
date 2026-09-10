import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE } from '@/game/config/balance';
import WorldView from './WorldView';
import HUDTop from './hud/HUDTop';
import Hotbar from './hud/Hotbar';
import MessageLog from './hud/MessageLog';
import PauseMenu from './hud/PauseMenu';
import OverlayWindow from './hud/OverlayWindow';
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

const PANEL_META = {
  cultivation: { title: 'Cultivation', icon: '🧘' },
  gu: { title: 'Gu', icon: '🐉' },
  recipes: { title: 'Recipes', icon: '📖' },
  dao: { title: 'Dao Mastery', icon: '☯️' },
  inventory: { title: 'Inventory', icon: '🎒' },
  quests: { title: 'Quests', icon: '📜' },
  map: { title: 'Region Map', icon: '🧭', wide: true },
};

export default function GameScreen() {
  const { state, dispatch, activeSlot, exitToSlots, deleteSlot } = useGame();
  const [panel, setPanel] = useState(null);
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [inn, setInn] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  // real-time heartbeat of the accelerated game clock (1s = 1 in-game minute).
  // Paused while sleeping or while the system menu is open.
  useEffect(() => {
    if (state.sleeping || state.deceased || paused) return;
    const t = setInterval(() => dispatch({ type: 'TIME_TICK' }), BALANCE.time.tickMs);
    return () => clearInterval(t);
  }, [state.sleeping, state.deceased, paused, dispatch]);

  // essence recovery started → surface the cultivation panel
  useEffect(() => { if (state.recovery) setPanel('cultivation'); }, [state.recovery?.startedAt]);

  // game-style Esc behavior: close the topmost overlay; if nothing is open, open the system menu.
  const escRef = useRef({});
  escRef.current = {
    panel, paused, shop, service, inn, recoveryOpen,
    busy: !!(state.combat || state.pendingEvent || state.dialogue || state.sleeping || state.deceased || state.breakthrough),
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const s = escRef.current;
      if (s.panel) setPanel(null);
      else if (s.shop) setShop(null);
      else if (s.service) setService(null);
      else if (s.inn) setInn(null);
      else if (s.recoveryOpen) setRecoveryOpen(false);
      else if (s.paused) setPaused(false);
      else if (!s.busy) setPaused(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const inputLocked = !!panel || paused;
  const meta = panel ? PANEL_META[panel] : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0d1410] text-stone-100 select-none">
      {/* background layer — the world fills the whole viewport */}
      <WorldView paused={paused} inputLocked={inputLocked} />

      {/* HUD overlays */}
      <HUDTop />
      <MessageLog />
      <Hotbar active={panel} onSelect={setPanel} onPause={() => setPaused(true)} />

      {/* in-game panel overlays (world stays visible underneath) */}
      {panel && (
        <OverlayWindow title={meta.title} icon={meta.icon} wide={meta.wide} onClose={() => setPanel(null)}>
          {panel === 'cultivation' && <CharacterPanel onRecover={() => setRecoveryOpen(true)} />}
          {panel === 'gu' && <GuPanel />}
          {panel === 'recipes' && <RecipesPanel />}
          {panel === 'dao' && <DaoMasteryPanel />}
          {panel === 'inventory' && <InventoryPanel />}
          {panel === 'quests' && <QuestsPanel />}
          {panel === 'map' && <MapPanel />}
        </OverlayWindow>
      )}

      {/* dialogue / encounter overlays — layered over the world */}
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

      {/* system menu overlay */}
      <PauseMenu open={paused} onClose={() => setPaused(false)} onOpenPanel={(id) => { setPaused(false); setPanel(id); }} />

      <Toasts />
      <TutorialOverlay />
    </div>
  );
}