import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { gameReducer } from './gameReducer';
import { migrateSave } from './migrate';
import { recoveryRatePerSec } from '../config/balance';
import { totalGameMin } from '../engine/vitalGu';
import { ENEMY_BY_ID } from '../data/enemies';
import { persistCombatEnemyState } from '../engine/combat';
import { newCharacterId, newCreationSessionId, validDeathRecord, withSaveIdentity } from './saveIdentity';
import { changeEssence, ESSENCE_REASON } from '../engine/essence';
import { useAuth } from '@/lib/AuthContext';
import {
  cloudRecordToSave, deleteCloudSlot, listCloudSaveRecords, newerSave,
  prepareSavePayload, upsertCloudSave,
} from './cloudSaves';

const GameContext = createContext(null);
export const SLOT_COUNT = 5;
const LEGACY_KEY = 'gu_path_of_the_immortal_v1';
const legacySlotKey = (i) => `gu_slot_${i}`;
const safeScope = (scope) => String(scope || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
const slotKey = (scope, i) => `gu_user_${safeScope(scope)}_slot_${i}`;
const tombstoneKey = (scope, i) => `gu_user_${safeScope(scope)}_deleted_slot_${i}`;

function loadSlotRaw(i, scope) {
  try {
    const r = localStorage.getItem(slotKey(scope, i));
    return r ? migrateSave(withSaveIdentity(JSON.parse(r), i)) : null;
  } catch { return null; }
}

function saveSlot(i, s, scope, savedAt = Date.now()) {
  try {
    const prepared = prepareSavePayload(withSaveIdentity(s, i), i, savedAt);
    localStorage.setItem(slotKey(scope, i), JSON.stringify(prepared));
    return prepared;
  } catch (err) {
    // silent data loss is the worst failure mode a save system can have —
    // surface it so it shows in the runtime logs
    console.warn('[save] failed to write slot', i, err);
    return null;
  }
}

function devLog(...args) {
  if (typeof location !== 'undefined' && ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)) {
    console.debug('[save]', ...args);
  }
}

