// Gu life systems — hunger decay, auto-feed, starvation death, injury recovery,
// Vital-Gu instability and wild-Gu respawns. Everything time-driven ticks from
// advanceTime() (the game clock's single choke point), so hunger advances with
// every in-game minute regardless of what caused it. Fog-of-war helpers live
// here too. All tunables are in BALANCE (config/balance.js).
import { BALANCE } from '../config/balance';
import { GU_BY_ID } from '../data/gu';
import { ITEM_BY_ID } from '../data/items';
import { WORLD } from '../data/world';
import { SPECIES_BY_ID } from '../data/wildGu';
import { PATH_FOODS } from '../data/guFood';
import { totalGameMin } from './vitalGu';
import { T, locGuName, locItemName } from '../i18n/tr';

const DAY_MIN = 24 * 60;
let _tid = 0;

// Toast discipline: a keyed duplicate already on screen is never stacked (#15),
// and the stored queue stays short (#16) — the visible stack shows at most 3.
const toast = (s, t) => {
  if (t.key && (s.toasts || []).some(x => x.key === t.key)) return s;
  return { ...s, toasts: [...(s.toasts || []), { id: `gl${Date.now().toString(36)}${_tid++}`, ...t }].slice(-5) };
};
// World-log dedupe: an identical line never repeats back-to-back (#22).
const addLog = (s, msg) => {
  if (s.log[s.log.length - 1] === msg) return s;
  return { ...s, log: [...s.log, msg] };
};

// ---- hunger bands ----
export const HUNGER_BANDS = ['wellFed', 'normal', 'hungry', 'starving', 'critical'];
export const HUNGER_META = {
  wellFed: { icon: '🍖', label: 'Well Fed', tone: 'text-emerald-300', bar: 'bg-emerald-500' },
  normal: { icon: '🌾', label: 'Normal', tone: 'text-lime-300', bar: 'bg-lime-500' },
  hungry: { icon: '🍽️', label: 'Hungry', tone: 'text-amber-300', bar: 'bg-amber-500' },
  starving: { icon: '⚠️', label: 'Starving', tone: 'text-orange-400', bar: 'bg-orange-500' },
  critical: { icon: '☠️', label: 'Critical', tone: 'text-rose-400', bar: 'bg-rose-500' },
};

export function hungerBand(satiety, cfg = BALANCE.hunger) {
  const s = satiety ?? cfg.maxSatiety;
  if (s >= cfg.bands.wellFedMin) return 'wellFed';
  if (s >= cfg.bands.normalMin) return 'normal';
  if (s >= cfg.bands.hungryMin) return 'hungry';
  if (s > 0) return 'starving';
  return 'critical';
}

// ---- feeding menus ----
// A Gu's full menu derives from its path (a species-level `gu.foods` override
// wins when present): preferred staple first, acceptable substitutes after.
// The requirement is known from the moment the Gu is obtained — never a mystery.
export function foodsOf(gu) {
  const list = gu.foods || PATH_FOODS[gu.path]
    || (BALANCE.hunger.pathFoods[gu.path] ? [{ id: BALANCE.hunger.pathFoods[gu.path], satiety: 40, tier: 'preferred' }] : []);
  return list.map(f => ({ ...f, item: ITEM_BY_ID[f.id] }));
}

export function foodOf(gu) {
  const fs = foodsOf(gu);
  return (fs.find(f => f.tier === 'preferred') || fs[0])?.id || null;
}

export function foodEntryOf(gu, itemId) {
  return foodsOf(gu).find(f => f.id === itemId) || null;
}

// Quest-critical or precious fare — never consumed automatically (#7).
export function isProtectedFood(f) {
  return !!f.protected || ITEM_BY_ID[f.id]?.rarity === 'rare';
}

// Auto Feed priority (#6): cheapest acceptable fare first, the preferred
// staple only when necessary; protected/rare fare never (unless allowed).
export function pickAutoFeedFood(state, gu) {
  const allowRare = !!state.settings?.allowRareFood;
  const list = foodsOf(gu).filter(f => allowRare || !isProtectedFood(f));
  const byPriority = [...list].sort((a, b) => a.satiety - b.satiety);
  for (const f of byPriority) if (foodCount(state, f.id) > 0) return f;
  return null;
}

