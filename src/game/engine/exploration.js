// Exploration Gu — dual-use Gu effects outside battle: scouting vision,
// resource sense, stealth, travel haste and tactical control (root / slow)
// on world enemies. Every use costs essence and carries a game-time cooldown;
// mastery is granted ONLY for meaningful use (a foe affected, pursuit escaped,
// intel actually found) — never for activation spam.
import { GU_BY_ID } from '../data/gu';
import { ENEMY_BY_ID, visualOf } from '../data/enemies';
import { BALANCE } from '../config/balance';
import { totalGameMin } from './vitalGu';
import { advanceTime } from './time';
import { grantMastery } from './mastery';
import { proficiencyOf, recordUse } from './proficiency';
import { revealFog } from './guLife';
import { WORLD_RESOURCES, WORLD, HIDDEN_PATHS, HAZARDS, hazardAt, LANDMARKS } from '../data/world';

const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

// Is a hazard of this kind within `r` paces of the player? (cells or rect)
function hazardNear(p, kind, r) {
  return HAZARDS.some(h => {
    if (h.kind !== kind) return false;
    if (h.cells) return h.cells.some(([x, y]) => cheb(x, y, p.x, p.y) <= r);
    const rc = h.rect;
    return p.x >= rc.x - r && p.x < rc.x + rc.w + r && p.y >= rc.y - r && p.y < rc.y + rc.h + r;
  });
}

// Active exploration buffs on the player (vision / stealth / haste / sense).
export function exploreActive(state) {
  const fx = state.exploreFx || {};
  const now = totalGameMin(state.time);
  const out = {};
  for (const k of ['vision', 'stealth', 'haste', 'sense', 'waterwalk', 'steady']) {
    if (fx[k] && fx[k].until > now) out[k] = fx[k];
  }
  return out;
}

// Boosted fog-reveal radius while a scouting Gu is active (undefined = normal).
export function visionRadiusOf(state) {
  const act = exploreActive(state);
  return act.vision ? (act.vision.radius || 9) : undefined;
}

// Remaining exploration cooldown (game minutes) for a Gu instance.
export function exploreCdLeft(state, inst) {
  const until = (state.exploreCd || {})[inst.instanceId] || 0;
  return Math.max(0, until - totalGameMin(state.time));
}

// Powerful enemies partially resist exploration control — reduced duration,
// never full immunity: a boss still feels it, just barely.
function resistFactor(def) {
  const cfg = BALANCE.exploration.resist;
  if (def.elite) return cfg.elite;
  if ((visualOf(def.id)?.danger ?? 0) >= 4) return cfg.boss;
  return 1;
}

function nearestEnemy(state, range) {
  const p = state.player;
  let best = null, bestD = Infinity;
  for (const e of state.worldState.enemies || []) {
    if (e.dead) continue;
    const d = cheb(e.x, e.y, p.x, p.y);
    if (d <= range && d < bestD) { best = e; bestD = d; }
  }
  return best;
}

// Secret passages: while a perception Gu (vision/sense) is active, any
// undiscovered hidden path near the player reveals itself — permanently.
export function checkHiddenPaths(s) {
  const act = exploreActive(s);
  if (!act.vision && !act.sense) return s;
  const p = s.player;
  const known = s.worldState.discovered?.paths || {};
  let found = null;
  for (const hp of HIDDEN_PATHS) {
    if (known[hp.id]) continue;
    if (Math.max(Math.abs(hp.x - p.x), Math.abs(hp.y - p.y)) <= hp.r) { found = hp; break; }
  }
  if (!found) return s;
  return {
    ...s,
    worldState: { ...s.worldState, discovered: { ...s.worldState.discovered, paths: { ...known, [found.id]: true } } },
    log: [...s.log, `${found.name} revealed — the way is permanently open to you.`],
    toasts: [...(s.toasts || []), { id: `hp${Date.now().toString(36)}`, icon: '🌀', title: 'HIDDEN PATH REVEALED', lines: [found.name, 'A secret way opens before you.'] }],
  };
}

