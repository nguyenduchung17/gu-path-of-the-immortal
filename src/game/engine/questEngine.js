// The ONE source of truth for quest state. Every consumer — NPC dialogue, the
// Quest tab, the HUD tracker, save/load and objective updates — reads and
// writes quest records through this module. Quest progress lives in
// persistent per-quest records (state.quests.byId), never in component state.
import { QUEST_BY_ID } from '../data/quests';
import { ITEM_BY_ID } from '../data/items';
import { NPC_BY_ID } from '../data/npcs';
import { ENEMY_BY_ID } from '../data/enemies';
import { ZONES } from '../data/world';

export const TRACK_LIMIT = 3;
export const QS = {
  LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', ACTIVE: 'ACTIVE',
  TURN_IN_READY: 'TURN_IN_READY', COMPLETED: 'COMPLETED', FAILED: 'FAILED', TURNED_IN: 'TURNED_IN',
};

export function emptyQuests() {
  return { byId: {}, order: [], discovered: [], tracked: [], flags: {}, kills: {} };
}

const zoneName = (id) => (ZONES.find(z => z.id === id) || {}).name || id;

// Multi-objective quests use an `objectives` array; legacy quests keep their
// single `objective` — both normalize to the same shape.
export function objectivesOf(q) {
  if (q.objectives) return q.objectives.map((o, i) => ({ id: o.id || `o${i}`, ...o }));
  if (q.objective) return [{ id: 'o0', ...q.objective }];
  return [];
}

export function objectiveLabel(o) {
  if (o.label) return o.label;
  if (o.type === 'hunt' || o.type === 'defeat') return `Kill ${ENEMY_BY_ID[o.enemy]?.name || o.enemy}`;
  if (o.type === 'gather') return `Collect ${ITEM_BY_ID[o.item]?.name || o.item}`;
  if (o.type === 'reach') return `Reach ${zoneName(o.area)}`;
  if (o.type === 'talk') return `Talk to ${NPC_BY_ID[o.npc]?.name || o.npc}`;
  if (o.type === 'capture') return `Capture a wild ${o.guId}`;
  if (o.type === 'refine') return `Refine ${o.guId}`;
  return 'Objective';
}

// Objective progress semantics (never mixed):
//   hunt/defeat/reach/talk/capture/refine — counters/flags advanced by quest events
//   gather countMode 'owned' (default)     — what you carry right now; handed over on turn-in
//   gather countMode 'total'               — everything gathered/looted since acceptance; never consumed
export function objectiveProgress(state, q, o, rec) {
  const prog = rec?.progress || {};
  if (o.type === 'gather' && o.countMode !== 'total') {
    const cat = ITEM_BY_ID[o.item]?.category;
    return Math.min(o.qty, state.inventory?.[cat]?.[o.item] || 0);
  }
  if (o.type === 'reach') return state.worldState?.discovered?.zones?.[o.area] ? (o.qty || 1) : 0;
  return Math.min(o.qty || 1, prog[o.id] || 0);
}

export function questView(state, q) {
  const rec = state.quests?.byId?.[q.id];
  return objectivesOf(q).map(o => {
    const cur = objectiveProgress(state, q, o, rec);
    const req = o.qty || 1;
    const hidden = !!o.hidden && !rec?.revealed?.[o.id] && cur <= 0;
    return { id: o.id, type: o.type, label: hidden ? '???' : objectiveLabel(o), cur, req, done: cur >= req };
  });
}

// Derived status: an ACTIVE quest whose objectives are all met reads as
// TURN_IN_READY (or auto-COMPLETED) everywhere, whatever path completed them.
export function questStatusOf(state, q) {
  const rec = state.quests?.byId?.[q.id];
  if (!rec) return q.requires?.flag && !state.quests?.flags?.[q.requires.flag] ? QS.LOCKED : QS.AVAILABLE;
  if (rec.status === QS.ACTIVE && questView(state, q).every(o => o.done)) return q.auto ? QS.COMPLETED : QS.TURN_IN_READY;
  return rec.status;
}

