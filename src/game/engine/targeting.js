// Attack targeting (#14–#18): which enemies a Gu hits, and how hard.
//   single — one selected target, full power (#15)
//   all    — every living enemy, full per-target power (AoE, #17)
//   cleave — primary at 100%, adjacent formation slots at pct% (#19)
//   chain  — primary → next foes with decaying falloff (lightning, #21)
//   random — n distinct random living enemies (wind multi-hit, #23)
// `sec` marks secondary targets: control proc chances are reduced on them.
import { T } from '../i18n/tr';

export function targetKindOf(gu) {
  return gu?.effect?.target?.kind || 'single';
}

export const TARGET_LABEL_KEY = {
  single: 'tg.single',
  all: 'tg.all',
  cleave: 'tg.cleave',
  chain: 'tg.chain',
  random: 'tg.random',
};

export function targetLabelKey(gu) {
  return TARGET_LABEL_KEY[targetKindOf(gu)] || 'tg.single';
}

// A short, human-readable targeting summary for Gu cards.
export function targetSummary(gu) {
  const t = gu?.effect?.target;
  if (!t || !t.kind || t.kind === 'single') return null;
  if (t.kind === 'random') return T('fx.hitsN', { n: t.hits || 3 });
  if (t.kind === 'cleave') return T('fx.adjacentPct', { p: t.pct || 50 });
  return null;
}

export function resolveTargets(combat, gu, targetUid) {
  const kind = targetKindOf(gu);
  const living = (combat.enemies || []).filter(e => e.hp > 0);
  if (!living.length) return [];
  const primary = living.find(e => e.uid === targetUid) || living[0];
  const list = [];
  if (kind === 'all') {
    for (const e of living) list.push({ e, mul: 1, sec: false });
  } else if (kind === 'chain') {
    const falloff = gu.effect.target.falloff || [1, 0.75, 0.55, 0.4];
    [primary, ...living.filter(e => e !== primary)].forEach((e, i) => {
      const m = falloff[Math.min(i, falloff.length - 1)];
      if (m > 0) list.push({ e, mul: m, sec: i > 0 });
    });
  } else if (kind === 'cleave') {
    list.push({ e: primary, mul: 1, sec: false });
    const idx = living.findIndex(x => x.uid === primary.uid);
    for (const j of [idx - 1, idx + 1]) {
      if (living[j]) list.push({ e: living[j], mul: (gu.effect.target.pct || 50) / 100, sec: true });
    }
  } else if (kind === 'random') {
    const hits = gu.effect.target.hits || 3;
    const pool = [...living];
    for (let i = 0; i < hits && pool.length; i++) {
      const j = Math.floor(Math.random() * pool.length);
      list.push({ e: pool[j], mul: 1, sec: false });
      pool.splice(j, 1);
    }
  } else {
    list.push({ e: primary, mul: 1, sec: false });
  }
  return list;
}