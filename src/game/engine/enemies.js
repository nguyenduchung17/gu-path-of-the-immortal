// Visible-enemy AI. Enemies exist in the world, wander their home area, notice
// the player ('?'), give chase ('!') and start combat on contact — or when the
// player attacks them first. No random encounters.
import { ENEMY_BY_ID } from '../data/enemies';
import { isWalkable, zoneAt, DEFAULT_ZONE, WORLD_NPCS } from '../data/world';
import { initCombat } from './combat';
import { isNight } from './time';
import { BALANCE } from '../config/balance';

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

  enemies = enemies.map(e => {
    if (e.dead || combat) return e;
    const dist = cheb(e.x, e.y, p.x, p.y);
    if (dist > BALANCE.world.activeRadius) return e;
    const def = ENEMY_BY_ID[e.defId];
    if (!def) return e;
    const detect = (e.detect ?? (BALANCE.world.detect[e.behavior] ?? 4)) + (isNight(state.time) ? BALANCE.time.nightDetectBonus : 0);
    const homeDist = cheb(e.x, e.y, e.home.x, e.home.y);
    let ne = { ...e };

    // inside a safe zone enemies lose interest and drift home
    if (pZone.safe) {
      if (ne.state !== 'idle') ne.state = 'idle';
      if (homeDist > 1 && Math.random() < 0.5) {
        const st = stepToward(ne, ne.home.x, ne.home.y, enemies, p);
        if (st) { ne.x = st.x; ne.y = st.y; }
      }
      return ne;
    }

    // passive creatures only fight when attacked
    if (e.behavior === 'passive') {
      ne.state = 'idle';
      if (Math.random() < 0.25) { const st = wander(ne, enemies, p); if (st) { ne.x = st.x; ne.y = st.y; } }
      return ne;
    }

    const canDetect = e.behavior === 'territorial'
      ? dist <= detect && cheb(p.x, p.y, e.home.x, e.home.y) <= 5
      : dist <= detect;

    if (ne.state === 'chase') {
      if (dist > detect + BALANCE.world.giveUpDist || homeDist > BALANCE.world.leash) {
        ne.state = 'idle';
      } else if (manhattan(ne.x, ne.y, p.x, p.y) === 1) {
        combat = initCombat(e.defId, p, { hp: ne.hp, worldId: e.id, difficulty: state.difficulty, intro: `${def.name} catches you!` });
        return ne;
      } else {
        const st = stepToward(ne, p.x, p.y, enemies, p);
        if (st) { ne.x = st.x; ne.y = st.y; }
        if (manhattan(ne.x, ne.y, p.x, p.y) === 1) {
          combat = initCombat(e.defId, p, { hp: ne.hp, worldId: e.id, difficulty: state.difficulty, intro: `${def.name} closes in!` });
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
    if (e.behavior !== 'guard' && Math.random() < 0.15) {
      const st = homeDist > 2 ? stepToward(ne, ne.home.x, ne.home.y, enemies, p) : wander(ne, enemies, p);
      if (st) { ne.x = st.x; ne.y = st.y; }
    }
    return ne;
  });

  return { state: { ...state, worldState: { ...ws, enemies } }, combat };
}