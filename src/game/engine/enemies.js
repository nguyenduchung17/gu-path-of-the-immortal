// Visible-enemy AI. Enemies exist in the world, wander their home area, notice
// the player ('?'), give chase ('!') and start combat on contact — or when the
// player attacks them first. No random encounters.
import { ENEMY_BY_ID, ecoOf } from '../data/enemies';
import { isWalkable, zoneAt, DEFAULT_ZONE, WORLD_NPCS } from '../data/world';
import { initCombat, maxStabilityOf } from './combat';
import { isNight } from './time';
import { exploreActive, carryIntoCombat, ambushOf, nearbyPackCount } from './exploration';
import { totalGameMin } from './vitalGu';
import { BALANCE } from '../config/balance';
import { T, locEnemyName } from '../i18n/tr';

const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NPC_CELLS = WORLD_NPCS.map(n => [n.x, n.y]);
const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
const manhattan = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

function cellFree(x, y, enemies, player) {
  if (!isWalkable(x, y)) return false;
  if (zoneAt(x, y)?.safe) return false; // enemies never enter safe zones
  if (player.x === x && player.y === y) return false;
  for (const [nx, ny] of NPC_CELLS) if (nx === x && ny === y) return false;
  for (const o of enemies) if (!o.dead && o.x === x && o.y === y) return false;
  return true;
}

function stepToward(e, tx, ty, enemies, player) {
  const dx = Math.sign(tx - e.x), dy = Math.sign(ty - e.y);
  const opts = dx && dy ? [[dx, 0], [0, dy]] : dx ? [[dx, 0], [0, 1], [0, -1]] : [[0, dy], [1, 0], [-1, 0]];
  for (const [ox, oy] of opts) {
    const nx = e.x + ox, ny = e.y + oy;
    if (nx === tx && ny === ty) return null;
    if (cellFree(nx, ny, enemies, player)) return { x: nx, y: ny };
  }
  return null;
}

function wander(e, enemies, player) {
  const [ox, oy] = ORTH[(Math.random() * 4) | 0];
  const nx = e.x + ox, ny = e.y + oy;
  if (cheb(nx, ny, e.home.x, e.home.y) > 3) return null;
  return cellFree(nx, ny, enemies, player) ? { x: nx, y: ny } : null;
}