// One-time: adopt the old pre-slot single save file (if any) as Save Slot 1.
function adoptLegacySave(scope) {
  try {
    for (let i = 1; i <= SLOT_COUNT; i += 1) {
      const oldKey = legacySlotKey(i);
      const raw = localStorage.getItem(oldKey);
      if (raw && !loadSlotRaw(i, scope)) saveSlot(i, JSON.parse(raw), scope);
      if (raw) localStorage.removeItem(oldKey);
    }
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw && !loadSlotRaw(1, scope)) saveSlot(1, migrateSave(JSON.parse(raw)), scope);
    if (raw) localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

// After a page refresh: clear stale UI state, settle any unfinished sleep, and
// grant essence accrued while recovery was running offline (capped at max).
function normalize(raw) {
  // migrateSave is version-gated and idempotent — it must run on EVERY load so
  // saves from any older build (v7 boss-era, v8 living-Gu-era, …) pick up the
  // fields the current game expects. The old `>= 7` guard froze saves at v7.
  let s = migrateSave(raw);
  // a battle cut short by a page refresh must not heal the foe — carry the
  // combat record back onto the world before the transient state is dropped
  if (s.combat?.enemy && (s.combat.worldId || s.combat.wildGuId)) {
    s = persistCombatEnemyState(s, s.combat);
  }
  s = { ...s, toasts: [], breakthrough: null, dialogue: null, pendingEvent: null, combat: null };
  if (s.sleeping && (!s.sleeping.wakeAt || Date.now() >= s.sleeping.wakeAt)) s = { ...s, sleeping: null };
  // respawn any world enemies whose timer elapsed while away
  if (s.worldState?.enemies) {
    s = {
      ...s,
      worldState: {
        ...s.worldState,
        enemies: s.worldState.enemies.map(e =>
          e.dead && Date.now() >= (e.respawnAt || 0)
            ? { ...e, dead: false, hp: ENEMY_BY_ID[e.defId]?.hp || 30, x: e.home?.x ?? e.x, y: e.home?.y ?? e.y, state: 'idle', alertTicks: 0 }
            : e
        ),
      },
    };
  }
  if (s.recovery) {
    const rate = recoveryRatePerSec(s.player, s.recovery.mode, totalGameMin(s.time));
    const elapsed = Math.max(0, (Date.now() - (s.recovery.startedAt || Date.now())) / 1000);
    const player = changeEssence(s.player, { delta: rate * elapsed, reason: ESSENCE_REASON.OFFLINE_RECOVERY });
    const essence = player.primevalEssence;
    s = {
      ...s,
      player,
      recovery: essence >= s.player.maxPrimevalEssence ? null : { ...s.recovery, startedAt: Date.now() },
    };
  }
  return s;
}

export function GameProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const accountScope = user?.id || user?.email || 'guest';
  const [activeSlot, setActiveSlot] = useState(null);
  const [createSlot, setCreateSlot] = useState(null);
  const [creationSessionId, setCreationSessionId] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('loading');
  const [cloudError, setCloudError] = useState(null);
  const cloudRecords = useRef(new Map());
  const [state, dispatch] = useReducer(/** @type {React.Reducer<any, any>} */ (gameReducer), null, () => ({ noSave: true }));

  const readSlot = useCallback((i) => loadSlotRaw(i, accountScope), [accountScope]);

  // Reconcile this browser with the signed-in account. Newest-write wins per
  // slot; RLS ensures the server only returns records created by this user.
  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !user) {
      setCloudReady(true);
      setCloudStatus('offline');
      return () => { cancelled = true; };
    }
    setCloudReady(false);
    setCloudStatus('loading');
    setCloudError(null);
    adoptLegacySave(accountScope);
    listCloudSaveRecords().then(async records => {
      for (let i = 1; i <= SLOT_COUNT; i += 1) {
        const local = loadSlotRaw(i, accountScope);
        let record = records.get(i);
        const deletedAt = Number(localStorage.getItem(tombstoneKey(accountScope, i)) || 0);
        if (!local && record && deletedAt >= (record.clientUpdatedAt || 0)) {
          await deleteCloudSlot(i, record);
          records.delete(i);
          localStorage.removeItem(tombstoneKey(accountScope, i));
          record = null;
        }
        const winner = newerSave(local, record);
        if (!winner) continue;
        if (winner !== local) {
          saveSlot(i, cloudRecordToSave(record), accountScope, record.clientUpdatedAt || Date.now());
        } else if (!record || (local.savedAt || 0) > (record.clientUpdatedAt || 0)) {
          const uploaded = await upsertCloudSave(prepareSavePayload(local, i, local.savedAt || Date.now()), record);
          records.set(i, uploaded);
        }
      }
      if (!cancelled) {
        cloudRecords.current = new Map(records);
        setCloudStatus('synced');
        setCloudReady(true);
      }
    }).catch(error => {
      console.warn('[save] cloud sync unavailable; local saves remain active', error);
      if (!cancelled) {
        setCloudError(error?.message || 'Cloud sync is unavailable');
        setCloudStatus('offline');
        setCloudReady(true);
      }
    });
    return () => { cancelled = true; };
  }, [accountScope, isAuthenticated, user]);

  // persist the active slot on every game-state change
  useEffect(() => {
    if (activeSlot == null || !state || state.noSave) return undefined;
    const saved = saveSlot(activeSlot, state, accountScope);
    if (!saved || !isAuthenticated) return undefined;
    setCloudStatus('saving');
    const timer = setTimeout(() => {
      upsertCloudSave(saved, cloudRecords.current.get(activeSlot)).then(record => {
        cloudRecords.current.set(activeSlot, record);
        setCloudStatus('synced');
        setCloudError(null);
      }).catch(error => {
        console.warn('[save] cloud upload failed; local save preserved', error);
        setCloudError(error?.message || 'Cloud upload failed');
        setCloudStatus('offline');
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [state, activeSlot, accountScope, isAuthenticated]);

  const startSlot = useCallback((i) => {
    const raw = readSlot(i);
    if (!raw || validDeathRecord(raw)) return false;
    dispatch({ type: 'LOAD', state: normalize(raw) });
    setActiveSlot(i);
    setCreateSlot(null);
    setCreationSessionId(null);
    return true;
  }, [readSlot]);

  const beginCreate = useCallback((i) => {
    dispatch({ type: 'RESET' });
    setActiveSlot(null);
    setCreationSessionId(newCreationSessionId());
    setCreateSlot(i);
  }, []);
  const cancelCreate = useCallback(() => {
    dispatch({ type: 'RESET' });
    setCreateSlot(null);
    setCreationSessionId(null);
  }, []);
  const finishCreate = useCallback((name, gender, age, difficulty, appearance, aptitude, starterGuId) => {
    const slot = createSlot;
    if (slot == null) return false;
    const characterId = newCharacterId();
    try { localStorage.removeItem(tombstoneKey(accountScope, slot)); } catch {}
    devLog('Creating new character:', { slotId: slot, characterId });
    dispatch({ type: 'NEW_GAME', name, gender, age, difficulty, slot, appearance, aptitude, starterGuId, creationSessionId, characterId });
    setCreateSlot(null);
    setCreationSessionId(null);
    setActiveSlot(slot);
    return true;
  }, [accountScope, createSlot, creationSessionId]);

  const deleteSlot = useCallback((i) => {
    const deleted = readSlot(i);
    devLog('Deleting save:', { slotId: i, characterId: deleted?.characterId || null });
    try { localStorage.removeItem(slotKey(accountScope, i)); } catch {}
    try { localStorage.setItem(tombstoneKey(accountScope, i), String(Date.now())); } catch {}
    if (isAuthenticated) {
      deleteCloudSlot(i, cloudRecords.current.get(i)).then(() => {
        cloudRecords.current.delete(i);
        try { localStorage.removeItem(tombstoneKey(accountScope, i)); } catch {}
        setCloudStatus('synced');
      }).catch(error => {
        console.warn('[save] cloud deletion failed', error);
        setCloudError(error?.message || 'Cloud deletion failed');
        setCloudStatus('offline');
      });
    }
    if (deleted?.deceased) devLog('Clearing death state:', { characterId: deleted.characterId });
    dispatch({ type: 'RESET' });
    setActiveSlot(null);
    setCreateSlot(null);
    setCreationSessionId(null);
  }, [accountScope, isAuthenticated, readSlot]);

  const exitToSlots = useCallback(() => {
    if (activeSlot != null && state && !state.noSave) saveSlot(activeSlot, state, accountScope);
    if (state?.deceased) devLog('Clearing death state:', { characterId: state.characterId });
    dispatch({ type: 'RESET' });
    setActiveSlot(null);
    setCreateSlot(null);
    setCreationSessionId(null);
  }, [accountScope, activeSlot, state]);

  const reset = useCallback(() => {
    if (activeSlot != null) {
      try { localStorage.removeItem(slotKey(accountScope, activeSlot)); } catch {}
      if (isAuthenticated) deleteCloudSlot(activeSlot, cloudRecords.current.get(activeSlot)).catch(() => {});
    }
    setActiveSlot(null);
    setCreateSlot(null);
    setCreationSessionId(null);
    dispatch({ type: 'RESET' });
  }, [accountScope, activeSlot, isAuthenticated]);

  return (
    <GameContext.Provider value={{
      state, dispatch,
      activeSlot, createSlot, creationSessionId,
      loadSlotRaw: readSlot, startSlot,
      cloudReady, cloudStatus, cloudError,
      beginCreate, cancelCreate, finishCreate,
      deleteSlot, exitToSlots, reset,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
