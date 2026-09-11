import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/game/state/GameContext';
import { BALANCE } from '@/game/config/balance';
import { useT } from '@/game/i18n/LangContext';
import { tutorialStepMet, dueTip } from '@/game/engine/tutorial';
import WorldView from './WorldView';
import HUDTop from './hud/HUDTop';
import Hotbar from './hud/Hotbar';
import MessageLog from './hud/MessageLog';
import PauseMenu from './hud/PauseMenu';
import OverlayWindow from './hud/OverlayWindow';
import CharacterPanel from './CharacterPanel';
import GuPanel from './GuPanel';
import KillerMovesPanel from './KillerMovesPanel';
import { kmCanResearch } from '@/game/engine/killerMoves';
import { hungerBand } from '@/game/engine/guLife';
import RecipesPanel from './RecipesPanel';
import DaoMasteryPanel from './DaoMasteryPanel';
import InventoryPanel from './InventoryPanel';
import QuestsPanel from './QuestsPanel';
import MapPanel from './MapPanel';
import BestiaryPanel from './BestiaryPanel';
import CombatView from './CombatView';
import EventModal from './EventModal';
import WildGuEncounterModal from './WildGuEncounterModal';
import DialogueModal from './DialogueModal';
import ShopPanel from './ShopPanel';
import MissionBoard from './MissionBoard';
import ContributionShopPanel from './ContributionShopPanel';
import ArenaPanel from './ArenaPanel';
import TutorialOverlay from './TutorialOverlay';
import HelpCodexPanel from './HelpCodexPanel';
import RecoveryModal from './RecoveryModal';
import BreakthroughOverlay from './BreakthroughOverlay';
import InnModal from './InnModal';
import SleepOverlay from './SleepOverlay';
import MemorialPanel from './MemorialPanel';
import Toasts from './Toasts';
import QuestTracker from './hud/QuestTracker';
import ExploreBar from './hud/ExploreBar';
import ScoutReport from './hud/ScoutReport';
import HazardBadge from './hud/HazardBadge';
import MiniMap from './hud/MiniMap';
import DashboardScreen from './DashboardScreen';
import { validDeathRecord } from '@/game/state/saveIdentity';

const PANEL_META = {
  cultivation: { titleKey: 'ui.cultivation', icon: '🧘' },
  gu: { titleKey: 'ui.gu', icon: '🐉' },
  km: { titleKey: 'ui.km', icon: '⚡' },
  recipes: { titleKey: 'ui.recipes', icon: '📖' },
  dao: { titleKey: 'ui.dao', icon: '☯️' },
  inventory: { titleKey: 'ui.inventory', icon: '🎒' },
  quests: { titleKey: 'ui.quests', icon: '📜' },
  map: { titleKey: 'ui.map', icon: '🧭', wide: true },
  bestiary: { titleKey: 'ui.bestiary', icon: '🐾' },
  help: { titleKey: 'codex.title', icon: '❓' },
};