// Passability override for blocked cells: revealed secret passages ('P')
// and the rapids under a waterwalk binding. Returns { reason } to pass,
// { blocked } with a hint message, or null for a normal wall.
export function moveOverride(state, nx, ny) {
  const row = WORLD.tiles[ny];
  const tile = row ? row[nx] : null;
  if (tile === 'P') {
    const hp = HIDDEN_PATHS.find(p => p.cells.some(([cx, cy]) => cx === nx && cy === ny));
    const known = state.worldState.discovered?.paths || {};
    if (hp && known[hp.id]) return { reason: `You follow ${hp.name}.` };
    if (hp) return { blocked: 'Something is hidden here — a scouting Gu might reveal the way.' };
    return null;
  }
  const hz = hazardAt(nx, ny);
  if (hz?.kind === 'rapids') {
    if (exploreActive(state).waterwalk) return { reason: 'Tide Binding stills the raging water — you cross.' };
    return { blocked: 'The Raging Rapids churn — nothing crosses. Perhaps a binding could still the waters…' };
  }
  return null;
}

// After stepping: hazards bite unprotected travelers — miasma burns lungs,
// unstable ground drags at every stride — and BOTH cost extra game minutes
// per step, so terrain directly shapes travel efficiency on the map. The
// right Gu bypasses each hazard safely at full pace.
export function hazardStep(s) {
  const hz = hazardAt(s.player.x, s.player.y);
  if (!hz) return s;
  const act = exploreActive(s);
  const slowMin = (BALANCE.exploration.hazardSlowMinutes || {})[hz.kind] || 0;
  if (hz.kind === 'miasma') {
    if (act.stealth) {
      return { ...s, log: [...s.log, 'Mist Veil shrouds you — the miasma slides past harmlessly.'] };
    }
    const dmg = BALANCE.exploration.hazardDmg;
    const out = {
      ...s,
      player: { ...s.player, hp: Math.max(1, s.player.hp - dmg) },
      log: [...s.log, `Poison miasma sears your lungs! (-${dmg} HP, +${slowMin} min)`],
    };
    return advanceTime(out, slowMin);
  }
  if (hz.kind === 'unstable') {
    if (act.steady) {
      return { ...s, log: [...s.log, `${hz.name} shifts and groans — your steady grip keeps your footing sure.`] };
    }
    return advanceTime({ ...s, log: [...s.log, `${hz.name} — the shifting ground fights your every step. (+${slowMin} min)`] }, slowMin);
  }
  return s;
}

// What a battle inherits from exploration prep: lingering enemy control
// (root → hard slow, slow → slow) and the player's active travel haste carry
// into the opening round instead of being reset.
export function carryIntoCombat(state, enemyRecord) {
  const now = totalGameMin(state.time);
  const fx = enemyRecord?.fx || {};
  const statuses = [...(enemyRecord.statuses || [])];
  if (fx.slow && fx.slow.until > now) statuses.push({ type: 'slow', power: Math.max(30, fx.slow.power || 50), duration: 2 });
  if (fx.root && fx.root.until > now) statuses.push({ type: 'slow', power: 60, duration: 1 });
  const pfx = exploreActive(state);
  const playerStatuses = pfx.haste ? [{ type: 'haste', power: 25, duration: 1 }] : [];
  return { statuses, playerStatuses };
}

