// Save migrations: v1 (realm/exp) → v2 (stages/mastery) → v3 (large world)
//                 → v4 (game clock, difficulty modes, save slots)
//                 → v5 (numeric cultivation aptitude + special constitutions)
//                 → v7 (elite boss lairs appear in the dangerous wilds).
import { CULTIVATION_STAGES } from '../data/cultivation';
import { GU_BY_ID } from '../data/gu';
import { ENEMY_BY_ID } from '../data/enemies';
import { initialEnemies, BOSS_SPAWNS, LANDMARKS } from '../data/world';
import { initialWildGu } from '../data/wildGu';
import { seedFog } from '../engine/guLife';
import { normalizeAptitude, essenceCapFor } from '../config/aptitude';
import { normalizeQuestState } from '../engine/questEngine';
import { LEADER_LINKS, isLeaderDef } from '../data/packs';

// v4 aptitudes were flat strings — map them onto the v5 numeric scale.
const LEGACY_APTITUDE = { Dull: 3, Ordinary: 5, Good: 6.5, Outstanding: 8, Heavenly: 9.5 };

export function migrateSave(old) {
  if (!old) return old;
  let s = old;

  if (s.version < 2) {
    const p = s.player || {};
    const oldRank = p.realmIndex || 0; // 0 = Mortal, 1..3 = Rank 1..3
    const estStage = Math.min(3, Math.floor((p.exp || 0) / (p.expToNext || 100) * 4));
    const global = Math.max(0, Math.min(19, Math.max(0, oldRank - 1) * 4 + estStage));
    const st = CULTIVATION_STAGES[global];
    const player = {
      ...p,
      rank: Math.floor(global / 4),
      stage: global % 4,
      cultivationProgress: Math.min(99, Math.floor((p.exp || 0) / (p.expToNext || 100) * 100)),
      totalInsight: p.totalInsight || 0,
      maxHp: st.maxHp,
      maxPrimevalEssence: st.maxEssence,
    };
    delete player.realm; delete player.realmIndex; delete player.exp; delete player.expToNext;
    const ownedGu = (s.ownedGu || []).filter(g => GU_BY_ID[g.guId]);
    const knownPaths = Array.from(new Set(['wind', ...ownedGu.map(g => GU_BY_ID[g.guId].path)]));
    s = {
      ...s,
      version: 2,
      player,
      ownedGu,
      mastery: {},
      masteryStats: {},
      knownPaths,
      knownRecipes: [],
      recovery: null,
      breakthrough: null,
      toasts: [],
      log: [...(s.log || []), 'The world shifts — cultivation now follows twenty stages and the Dao Paths awaken.'],
    };
  }

  if (s.version < 3) {
    s = {
      ...s,
      version: 3,
      player: { ...s.player, currentArea: 'greenValleyRegion', x: 42, y: 44 },
      contribution: s.contribution || { greenValley: 0 },
      missions: { active: [], completed: [] },
      arena: { wins: 0, losses: 0 },
      worldState: {
        gathered: {},
        discovered: { zones: { greenValleyTown: true }, landmarks: { townGate: true, teleportFormation: true } },
        enemies: initialEnemies(),
      },
      log: [...(s.log || []), 'The world has opened — roads, wilderness, ruins and distant dangers await beyond the town walls.'],
    };
  }

  if (s.version < 4) {
    const disc = s.worldState?.discovered || {};
    s = {
      ...s,
      version: 4,
      difficulty: s.difficulty || 'standard',
      time: s.time || { day: 1, min: 7 * 60 },
      playtimeSec: s.playtimeSec || 0,
      deceased: null,
      sleeping: null,
      worldState: {
        ...s.worldState,
        discovered: { ...disc, inns: { ...(disc.inns || {}), townInn: true } },
      },
      log: [...(s.log || []), 'The world breathes — day and night now pass over the Green Valley.'],
    };
  }

  if (s.version < 5) {
    const p = s.player || {};
    const rawApt = (typeof p.aptitude === 'object' && p.aptitude) ? p.aptitude : { score: LEGACY_APTITUDE[p.aptitude] ?? 5 };
    const apt = normalizeAptitude(rawApt);
    const st = CULTIVATION_STAGES[Math.min(19, (p.rank || 0) * 4 + (p.stage || 0))];
    const cap = essenceCapFor(st.maxEssence, apt);
    s = {
      ...s,
      version: 5,
      player: {
        ...p,
        aptitude: apt,
        maxPrimevalEssence: cap,
        primevalEssence: Math.min(p.primevalEssence ?? cap, cap),
      },
      log: [...(s.log || []), 'Your aperture settles — cultivation aptitude now shapes your essence.'],
    };
  }

  if (s.version < 6) {
    s = {
      ...s,
      version: 6,
      masters: s.masters || {},
      log: [...(s.log || []), 'Word spreads of reclusive masters in the wilds — and the shops of Green Valley settle into honest trades.'],
    };
  }

  if (s.version < 7) {
    const enemies = s.worldState?.enemies || [];
    const have = new Set(enemies.map(e => e.defId));
    const bosses = BOSS_SPAWNS.filter(b => !have.has(b.defId)).map(b => ({
      id: `boss_${b.defId}`, defId: b.defId, x: b.x, y: b.y, home: { x: b.x, y: b.y },
      behavior: b.behavior, detect: b.detect, hp: ENEMY_BY_ID[b.defId].hp,
      state: 'idle', alertTicks: 0, dead: false, respawnAt: 0,
    }));
    s = {
      ...s,
      version: 7,
      worldState: { ...s.worldState, enemies: [...enemies, ...bosses] },
      log: [...(s.log || []), 'Rumor spreads of ancient horrors stirring in the deepest wilds — elite beasts whose spoils forge legendary Gu.'],
    };
  }

  // v8: living Gu — hunger & feeding, wild Gu haunts, Vital Gu, fog of war.
  if (s.version < 8) {
    const p = s.player || {};
    const fog = new Set(seedFog(p.x ?? 42, p.y ?? 44, 6));
    for (const lm of LANDMARKS) {
      if (s.worldState?.discovered?.landmarks?.[lm.id]) seedFog(lm.x, lm.y, 3).forEach(k => fog.add(k));
    }
    s = {
      ...s,
      version: 8,
      inventory: { guFood: {}, guGear: {}, ...(s.inventory || {}) },
      settings: { autoFeed: false, ...(s.settings || {}) },
      vitalGu: s.vitalGu || null,
      vitalSwitchDay: s.vitalSwitchDay ?? -99,
      player: { ...p, vitalUnstableMin: 0 },
      ownedGu: (s.ownedGu || []).map(g => ({ satiety: 100, injuredUntilDay: 0, ...g })),
      worldState: { ...s.worldState, wildGu: initialWildGu(), fog: [...fog] },
      log: [...(s.log || []), 'The wilds stir — wild Gu haunt the deep places, hunger gnaws at unfed companions, and the map remembers only where you have walked.'],
    };
  }

  // v9: recipe knowledge journal — undiscovered recipes reveal only what the
  // character has actually heard (rumored → identified → located); exact
  // sources are earned through conversation and purchase, never given.
  if (s.version < 9) {
    s = { ...s, version: 9, recipeKnowledge: s.recipeKnowledge || {} };
  }

  // v10: essence rebalance — the aperture widens (realm base × aptitude),
  // aptitude shapes recovery speed, and recovery prices follow missing essence.
  if (s.version < 10) {
    const p = s.player || {};
    const st = CULTIVATION_STAGES[Math.min(19, (p.rank || 0) * 4 + (p.stage || 0))];
    const cap = essenceCapFor(st.maxEssence, normalizeAptitude(p.aptitude));
    s = {
      ...s,
      version: 10,
      player: { ...p, maxPrimevalEssence: cap, primevalEssence: Math.min(p.primevalEssence ?? cap, cap) },
      log: [...(s.log || []), 'Your aperture widens — primeval essence flows deeper and truer to your aptitude.'],
    };
  }

  // v11: quest records — one persistent, status-driven quest state replaces
  // the shared active/completed arrays (healed on every load below).
  if (s.version < 11) {
    s = { ...s, version: 11, log: [...(s.log || []), 'Your journal settles — every quest now keeps its own record, progress and all.'] };
  }

  // v12: Vital-Gu instability is now an explicit, cause-driven record
  // (cause + window + penalty). Legacy saves carry a bare minute-counter with
  // no recorded cause — instability without a valid cause is invalid, so it is
  // removed and essence recovery restored.
  if (s.version < 12) {
    const p = s.player || {};
    const hadInstability = (p.vitalUnstableMin || 0) > 0;
    const player = { ...p };
    delete player.vitalUnstableMin;
    player.vitalInstability = null;
    s = {
      ...s,
      version: 12,
      player,
      log: [...(s.log || []), ...(hadInstability ? ['The Vital Gu bond settles — the aperture is stable once more.'] : [])],
    };
  }

  // v13: staged tutorial — per-save tutorial progress. Existing characters are
  // marked complete (never nagged); they still receive one-time contextual tips.
  if (s.version < 13) {
    s = {
      ...s,
      version: 13,
      tutorial: s.tutorial || { welcome: false, active: false, completed: true, skipped: false, step: 0, moves: 0, tipsSeen: {} },
    };
  }

  // v14: Realm Insight (Cảm Ngộ) — a second progression resource spent on
  // breakthroughs and earned out in the world, plus the cultivation
  // diminishing-returns streak.
  if (s.version < 14) {
    const p = s.player || {};
    s = {
      ...s,
      version: 14,
      player: { ...p, realmInsight: p.realmInsight ?? 0, cultStreak: p.cultStreak ?? 0 },
      log: [...(s.log || []), 'A deeper truth settles over the valley — breakthroughs now ask for Realm Insight, earned in battle, discovery and deed, never on a cushion alone.'],
    };
  }

  // v15: packs & herds — existing world records are BOUND into packs by species
  // and proximity (nothing moves, nothing is added or removed); leader defs
  // organize their linked species (alpha → wolves, chief → bandits). New saves
  // spawn pack-aware from the start.
  if (s.version < 15) {
    const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
    const enemies = (s.worldState?.enemies || []).map(e => ({ ...e }));
    // single-link clusters of the same species within 3 tiles
    const groups = [];
    for (const e of enemies) {
      if (e.dead) continue;
      let g = groups.find(g2 => g2.defId === e.defId && g2.cells.some(([x, y]) => cheb(x, y, e.x, e.y) <= 3));
      if (!g) { g = { defId: e.defId, members: [], cells: [] }; groups.push(g); }
      g.members.push(e); g.cells.push([e.x, e.y]);
    }
    // leaders fold into a nearby group of their linked species
    for (const lg of groups.filter(g => LEADER_LINKS[g.defId])) {
      const tgt = groups.find(g => g.defId === LEADER_LINKS[lg.defId] && g !== lg
        && g.cells.some(([x, y]) => lg.cells.some(([lx, ly]) => cheb(x, y, lx, ly) <= 6)));
      if (tgt) {
        tgt.members.push(...lg.members);
        tgt.cells.push(...lg.cells);
        groups.splice(groups.indexOf(lg), 1);
      }
    }
    let n = 0;
    for (const g of groups) {
      if (g.members.length < 2) continue;
      const packId = `pk_m${n++}`;
      const leader = g.members.find(m => isLeaderDef(m.defId));
      for (const m of g.members) {
        m.packId = packId;
        m.packRole = leader && m === leader ? 'leader' : 'member';
        m.packLeaderId = leader ? leader.id : null;
      }
    }
    s = {
      ...s,
      version: 15,
      worldState: { ...s.worldState, enemies },
      log: [...(s.log || []), 'You notice it now — the beasts of the valley move in packs, and some packs have leaders.'],
    };
  }

  if (s.version < 16) {
    // Strength Path (Lực Đạo): track the un-bonused Max-HP base so the Path's
    // mastery vitality bonus can ride on top of it from now on.
    const p = s.player || {};
    s = {
      ...s,
      version: 16,
      player: { ...p, baseMaxHp: p.baseMaxHp ?? p.maxHp, strengthHpPct: 0 },
    };
  }

  // Self-heal the quest state on every load: legacy shapes become per-quest
  // records and hunt progress is rebuilt from the kill tally.
  return normalizeQuestState(s);
}