// One canonical Auto Feed status per Gu (#21): NOT REQUIRED (Vital), OFF,
// READY (food stocked) or MISSING FOOD — cards, toasts and panel all read this.
export function autoFeedStatus(state, inst) {
  if (isVital(state, inst)) return 'notRequired';
  if (!state.settings?.autoFeed) return 'disabled';
  return pickAutoFeedFood(state, GU_BY_ID[inst.guId]) ? 'ready' : 'missing';
}

export function requiredFoodNames(gu, max = 3) {
  return foodsOf(gu).slice(0, max).map(f => locItemName(f.item)).join(', ');
}

export function foodCount(state, itemId) {
  const it = ITEM_BY_ID[itemId];
  return it ? (state.inventory[it.category]?.[itemId] || 0) : 0;
}

export function isVital(state, inst) { return state.vitalGu === inst.instanceId; }

// Everything combat and UI need to know about a Gu's current state.
export function guCondition(state, inst) {
  const cfg = BALANCE.hunger;
  const gu = GU_BY_ID[inst.guId];
  const vital = isVital(state, inst);
  const band = vital ? 'wellFed' : hungerBand(inst.satiety);
  const pen = cfg.penalties[band] || cfg.penalties.normal;
  let effPct = pen.effPct, stability = pen.stability, costPct = pen.costPct;
  const day = state.time?.day || 1;
  const injured = (inst.injuredUntilDay || 0) > day;
  if (injured) {
    effPct += inst.injurySeverity === 'severe' ? BALANCE.guRefine.severeEffPct : BALANCE.guRefine.injuryEffPct;
    stability += BALANCE.guRefine.injuryStability;
  }
  if (vital) { effPct += BALANCE.vital.effBonusPct; stability += BALANCE.vital.stabilityBonusPct; }
  // Killer Move research strain (#12): a failed experiment leaves every
  // component tired for a few days — weaker and costlier, never destroyed
  const strained = (inst.strainUntilDay || 0) > day;
  if (strained) { effPct += BALANCE.killerMoves.strainEffPct; costPct += BALANCE.killerMoves.strainCostPct; }
  const rankBonus = 1 + (BALANCE.guRefine.rankPowerStep / 100) * Math.max(0, (inst.rank || gu.rank) - gu.rank);
  return {
    band, vital, injured, strained, severity: inst.injurySeverity || null,
    injuredUntilDay: inst.injuredUntilDay || 0,
    effPct, stability, costPct,
    effMul: Math.max(0.1, (1 + effPct / 100) * rankBonus),
  };
}

// In-game days until this Gu drops below Well Fed / into Hunger (UI estimate).
export function feedingEstimate(state, inst) {
  const cfg = BALANCE.hunger;
  if (isVital(state, inst)) return Infinity;
  const s = inst.satiety ?? cfg.maxSatiety;
  return Math.max(0, (s - cfg.bands.normalMin) / cfg.decayPerDay);
}