export default function GameScreen() {
  const { state, dispatch, activeSlot, exitToSlots, deleteSlot, loadSlotRaw } = useGame();
  const { t } = useT();
  const [panel, setPanel] = useState(null);
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [inn, setInn] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const storedActive = activeSlot == null ? null : loadSlotRaw(activeSlot);
  const deathRecord = validDeathRecord(state) && storedActive?.characterId === state.characterId
    ? state.deceased
    : null;

  useEffect(() => {
    if (!deathRecord) return;
    if (typeof location !== 'undefined' && ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)) {
      console.debug('[save] Loading death screen:', { characterId: state.characterId });
    }
  }, [deathRecord, state.characterId]);

  // open a side panel — the staged tutorial hears which panel opened
  const openPanel = (id) => {
    setPanel(id);
    if (state.tutorial?.active && !state.tutorial.completed) dispatch({ type: 'TUTORIAL_PANEL', panel: id });
  };

  // real-time heartbeat of the accelerated game clock (1s = 1 in-game minute).
  // Paused while sleeping or while the system menu is open.
  useEffect(() => {
    if (state.sleeping || state.deceased || paused || dashOpen || state.tutorial?.welcome) return;
    const t = setInterval(() => dispatch({ type: 'TIME_TICK' }), BALANCE.time.tickMs);
    return () => clearInterval(t);
  }, [state.sleeping, state.deceased, paused, dashOpen, dispatch]);

  // essence recovery started → surface the cultivation panel
  useEffect(() => { if (state.recovery) setPanel('cultivation'); }, [state.recovery?.startedAt]);

  // tutorial: advance guided lessons whose trigger is met; surface contextual tips
  useEffect(() => {
    if (tutorialStepMet(state)) dispatch({ type: 'TUTORIAL_STEP' });
    if (!state.tutorial?.currentTip) {
      const tip = dueTip(state);
      if (tip) dispatch({ type: 'TUTORIAL_TIP', id: tip.id });
    }
  }, [state]);

  // game-style Esc behavior: close the topmost overlay; if nothing is open, open the system menu.
  const escRef = useRef(/** @type {any} */ ({}));
  escRef.current = {
    panel, paused, shop, service, inn, recoveryOpen, dashOpen, openPanel,
    busy: !!(state.combat || state.pendingEvent || state.dialogue || state.sleeping || state.deceased || state.breakthrough || state.wildEncounter),
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const s = escRef.current;
        if (s.dashOpen) setDashOpen(false);
        else if (s.panel) setPanel(null);
        else if (s.shop) setShop(null);
        else if (s.service) setService(null);
        else if (s.inn) setInn(null);
        else if (s.recoveryOpen) setRecoveryOpen(false);
        else if (s.paused) setPaused(false);
        else if (!s.busy) setPaused(true);
        return;
      }
      // hotbar hotkeys (C/G/R/M/I/Q/P) match the hotbar tooltips
      const HOTKEYS = { c: 'cultivation', g: 'gu', k: 'km', r: 'recipes', m: 'dao', i: 'inventory', q: 'quests', p: 'map', b: 'bestiary' };
      const id = HOTKEYS[e.key.toLowerCase()];
      if (!id || e.repeat) return;
      const s = escRef.current;
      if (s.busy) return;
      s.openPanel(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The tutorial welcome card gates interaction (E, HUD surfaces) but NOT world
  // movement — the game's first lesson says "move", so a fresh cultivator
  // pressing WASD must walk. Answering the card is still required to interact.
  const uiLocked = !!panel || paused || dashOpen || !!state.tutorial?.welcome;
  const moveLocked = !!panel || paused || dashOpen;
  const meta = panel ? PANEL_META[panel] : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0d1410] text-stone-100 select-none">
      {/* background layer — the world fills the whole viewport */}
      <WorldView paused={paused} inputLocked={uiLocked} moveLocked={moveLocked} />

      {/* HUD overlays */}
      <HUDTop />
      <MessageLog />
      {!uiLocked && <ExploreBar />}
      <ScoutReport />
      <HazardBadge />
      <MiniMap />
      {/* persistent urgent-state warning without toast spam (#23): a dot on the
          Gu button while any companion is starving or critically hungry */}
      <Hotbar active={panel} notify={[
        ...(kmCanResearch(state) && !state.tutorial?.active ? ['km'] : []),
        ...((state.ownedGu || []).some(g => g.instanceId !== state.vitalGu
          && ['starving', 'critical'].includes(hungerBand(g.satiety))) ? ['gu'] : []),
      ]} onSelect={(id) => (id === 'dashboard' ? setDashOpen(true) : openPanel(id))} onPause={() => setPaused(true)} />

      {/* in-game panel overlays (world stays visible underneath) */}
      {panel && (
        <OverlayWindow title={t(meta.titleKey)} icon={meta.icon} wide={meta.wide} onClose={() => setPanel(null)}>
          {panel === 'cultivation' && <CharacterPanel onRecover={() => setRecoveryOpen(true)} />}
          {panel === 'gu' && <GuPanel />}
          {panel === 'km' && <KillerMovesPanel />}
          {panel === 'recipes' && <RecipesPanel />}
          {panel === 'dao' && <DaoMasteryPanel />}
          {panel === 'inventory' && <InventoryPanel />}
          {panel === 'quests' && <QuestsPanel />}
          {panel === 'map' && <MapPanel />}
          {panel === 'bestiary' && <BestiaryPanel />}
          {panel === 'help' && <HelpCodexPanel />}
        </OverlayWindow>
      )}

      {/* dialogue / encounter overlays — layered over the world */}
      {state.combat && <CombatView />}
      {state.pendingEvent && <EventModal />}
      {state.wildEncounter && <WildGuEncounterModal />}
      {state.dialogue && <DialogueModal onShop={setShop} onService={setService} onInn={setInn} />}
      {shop && <ShopPanel npcId={shop} onClose={() => setShop(null)} />}
      {service === 'missions' && <MissionBoard onClose={() => setService(null)} />}
      {service === 'contribution' && <ContributionShopPanel onClose={() => setService(null)} />}
      {service === 'arena' && <ArenaPanel onClose={() => setService(null)} />}
      {inn && <InnModal npcId={inn} onClose={() => setInn(null)} />}
      {state.sleeping && <SleepOverlay />}
      {deathRecord && (
        <MemorialPanel
          record={deathRecord}
          onCloseLabel="Return to Save Slots"
          onClose={exitToSlots}
          onDeleteLabel="Delete Save"
          onDelete={() => deleteSlot(activeSlot)}
        />
      )}
      <RecoveryModal open={recoveryOpen} onClose={() => setRecoveryOpen(false)} />
      <BreakthroughOverlay />

      {/* growth dashboard — dedicated full-screen view */}
      {dashOpen && <DashboardScreen onClose={() => setDashOpen(false)} />}

      {/* system menu overlay */}
      <PauseMenu open={paused} onClose={() => setPaused(false)} onOpenPanel={(id) => { setPaused(false); openPanel(id); }} />

      <Toasts />
      <QuestTracker />
      <TutorialOverlay />
    </div>
  );
}