export function questDone(state, id) {
  const st = state.quests?.byId?.[id]?.status;
  return st === QS.TURNED_IN || st === QS.COMPLETED;
}

export function markDiscovered(state, questId) {
  const quests = state.quests || emptyQuests();
  if ((quests.discovered || []).includes(questId)) return state;
  return { ...state, quests: { ...quests, discovered: [...(quests.discovered || []), questId] } };
}

export function acceptQuest(state, questId) {
  const q = QUEST_BY_ID[questId];
  const quests = state.quests || emptyQuests();
  const existing = quests.byId?.[questId];
  if (!q || (existing && existing.status !== QS.AVAILABLE)) return { state };
  const tracked = [...(quests.tracked || [])];
  const autoTracked = tracked.length === 0; // auto-track only when nothing is tracked yet
  if (autoTracked) tracked.push(questId);
  const byId = { ...quests.byId, [questId]: { status: QS.ACTIVE, progress: {}, revealed: {}, acceptedDay: state.time?.day || 1 } };
  return {
    state: { ...state, quests: { ...quests, byId, order: [...(quests.order || []), questId], discovered: [...new Set([...(quests.discovered || []), questId])], tracked } },
    autoTracked,
  };
}

const MATCHERS = {
  ENEMY_KILLED: (o, ev) => (o.type === 'hunt' || o.type === 'defeat') && o.enemy === ev.id,
  ITEM_COLLECTED: (o, ev) => o.type === 'gather' && o.countMode === 'total' && o.item === ev.id,
  LOCATION_DISCOVERED: (o, ev) => o.type === 'reach' && o.area === ev.id,
  NPC_TALKED: (o, ev) => o.type === 'talk' && o.npc === ev.id,
  GU_CAPTURED: (o, ev) => o.type === 'capture' && o.guId === ev.id,
  GU_REFINED: (o, ev) => o.type === 'refine' && o.guId === ev.id,
  ARENA_WON: () => false, // reserved — no objective type consumes it yet
};

// The centralized quest event system: one call advances every matching ACTIVE
// objective, flips completed quests to TURN_IN_READY (or auto-COMPLETED), and
// reports what changed so the UI can celebrate it. Flees, escapes and failed
// refinements never fire events, so they never count.
export function applyQuestEvent(state, event) {
  const quests = state.quests || emptyQuests();
  const match = MATCHERS[event.type];
  const updates = [], ready = [], autoCompleted = [];
  if (!match) return { state, updates, ready, autoCompleted };
  const byId = { ...quests.byId };
  let changed = false;
  for (const qid of quests.order || []) {
    const q = QUEST_BY_ID[qid];
    const rec = byId[qid];
    if (!q || !rec || rec.status !== QS.ACTIVE) continue;
    const progress = { ...rec.progress };
    const revealed = { ...(rec.revealed || {}) };
    let touched = false;
    for (const o of objectivesOf(q)) {
      if (!match(o, event)) continue;
      const before = progress[o.id] || 0;
      const after = Math.min(o.qty || 1, before + (event.qty || 1));
      if (after !== before) {
        progress[o.id] = after;
        if (o.hidden) revealed[o.id] = true;
        updates.push({ questId: qid, label: objectiveLabel(o), delta: after - before });
        touched = true;
      }
    }
    if (!touched) continue;
    const complete = objectivesOf(q).every(o => objectiveProgress(state, q, o, { ...rec, progress }) >= (o.qty || 1));
    byId[qid] = { ...rec, progress, revealed, status: complete ? (q.auto ? QS.COMPLETED : QS.TURN_IN_READY) : QS.ACTIVE };
    if (complete) (q.auto ? autoCompleted : ready).push(qid);
    changed = true;
  }
  if (!changed) return { state, updates, ready, autoCompleted };
  return { state: { ...state, quests: { ...quests, byId } }, updates, ready, autoCompleted };
}