// The time-driven heart of the hunger system — called from advanceTime.
export function tickGuLife(state, mins) {
  if (!mins || !state.ownedGu?.length) return state;
  const cfg = BALANCE.hunger;
  const day = state.time?.day || 1;
  const frac = mins / DAY_MIN;
  const decay = cfg.decayPerDay * frac;
  const vitalId = state.vitalGu;
  const autoFeed = state.settings?.autoFeed;
  let s = state;
  let equipped = state.player.equippedGu;
  let inventory = state.inventory;
  const nextOwned = [];
  let dirty = false;
  // Hunger notifications are EVENT-based (#12): collected during the tick and
  // emitted once after it — one toast per band TRANSITION, a combined summary
  // when several Gu worsen in the same tick (#17), never one per update.
  const nowAbs = totalGameMin(state.time);
  const reminderMin = cfg.reminderMin ?? 360;
  const autoWarnMin = cfg.autofeedWarnMin ?? 360;
  const hungerEvents = [];
  const autoFeedFails = [];

  for (const inst of s.ownedGu) {
    let g = { ...inst };
    let touched = false;

    // injuries heal with time
    if (g.injuredUntilDay && day >= g.injuredUntilDay) {
      g.injuredUntilDay = 0; g.injurySeverity = null;
      s = toast(s, { icon: '🩹', title: T('toast.guRecovered'), lines: [T('gl.mended', { gu: locGuName(GU_BY_ID[g.guId]) })] });
      s = addLog(s, T('gl.mendedLog', { gu: locGuName(GU_BY_ID[g.guId]) }));
      touched = true;
    }

    if (vitalId !== g.instanceId) {
      if (g.satiety == null) { g.satiety = cfg.maxSatiety; touched = true; }
      else {
        const prevBand = hungerBand(g.satiety);
        g.satiety = Math.max(0, g.satiety - decay);
        const band = hungerBand(g.satiety);
        if (Math.abs(g.satiety - inst.satiety) > 1e-9) touched = true;

        // Notification state lives on the Gu record and persists with the
        // save (#21): the band last notified + when. A missing record (fresh
        // save, page refresh) baselines SILENTLY — no re-alert on load.
        if (!g.hungerNote || !g.hungerNote.band) { g.hungerNote = { band: prevBand, min: nowAbs }; touched = true; }
        const note = g.hungerNote;
        const worsened = HUNGER_BANDS.indexOf(band) > HUNGER_BANDS.indexOf(note.band);
        // the death clock starts the moment critical is reached — whether or
        // not a toast fired for it
        if (band === 'critical' && g.criticalSinceDay == null) { g.criticalSinceDay = day; touched = true; }
        // an urgent state may REMIND, but only after a real cooldown in game
        // minutes (#14) — never every update tick
        const dueReminder = (band === 'starving' || band === 'critical')
          && nowAbs - (note.min || 0) >= reminderMin;
        if (worsened || dueReminder) {
          g.hungerNote = { band, min: nowAbs };
          touched = true;
          hungerEvents.push({ inst: g, band, reminder: !worsened });
        }

        // starvation death — only after days at critical hunger, loudly
        if (g.satiety <= 0 && g.criticalSinceDay != null && (day - g.criticalSinceDay) >= cfg.criticalDaysToDeath) {
          const gu = GU_BY_ID[g.guId];
          s = toast(s, { icon: '☠', title: T('toast.guLost'), lines: [T('gl.lostLine', { gu: locGuName(gu) }), T('gl.lostLine2')] });
          s = addLog(s, T('gl.lostLog', { gu: locGuName(gu) }));
          equipped = equipped.filter(id => id !== g.instanceId);
          dirty = true;
          continue; // removed from the collection
        }

        // auto feed: consumes real food from the pack, never conjures it —
        // cheapest fare first (#6), never protected fare (#7), and a loud,
        // once-per-day failure notice when no valid food exists (#3)
        if (autoFeed && g.satiety < cfg.autoFeedThreshold) {
          const pick = pickAutoFeedFood(s, GU_BY_ID[g.guId]);
          if (pick) {
            const it = ITEM_BY_ID[pick.id];
            const have = foodCount(s, pick.id);
            const cat = { ...inventory[it.category], [pick.id]: have - 1 };
            if (cat[pick.id] <= 0) delete cat[pick.id];
            inventory = { ...inventory, [it.category]: cat };
            const from = Math.round(g.satiety);
            g.satiety = Math.min(cfg.maxSatiety, g.satiety + pick.satiety);
            g.criticalSinceDay = null; g.warnDay = null; g.hungerNote = null; g.autoFeedWarnMin = 0;
            s = addLog(s, T('feed.autoFedLog', { gu: locGuName(GU_BY_ID[g.guId]), item: locItemName(it), from, to: Math.round(g.satiety) }));
            touched = true;
          } else if (nowAbs - (g.autoFeedWarnMin || 0) >= autoWarnMin) {
            // a real cooldown in game minutes (#20): the failure is said once,
            // then rests — the Gu panel keeps a persistent MISSING FOOD chip
            g.autoFeedWarnMin = nowAbs;
            autoFeedFails.push(g);
            touched = true;
          }
        }
      }
    }
    nextOwned.push(touched ? g : inst);
    if (touched) dirty = true;
  }

  // ---- emit the tick's hunger notifications (once, event-based) ----
  const alive = new Set(nextOwned.map(g => g.instanceId));
  const evs = hungerEvents.filter(e => alive.has(e.inst.instanceId));
  if (evs.length === 1) {
    const ev = evs[0];
    const gu = GU_BY_ID[ev.inst.guId];
    if (ev.band === 'critical' && !ev.reminder) {
      s = toast(s, { key: `hunger:${ev.inst.instanceId}:critical`, icon: '☠️', title: T('toast.criticalHunger'), lines: [T('gl.starving', { gu: locGuName(gu) }), T('gl.starving2')] });
      s = addLog(s, T('gl.starvingLog', { gu: locGuName(gu) }));
    } else {
      const noFood = autoFeed && !pickAutoFeedFood(s, gu);
      s = toast(s, {
        key: `hunger:${ev.inst.instanceId}:${ev.band}${ev.reminder ? ':rem' : ''}`,
        icon: HUNGER_META[ev.band].icon, title: T('toast.guHunger'),
        lines: [
          ev.reminder
            ? T('gl.stillLine', { gu: locGuName(gu), band: T(`hun.${ev.band}`) })
            : T('gl.hungerLine', { gu: locGuName(gu), band: T(`hun.${ev.band}`) }),
          ...(ev.band === 'critical' ? [T('gl.starving2')] : []),
          ...(noFood ? [T('feed.noValidFood')] : []),
        ],
      });
      if (ev.reminder) s = addLog(s, T('gl.stillLine', { gu: locGuName(gu), band: T(`hun.${ev.band}`) }));
    }
  } else if (evs.length > 1) {
    // several Gu worsened in the same tick — one compact summary, never a
    // wall of near-identical cards (#17)
    const entries = evs.map(e => T('feed.summaryEntry', { gu: locGuName(GU_BY_ID[e.inst.guId]), band: T(`hun.${e.band}`) }));
    s = toast(s, {
      key: 'feed:summary', icon: '⚠️', title: T('toast.guHunger'),
      lines: [T('feed.summaryLine', { n: evs.length }), ...entries.slice(0, 4)],
    });
    s = addLog(s, [T('feed.summaryLine', { n: evs.length }), ...entries].join(' · '));
  }
  for (const g of autoFeedFails) {
    // never stacked on top of a hunger alert for the same Gu in the same tick (#20)
    if (evs.some(e => e.inst.instanceId === g.instanceId) || !alive.has(g.instanceId)) continue;
    const gu = GU_BY_ID[g.guId];
    s = toast(s, {
      key: `autofeed:${g.instanceId}`, icon: '⚠️', title: T('feed.autoFailedTitle'),
      lines: [
        T('gl.hungerLine', { gu: locGuName(gu), band: T(`hun.${hungerBand(g.satiety)}`) }),
        T('feed.autoFailedReason'),
        T('feed.required', { list: requiredFoodNames(gu) }),
      ],
    });
    s = addLog(s, T('feed.autoFailedLog', { gu: locGuName(gu), list: requiredFoodNames(gu) }));
  }

  // Vital-Gu instability is an explicit record with a cause and an end time —
  // it expires on its own and can never be triggered by hunger or cultivation.
  const vInst = s.player.vitalInstability;
  if (vInst && totalGameMin(s.time) >= vInst.endMin) {
    s = { ...s, player: { ...s.player, vitalInstability: null } };
    s = toast(s, { icon: '🩸', title: T('toast.apertureStable'), lines: [T('gl.apertureLine')] });
    s = addLog(s, T('gl.apertureLog'));
    dirty = true;
  }

  if (dirty) s = { ...s, ownedGu: nextOwned, inventory, player: { ...s.player, equippedGu: equipped } };

  // wild Gu return to their haunts
  const ws = s.worldState;
  if (ws?.wildGu?.length) {
    const now = Date.now();
    let changed = false;
    const wildGu = ws.wildGu.map(w => {
      if (w.gone && w.respawnAt && now >= w.respawnAt) {
        changed = true;
        return { ...w, gone: false, respawnAt: 0, hp: SPECIES_BY_ID[w.speciesId].hp, x: w.home.x, y: w.home.y };
      }
      return w;
    });
    if (changed) s = { ...s, worldState: { ...ws, wildGu } };
  }
  return s;
}

// ---- fog of war ----
export function seedFog(x, y, r) {
  const keys = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > (r + 0.5) * (r + 0.5)) continue; // soft circle
    const tx = x + dx, ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= WORLD.w || ty >= WORLD.h) continue;
    keys.push(`${tx},${ty}`);
  }
  return keys;
}

export function revealFog(state, x, y, r = BALANCE.fog.revealRadius) {
  const ws = state.worldState;
  const have = new Set(ws.fog || []);
  const add = seedFog(x, y, r).filter(k => !have.has(k));
  if (!add.length) return state;
  return { ...state, worldState: { ...ws, fog: [...(ws.fog || []), ...add] } };
}