// Runs once per player step. Returns { state, combat }.
export function tickEnemies(state) {
  const p = state.player;
  const ws = state.worldState;
  if (!ws || !ws.enemies) return { state, combat: null };
  const now = Date.now();

  // respawn enemies whose timer elapsed
  let enemies = ws.enemies.map(e =>
    e.dead && e.respawnAt && now >= e.respawnAt
      ? { ...e, dead: false, hp: ENEMY_BY_ID[e.defId]?.hp || 30, x: e.home.x, y: e.home.y, state: 'idle', alertTicks: 0 }
      : e
  );

  const pZone = zoneAt(p.x, p.y) || DEFAULT_ZONE;
  let combat = null;
  // Exploration Gu: stealth shrinks every enemy's notice range, Wind Step
  // haste makes pursuers miss half their steps, and a rooted/slowed enemy
  // (e.fx) is gated below — it cannot reach you while bound.
  const pfx = exploreActive(state);
  const stealthMul = pfx.stealth ? Math.max(0, 1 - (pfx.stealth.power || 0) / 100) : 1;
  const nowMin = totalGameMin(state.time);
  // engagement funnel: carry-overs, terrain, ambush and pack support all apply here
  const engage = (ne, intro) => {
    const carry = carryIntoCombat(state, ne);
    const amb = ambushOf(state, ne, false);
    const ambIntro = amb.amb === 'enemy'
      ? T('cmt.enemyAmbushIntro', { enemy: locEnemyName(ENEMY_BY_ID[ne.defId]) })
      : amb.note ? `${intro} ${amb.note}` : intro;
    return initCombat(ne.defId, p, {
      hp: ne.hp, stability: ne.stability, statuses: carry.statuses, playerStatuses: carry.playerStatuses,
      worldId: ne.id, difficulty: state.difficulty, zoneId: pZone.id, scouted: !!pfx.vision,
      ambush: amb.amb, allies: nearbyPackCount(state, ne.defId, ne.x, ne.y, ne.id), intro: ambIntro,
    });
  };
  const canEnemyMove = (ne) => {
    const fx = ne.fx || {};
    if (fx.root && fx.root.until > nowMin) return false;       // rooted in place
    if (fx.slow && fx.slow.until > nowMin) {                   // half pace: every other step
      ne.slowPulse = !ne.slowPulse;
      if (ne.slowPulse) return false;
    }
    if (pfx.haste && Math.random() < 0.5) return false;        // outpaced by Wind Step
    return true;
  };

  enemies = enemies.map(e => {
    if (e.dead || combat) return e;
    const dist = cheb(e.x, e.y, p.x, p.y);
    if (dist > BALANCE.world.activeRadius) return e;
    const def = ENEMY_BY_ID[e.defId];
    if (!def) return e;
    // daily rhythm: nocturnal hunters sharpen after dark, day creatures dull
    const eco = ecoOf(e.defId);
    const night = isNight(state.time);
    const actAdj = eco.activity === 'nocturnal' ? (night ? 1 : -1)
      : eco.activity === 'diurnal' ? (night ? -1 : 0) : 0;
    const detect = ((e.detect ?? (BALANCE.world.detect[e.behavior] ?? 4)) + (night ? BALANCE.time.nightDetectBonus : 0) + actAdj) * stealthMul;
    const homeDist = cheb(e.x, e.y, e.home.x, e.home.y);
    let ne = { ...e };

    // inside a safe zone enemies lose interest and drift home
    if (pZone.safe) {
      if (ne.state !== 'idle') ne.state = 'idle';
      if (homeDist > 1 && Math.random() < 0.5 && canEnemyMove(ne)) {
        const st = stepToward(ne, ne.home.x, ne.home.y, enemies, p);
        if (st) { ne.x = st.x; ne.y = st.y; }
      }
      return ne;
    }

    // passive creatures only fight when attacked
    if (e.behavior === 'passive') {
      ne.state = 'idle';
      if (Math.random() < 0.25 && canEnemyMove(ne)) { const st = wander(ne, enemies, p); if (st) { ne.x = st.x; ne.y = st.y; } }
      return ne;
    }

    const canDetect = e.behavior === 'territorial'
      ? dist <= detect && cheb(p.x, p.y, e.home.x, e.home.y) <= 5
      : dist <= detect;

    if (ne.state === 'chase') {
      if (dist > detect + BALANCE.world.giveUpDist || homeDist > BALANCE.world.leash) {
        ne.state = 'idle';
      } else if (manhattan(ne.x, ne.y, p.x, p.y) === 1) {
        combat = engage(ne, T('cmt.enemyCaught', { enemy: locEnemyName(def) }));
        return ne;
      } else if (canEnemyMove(ne)) {
        const st = stepToward(ne, p.x, p.y, enemies, p);
        if (st) { ne.x = st.x; ne.y = st.y; }
        if (manhattan(ne.x, ne.y, p.x, p.y) === 1) {
          combat = engage(ne, T('cmt.enemyCloses', { enemy: locEnemyName(def) }));
        }
      }
      return ne;
    }

    if (canDetect) {
      // one tick of '?' before the chase — a short chance to retreat
      if (ne.state === 'alert') ne.state = 'chase';
      else ne.state = 'alert';
      return ne;
    }
    if (ne.state === 'alert') ne.state = 'idle';
    const wanderRate = e.behavior === 'guard' ? 0
      : 0.15 + (eco.activity === 'nocturnal' ? (night ? 0.10 : -0.07)
        : eco.activity === 'diurnal' ? (night ? -0.08 : 0.05) : 0);
    if (Math.random() < Math.max(0, wanderRate) && canEnemyMove(ne)) {
      const st = homeDist > 2 ? stepToward(ne, ne.home.x, ne.home.y, enemies, p) : wander(ne, enemies, p);
      if (st) { ne.x = st.x; ne.y = st.y; }
    }
    return ne;
  });

  return { state: { ...state, worldState: { ...ws, enemies } }, combat };
}

// Natural recovery between fights — % of max HP per in-game minute (slow by
// design; see BALANCE.combat.regen). Never instantly heals; the enemy
// currently in combat is skipped. Guard (stability) mends a little faster.
export function regenWorldEnemies(state, minutes = 1) {
  const ws = state.worldState;
  if (!ws?.enemies?.length) return state;
  const cfg = BALANCE.combat.regen;
  const inCombatId = state.combat?.worldId || null;
  let changed = false;
  const enemies = ws.enemies.map(e => {
    if (e.dead || e.id === inCombatId) return e;
    const def = ENEMY_BY_ID[e.defId];
    if (!def) return e;
    const maxHp = def.hp;
    const maxStab = maxStabilityOf(def);
    const hp = e.hp ?? maxHp;
    const stab = e.stability ?? maxStab;
    if (hp >= maxHp && stab >= maxStab) return e;
    const pct = def.regenPct ?? (def.elite ? cfg.elitePctPerMin : cfg.defaultPctPerMin);
    changed = true;
    return {
      ...e,
      hp: Math.min(maxHp, Math.round((hp + (maxHp * pct / 100) * minutes) * 10) / 10),
      stability: Math.min(maxStab, Math.round((stab + (maxStab * cfg.stabilityPctPerMin / 100) * minutes) * 10) / 10),
    };
  });
  return changed ? { ...state, worldState: { ...ws, enemies } } : state;
}