export function turnInQuest(state, questId) {
  const q = QUEST_BY_ID[questId];
  const rec = state.quests?.byId?.[questId];
  if (!q || !rec || questStatusOf(state, q) !== QS.TURN_IN_READY) return { state };
  const removeItems = {};
  for (const o of objectivesOf(q)) {
    // 'owned' gathers are handed over; 'total' collections were never taken from the bag
    if (o.type === 'gather' && o.countMode !== 'total') removeItems[o.item] = o.qty;
  }
  const quests = state.quests;
  const byId = { ...quests.byId, [questId]: { ...rec, status: QS.TURNED_IN } };
  return {
    state: { ...state, quests: { ...quests, byId, order: (quests.order || []).filter(id => id !== questId), tracked: (quests.tracked || []).filter(id => id !== questId) } },
    removeItems,
  };
}

export function toggleTrack(state, questId) {
  const q = QUEST_BY_ID[questId];
  const quests = state.quests || emptyQuests();
  if (!q || !quests.byId?.[questId]) return state;
  const st = questStatusOf(state, q);
  if (st !== QS.ACTIVE && st !== QS.TURN_IN_READY) return state;
  const tracked = [...(quests.tracked || [])];
  const idx = tracked.indexOf(questId);
  if (idx >= 0) tracked.splice(idx, 1);
  else { tracked.push(questId); if (tracked.length > TRACK_LIMIT) tracked.shift(); } // over the limit: replace the oldest
  return { ...state, quests: { ...quests, tracked } };
}

export function abandonQuest(state, questId) {
  const quests = state.quests || emptyQuests();
  const rec = quests.byId?.[questId];
  if (!rec) return state;
  const byId = { ...quests.byId, [questId]: { ...rec, status: QS.AVAILABLE, progress: {}, revealed: {} } };
  return { ...state, quests: { ...quests, byId, order: (quests.order || []).filter(id => id !== questId), tracked: (quests.tracked || []).filter(id => id !== questId) } };
}

// Self-healing loader: legacy v10 shapes (active/completed arrays) become
// per-quest records; hunt progress is rebuilt from the kill tally.
export function normalizeQuestState(state) {
  const q = state.quests || {};
  const isLegacy = !q.byId;
  const byId = { ...(q.byId || {}) };
  const order = [...(q.order || [])];
  for (const id of q.active || []) if (!byId[id]) { byId[id] = { status: QS.ACTIVE, progress: {}, revealed: {}, acceptedDay: 1 }; order.push(id); }
  for (const id of q.completed || []) if (!byId[id]) byId[id] = { status: QS.TURNED_IN, progress: {}, revealed: {}, acceptedDay: 1 };
  for (const [qid, rec] of Object.entries(byId)) {
    const def = QUEST_BY_ID[qid];
    if (!def) { delete byId[qid]; continue; }
    const progress = { ...(rec.progress || {}) };
    for (const o of objectivesOf(def)) {
      if ((o.type === 'hunt' || o.type === 'defeat') && progress[o.id] == null) progress[o.id] = Math.min(o.qty, q.kills?.[o.enemy] || 0);
    }
    byId[qid] = { status: rec.status || QS.ACTIVE, progress, revealed: rec.revealed || {}, acceptedDay: rec.acceptedDay || 1 };
  }
  const orderFix = [...new Set(order)].filter(id => byId[id] && (byId[id].status === QS.ACTIVE || byId[id].status === QS.TURN_IN_READY));
  let tracked = (q.tracked || []).filter(id => orderFix.includes(id)).slice(0, TRACK_LIMIT);
  if (isLegacy && tracked.length === 0 && orderFix.length) tracked = [orderFix[orderFix.length - 1]];
  const discovered = [...new Set([...(q.discovered || []), ...Object.keys(byId)])].filter(id => QUEST_BY_ID[id]);
  return { ...state, quests: { byId, order: orderFix, discovered, tracked, flags: q.flags || {}, kills: q.kills || {} } };
}