// Activate an equipped Gu's exploration effect (world context, not battle).
export function applyExploreGu(state, inst) {
  const gu = GU_BY_ID[inst.guId];
  const ex = gu?.explore;
  if (!ex) return { state, ok: false, reason: 'This Gu has no use in the wilds.' };
  const p = state.player;
  if (!p.equippedGu.includes(inst.instanceId)) return { state, ok: false, reason: `${gu.name} must be equipped.` };
  const now = totalGameMin(state.time);
  const cdLeft = Math.max(0, ((state.exploreCd || {})[inst.instanceId] || 0) - now);
  if (cdLeft > 0) return { state, ok: false, reason: `${gu.name} is recovering — ${Math.ceil(cdLeft)} min.` };
  if (p.primevalEssence < ex.essence) return { state, ok: false, reason: 'Not enough essence.' };

  // a practiced companion works the wilds longer — proficiency extends the effect
  const prof = proficiencyOf(inst);
  const dur = Math.max(1, Math.round(ex.duration * (1 + prof.durationPct / 100)));
  const until = now + dur;

  const spend = (s, fxPatch, toast) => {
    const rec = recordUse(s, inst.instanceId);
    return {
      state: {
        ...rec.state,
        player: { ...rec.state.player, primevalEssence: rec.state.player.primevalEssence - ex.essence },
        exploreFx: { ...(rec.state.exploreFx || {}), ...fxPatch },
        exploreCd: { ...(rec.state.exploreCd || {}), [inst.instanceId]: now + ex.cooldown },
      },
      ok: true,
      toast: rec.leveledTo ? { ...toast, lines: [...toast.lines, `${gu.name} reaches Proficiency Lv.${rec.leveledTo}!`] } : toast,
    };
  };

  // ---- control: root / slow the nearest enemy in range (partial resist on elites/bosses) ----
  if (ex.kind === 'root' || ex.kind === 'slow') {
    const e = nearestEnemy(state, ex.range || BALANCE.exploration.range);
    if (!e) {
      // no foe to bind — a water Gu can instead still the Raging Rapids
      const nearRapids = ex.kind === 'root'
        && HAZARDS.some(h => h.kind === 'rapids'
          && h.cells.some(([cx, cy]) => cheb(cx, cy, p.x, p.y) <= 2));
      if (!nearRapids) return { state, ok: false, reason: `No enemy within ${ex.range || BALANCE.exploration.range} paces.` };
      let s = grantMastery(state, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
      return spend(s, { waterwalk: { until } }, {
        icon: '⛓️', title: 'WATERS BOUND',
        lines: [`${gu.name} grips the torrent — the rapids calm for ${dur} min.`, 'Cross while the binding holds!'],
      });
    }
    const def = ENEMY_BY_ID[e.defId];
    const effDur = Math.max(1, Math.round(dur * resistFactor(def)));
    const enemies = (state.worldState.enemies || []).map(x => x.id !== e.id ? x : {
      ...x,
      fx: { ...(x.fx || {}), [ex.kind]: { power: ex.power || 0, until: now + effDur, pulse: false } },
    });
    let s = { ...state, worldState: { ...state.worldState, enemies } };
    s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    return spend(s, {}, {
      icon: ex.kind === 'root' ? '⛓️' : '🕸️',
      title: resistFactor(def) < 1 ? 'PARTIALLY RESISTED' : (ex.kind === 'root' ? 'ENEMY ROOTED' : 'ENEMY SLOWED'),
      lines: [ex.kind === 'root'
        ? `${gu.name} lashes out — ${def.name} cannot move for ${effDur} min.`
        : `${gu.name} coils about ${def.name} — it moves at half pace for ${effDur} min.`],
    });
  }

  // ---- scouting: reveal the wilds, expose nearby threats' details ----
  if (ex.kind === 'vision') {
    const r = ex.radius || 9;
    let s = revealFog(state, p.x, p.y, r);
    const foes = (s.worldState.enemies || []).filter(e => !e.dead && cheb(e.x, e.y, p.x, p.y) <= r);
    // hidden places — caves, springs, lairs — are charted on the map for good
    const knownLm = s.worldState.discovered?.landmarks || {};
    const foundLm = LANDMARKS.filter(lm => lm.hidden && !knownLm[lm.id]
      && Math.max(Math.abs(lm.x - p.x), Math.abs(lm.y - p.y)) <= r);
    if (foundLm.length) {
      s = { ...s, worldState: { ...s.worldState, discovered: { ...s.worldState.discovered, landmarks: { ...knownLm, ...Object.fromEntries(foundLm.map(l => [l.id, true])) } } } };
    }
    if (foes.length || foundLm.length) s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    const out = spend(s, { vision: { until, radius: r } }, {
      icon: '👁️', title: 'SCOUTING',
      lines: [
        `The wilds within ${r} paces are laid bare.`,
        foes.length ? `${foes.length} threat(s) revealed — details on the left.` : 'No threats within sight.',
        ...(foundLm.length ? [`🗺️ ${foundLm.length} hidden place(s) charted on your map.`] : []),
      ],
    });
    out.state = checkHiddenPaths(out.state);
    return out;
  }

  // ---- resource sense: feel gathering nodes through the earth ----
  if (ex.kind === 'sense') {
    const r = ex.radius || 8;
    const near = WORLD_RESOURCES.filter(n => cheb(n.x, n.y, p.x, p.y) <= r);
    const byName = {};
    for (const n of near) byName[n.name] = (byName[n.name] || 0) + 1;
    let s = revealFog(state, p.x, p.y, r);
    if (near.length) s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    const out = spend(s, { sense: { until } }, {
      icon: '🦋', title: 'RESOURCE SENSE',
      lines: near.length
        ? [...Object.entries(byName).map(([name, n]) => `${n}× ${name} within ${r} paces`), ...(near.some(n => n.rare) ? ['✨ A rare harvest hides among them.'] : [])]
        : [`Nothing of use within ${r} paces.`],
    });
    out.state = checkHiddenPaths(out.state);
    return out;
  }

  // ---- stealth: enemies notice you far less (sneak past, break chases) ----
  if (ex.kind === 'stealth') {
    const power = ex.power || 50;
    const foes = (state.worldState.enemies || []).filter(e => !e.dead && cheb(e.x, e.y, p.x, p.y) <= 10);
    let s = state;
    if (foes.length) s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    return spend(s, { stealth: { until, power } }, {
      icon: '🌫️', title: 'VEILED',
      lines: [`Enemy detection −${power}% for ${dur} min.`, ...(foes.length ? ['You slip past unaware eyes.'] : [])],
    });
  }

  // ---- travel haste: outpace pursuit — enemies miss half their steps ----
  if (ex.kind === 'haste') {
    const pursued = (state.worldState.enemies || []).some(e => !e.dead && (e.state === 'chase' || e.state === 'alert'));
    let s = state;
    if (pursued) s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    return spend(s, { haste: { until } }, {
      icon: '💨', title: 'WIND STEP',
      lines: [`Your stride outpaces the wilds for ${dur} min.`, ...(pursued ? ['You pull ahead of the pursuit!'] : [])],
    });
  }

  // ---- steady: an earth grip that anchors your steps on shifting ground ----
  if (ex.kind === 'steady') {
    const near = hazardNear(p, 'unstable', 3);
    let s = state;
    if (near) s = grantMastery(s, gu.path, BALANCE.exploration.masteryXp, 'guUsed', 'guUse');
    return spend(s, { steady: { until } }, {
      icon: '⛰️', title: 'SURE-FOOTED',
      lines: [`${gu.name} anchors your steps for ${dur} min.`, ...(near ? ['The shifting ground cannot slow you.'] : [])],
    });
  }

  return { state, ok: false, reason: 'Unknown exploration effect.' };
}

// ---- Ambush ----
// Who holds the opening edge. Striking an unaware foe (or one you are veiled
// from by stealth) opens its guard; ambusher species catch an unprepared
// traveler — unless a scouting Gu (vision/sense) is watching.
// Returns { amb: 'player' | 'enemy' | null, note? }.
export function ambushOf(state, e, initiatedByPlayer) {
  const act = exploreActive(state);
  const def = ENEMY_BY_ID[e.defId];
  if (initiatedByPlayer) {
    const unaware = !e.state || e.state === 'idle' || e.state === 'alert';
    return { amb: (unaware || !!act.stealth) ? 'player' : null };
  }
  if (def?.ambusher) {
    if (act.vision || act.sense) return { amb: null, note: `${def.name} lunges from hiding — but your scouting Gu caught the ambush. No edge gained!` };
    return { amb: 'enemy' };
  }
  return { amb: null };
}

// Same-species kin within sight of a fight — they embolden the fighter
// (applied in initCombat) and converge on the player afterwards.
export function nearbyPackCount(state, defId, x, y, excludeId, r = 2) {
  let n = 0;
  for (const o of state.worldState.enemies || []) {
    if (o.dead || o.id === excludeId || o.defId !== defId) continue;
    if (Math.abs(o.x - x) <= r && Math.abs(o.y - y) <= r) n++;
  }
  return n;
}