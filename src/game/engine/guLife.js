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
import { totalGameMin } from './vitalGu';

const DAY_MIN = 24 * 60;
let _tid = 0;

const toast = (s, t) => ({ ...s, toasts: [...(s.toasts || []), { id: `gl${Date.now().toString(36)}${_tid++}`, ...t }] });
const addLog = (s, msg) => ({ ...s, log: [...s.log, msg] });

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

export function foodOf(gu) { return BALANCE.hunger.pathFoods[gu.path] || null; }

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
  const rankBonus = 1 + (BALANCE.guRefine.rankPowerStep / 100) * Math.max(0, (inst.rank || gu.rank) - gu.rank);
  return {
    band, vital, injured, severity: inst.injurySeverity || null,
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

  for (const inst of s.ownedGu) {
    let g = { ...inst };
    let touched = false;

    // injuries heal with time
    if (g.injuredUntilDay && day >= g.injuredUntilDay) {
      g.injuredUntilDay = 0; g.injurySeverity = null;
      s = toast(s, { icon: '🩹', title: 'GU RECOVERED', lines: [`${GU_BY_ID[g.guId].name} has mended — full power returns.`] });
      s = addLog(s, `${GU_BY_ID[g.guId].name} recovers from its injuries.`);
      touched = true;
    }

    if (vitalId !== g.instanceId) {
      if (g.satiety == null) { g.satiety = cfg.maxSatiety; touched = true; }
      else {
        const prevBand = hungerBand(g.satiety);
        g.satiety = Math.max(0, g.satiety - decay);
        const band = hungerBand(g.satiety);
        if (Math.abs(g.satiety - inst.satiety) > 1e-9) touched = true;

        // warnings — once per day, never silent when it matters
        if (band !== prevBand && HUNGER_BANDS.indexOf(band) > HUNGER_BANDS.indexOf(prevBand) && g.warnDay !== day) {
          g.warnDay = day;
          const gu = GU_BY_ID[g.guId];
          if (band === 'critical') {
            g.criticalSinceDay = g.criticalSinceDay ?? day;
            s = toast(s, { icon: '☠️', title: 'CRITICAL HUNGER', lines: [`${gu.name} is starving.`, 'If not fed soon, it may die.'] });
            s = addLog(s, `WARNING: ${gu.name} is starving — feed it soon or it may die.`);
          } else {
            s = toast(s, { icon: HUNGER_META[band].icon, title: 'GU HUNGER', lines: [`${gu.name} is ${HUNGER_META[band].label.toLowerCase()}.`] });
          }
        }

        // starvation death — only after days at critical hunger, loudly
        if (g.satiety <= 0 && g.criticalSinceDay != null && (day - g.criticalSinceDay) >= cfg.criticalDaysToDeath) {
          const gu = GU_BY_ID[g.guId];
          s = toast(s, { icon: '☠', title: 'GU LOST', lines: [`${gu.name} succumbed to starvation.`, 'It can no longer be used.'] });
          s = addLog(s, `${gu.name} starves and dies — keep your companions fed.`);
          equipped = equipped.filter(id => id !== g.instanceId);
          dirty = true;
          continue; // removed from the collection
        }

        // auto feed: consumes real food from the pack, never conjures it
        if (autoFeed && g.satiety < cfg.autoFeedThreshold) {
          const food = foodOf(GU_BY_ID[g.guId]);
          const have = food ? foodCount(s, food) : 0;
          if (have > 0) {
            const it = ITEM_BY_ID[food];
            const cat = { ...inventory[it.category], [food]: have - 1 };
            if (cat[food] <= 0) delete cat[food];
            inventory = { ...inventory, [it.category]: cat };
            g.satiety = cfg.maxSatiety; g.criticalSinceDay = null; g.warnDay = null;
            s = addLog(s, `Auto Feed: ${GU_BY_ID[g.guId].name} eats ${it.name}.`);
            touched = true;
          }
        }
      }
    }
    nextOwned.push(touched ? g : inst);
    if (touched) dirty = true;
  }

  // Vital-Gu instability is an explicit record with a cause and an end time —
  // it expires on its own and can never be triggered by hunger or cultivation.
  const vInst = s.player.vitalInstability;
  if (vInst && totalGameMin(s.time) >= vInst.endMin) {
    s = { ...s, player: { ...s.player, vitalInstability: null } };
    s = toast(s, { icon: '🩸', title: 'APERTURE STABLE', lines: ['The Vital Gu bond settles — essence recovery returns to normal.'] });
    s = addLog(s, 'Your aperture settles — the Vital Gu bond is stable once more.');
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

export function revealFog(state, x, y) {
  const ws = state.worldState;
  const have = new Set(ws.fog || []);
  const add = seedFog(x, y, BALANCE.fog.revealRadius).filter(k => !have.has(k));
  if (!add.length) return state;
  return { ...state, worldState: { ...ws, fog: [...(ws.fog || []), ...add] } };
}