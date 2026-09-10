// Killer Moves (Sát Chiêu) — research, compatibility, compilation and combat
// integration for techniques that bind several Gu into one strike.
//
// SHAPE: state.killerMoves = { known: [...], loadout: [id|null ×3],
// blueprints: [...], seen: false, cdUntil: <game-min> }
// A known move = { id, coreId, supportIds, blueprintId, createdDay }. The
// compiled ability is DERIVED from the live component instances at every use,
// so Gu rank-ups and condition feed straight into the technique.
//
// DISCOVERY (#19): the exact result of an experiment is never shown in
// advance — only compatibility grades, estimates and success odds. The full
// technique appears only on success.
import { GU_BY_ID } from '../data/gu';
import { PATH_BY_ID, SYNERGIES } from '../data/paths';
import { rolesOf, ROLES } from '../data/roles';
import { KM_SUPPORT_FX, KM_OPPOSED, KM_BLUEPRINTS, BLUEPRINT_BY_ID, blueprintMatches } from '../data/killerMoves';
import { BALANCE } from '../config/balance';
import { masteryOf, grantMastery } from './mastery';
import { guCondition } from './guLife';
import { applyEffects } from './effects';
import { totalGameMin } from './vitalGu';
import { T, locGuName, locPathName } from '../i18n/tr';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let _tid = 0;
const pushToast = (s, t) => ({ ...s, toasts: [...(s.toasts || []), { id: `km${Date.now().toString(36)}${_tid++}`, ...t }] });

export function kmSeed() {
  return { known: [], loadout: [null, null, null], blueprints: [], seen: false, cdUntil: 0 };
}

// A Core must lead with offense — everything else supports it (#5).
export const canLead = (gu) => rolesOf(gu).includes('attack');

// Complexity is mastery-gated (#20, #21): low mastery = simple 2-Gu moves.
export function maxSupportsOf(state, coreGu) {
  const cfg = BALANCE.killerMoves;
  const lvl = clamp(masteryOf(state, coreGu.path).level, 1, 5);
  return cfg.maxSupportsByMastery[lvl] || 1;
}

// Early access (#22): two Gu, one of them able to lead.
export function kmResearchAvailable(state) {
  const owned = state.ownedGu || [];
  return owned.length >= 2 && owned.some(g => canLead(GU_BY_ID[g.guId]));
}

export function kmSlotsOf(state) {
  const cfg = BALANCE.killerMoves;
  return (state.player?.rank || 0) >= cfg.slotsAtRank ? cfg.slotsBase + 1 : cfg.slotsBase;
}

// ---- Compatibility (#7) ----
// Scored per support: same Path > known synergy pair > crafter's insight >
// stranger > opposing current. The average grades the whole technique.
export function compatibilityOf(coreGu, supportGus) {
  if (!supportGus.length) return { key: 'unstable', score: 0, pct: 0 };
  let sum = 0;
  for (const sp of supportGus) {
    if (sp.path === coreGu.path) sum += 18;
    else if (sp.path === 'refinement') sum += 12;
    else if (SYNERGIES.some(sy => sy.paths.includes(coreGu.path) && sy.paths.includes(sp.path))) sum += 14;
    else if (KM_OPPOSED.some(([a, b]) => (a === coreGu.path && b === sp.path) || (b === coreGu.path && a === sp.path))) sum += -15;
    else sum += 4;
  }
  const score = sum / supportGus.length;
  const key = score >= 14 ? 'excellent' : score >= 8 ? 'good' : score >= 0 ? 'unstable' : 'poor';
  return { key, score, pct: BALANCE.killerMoves.compatBonus[key] };
}

// ---- Compilation: merge supports onto the core effect ----
const clone = (o) => (o && typeof o === 'object') ? JSON.parse(JSON.stringify(o)) : o;
function mergeObj(cur, val) {
  if (cur && typeof cur === 'object' && !Array.isArray(cur)) {
    return { ...cur, power: (cur.power || 0) + (val.power || 0), chance: (cur.chance || 0) + (val.chance || 0), duration: Math.max(cur.duration || 0, val.duration || 0) };
  }
  return clone(val);
}

// Returns { fx, activationBonus }. fx.attack.range is the designed damage
// window — combat rolls inside it exactly like a normal Gu.
export function compileEffect(coreGu, supportGus) {
  const cfg = BALANCE.killerMoves;
  const fx = clone(coreGu.effect) || {};
  fx.attack = { ...(fx.attack || {}) };
  let activationBonus = 0;
  for (const sp of supportGus) {
    const add = KM_SUPPORT_FX[sp.path];
    if (!add) continue;
    if (add.activation) activationBonus += add.activation;
    for (const [key, val] of Object.entries(add)) {
      if (key === 'activation') continue;
      if (key === 'attack') {
        for (const [k, v] of Object.entries(val)) {
          fx.attack[k] = typeof v === 'number' && typeof fx.attack[k] === 'number'
            ? fx.attack[k] + v
            : mergeObj(fx.attack[k], v);
        }
      } else if (key === 'self') {
        fx.self = { ...(fx.self || {}) };
        for (const [k, v] of Object.entries(val)) fx.self[k] = mergeObj(fx.self[k], v);
      } else if (typeof val === 'number') {
        fx[key] = (typeof fx[key] === 'number' ? fx[key] : 0) + val;
      } else {
        fx[key] = mergeObj(fx[key], val);
      }
    }
  }
  // the visible damage window: core's range scaled by support count
  const atk = coreGu.effect?.attack || {};
  const base = Array.isArray(atk.range)
    ? { min: atk.range[0], max: atk.range[1] }
    : { min: Math.floor((atk.power || 0) * 0.85), max: Math.floor((atk.power || 0) * 1.15) };
  const mul = 1 + supportGus.length * (cfg.supportDamagePct / 100);
  fx.attack.range = [Math.max(1, Math.round(base.min * mul)), Math.max(1, Math.round(base.max * mul))];
  if (!fx.attack.power) fx.attack.power = Math.round((fx.attack.range[0] + fx.attack.range[1]) / 2);
  return { fx, activationBonus };
}

// ---- Preview (#3, #10): estimates only — never the exact result ----
export function kmPreview(state, coreInst, supportInsts, bp = null) {
  const cfg = BALANCE.killerMoves;
  if (!coreInst) return { ok: false, reasonKey: 'km.errNoCore' };
  const coreGu = GU_BY_ID[coreInst.guId];
  if (!canLead(coreGu)) return { ok: false, reasonKey: 'km.errNotLead' };
  const supports = (supportInsts || []).filter(Boolean);
  if (!supports.length) return { ok: false, reasonKey: 'km.errNeedSupport' };
  const supportGus = supports.map(i => GU_BY_ID[i.guId]);
  const max = maxSupportsOf(state, coreGu);
  if (supports.length > max) return { ok: false, reasonKey: 'km.errTooMany', reasonParams: { n: max, path: locPathName(PATH_BY_ID[coreGu.path]) } };
  const ids = new Set([coreInst.instanceId, ...supports.map(i => i.instanceId)]);
  if (ids.size !== 1 + supports.length) return { ok: false, reasonKey: 'km.errDuplicate' };
  for (const inst of [coreInst, ...supports]) {
    const b = bindingOf(state, inst.instanceId);
    if (b?.active) return { ok: false, reasonKey: 'km.errBound', reasonParams: { gu: locGuName(GU_BY_ID[inst.guId]), move: kmNameOf(state, b.move) } };
  }

  const { fx, activationBonus } = compileEffect(coreGu, supportGus);
  const grade = compatibilityOf(coreGu, supportGus);
  const lvl = clamp(masteryOf(state, coreGu.path).level, 1, 5);
  const essence = Math.max(1, coreGu.energyCost + supports.reduce((a, i) => a + Math.ceil(GU_BY_ID[i.guId].energyCost * cfg.supportCostPct / 100), 0));
  const activation = clamp(
    cfg.baseActivation + (lvl - 1) * cfg.actPerMastery + grade.pct + activationBonus + (bp?.stabilityPct || 0) + cfg.actPerSupport * supports.length,
    cfg.activationMin, cfg.activationMax);
  const cooldown = Math.max(2, coreGu.cooldown || 2);
  const chance = clamp(
    cfg.baseChance + (lvl - 1) * cfg.perMastery + grade.pct + (bp?.successPct || 0),
    10, 90);
  const pseudo = pseudoOf(state, { coreId: coreInst.instanceId, supportIds: supports.map(i => i.instanceId) }, { fx, essence, cooldown, coreGu });
  return {
    ok: true, grade, dmg: { min: fx.attack.range[0], max: fx.attack.range[1] },
    essence, activation, cooldown, chance,
    chanceParts: { base: cfg.baseChance, mastery: (lvl - 1) * cfg.perMastery, compat: grade.pct, blueprint: bp?.successPct || 0 },
    researchCost: { essence: cfg.essenceBase + supports.length * cfg.essencePerSupport, stones: cfg.stonesBase + supports.length * cfg.stonesPerSupport },
    targetKind: fx.target?.kind || 'single',
    roles: rolesOf(pseudo), maxSupports: max, corePath: coreGu.path,
  };
}

// ---- Naming (#13): the support's Path brands the core ----
export function kmNameOf(state, move) {
  const coreInst = (state.ownedGu || []).find(g => g.instanceId === move.coreId);
  if (!coreInst) return T('km.fallbackName');
  const coreGu = GU_BY_ID[coreInst.guId];
  const supInst = (state.ownedGu || []).find(g => g.instanceId === move.supportIds?.[0]);
  const supPath = supInst ? GU_BY_ID[supInst.guId].path : null;
  const word = supPath ? T(`km.word.${supPath}`) : T('km.word.solo');
  return T('km.nameTemplate', { word, base: locGuName(coreGu).replace(/\s*Gu$/, '') });
}

// ---- Binding (#14, #32): a Gu absorbed by an equipped, complete move ----
export function moveStatus(state, move) {
  const ids = [move.coreId, ...(move.supportIds || [])];
  const missing = [];
  for (const id of ids) {
    const inst = (state.ownedGu || []).find(g => g.instanceId === id);
    if (!inst) { missing.push({ id, key: 'km.missing.gone' }); continue; }
    if (!(state.player?.equippedGu || []).includes(id)) { missing.push({ id, key: 'km.missing.unequipped' }); continue; }
    const cond = guCondition(state, inst);
    if (cond.injured && cond.severity === 'severe') missing.push({ id, key: 'km.missing.severe' });
  }
  return { complete: missing.length === 0, missing };
}

export function bindingOf(state, instanceId) {
  const km = state.killerMoves;
  if (!km) return null;
  for (const move of km.known || []) {
    const ids = [move.coreId, ...(move.supportIds || [])];
    if (!ids.includes(instanceId)) continue;
    const equipped = (km.loadout || []).includes(move.id);
    return { move, equipped, active: equipped && moveStatus(state, move).complete };
  }
  return null;
}

export function kmBoundIds(state) {
  const out = new Set();
  const km = state.killerMoves;
  if (!km) return out;
  for (const move of km.known || []) {
    if (!bindingOf(state, move.coreId)?.active) continue;
    out.add(move.coreId);
    for (const id of move.supportIds || []) out.add(id);
  }
  return out;
}

export const kmCdKey = (move) => `km_${move.id}`;

// ---- Pseudo-Gu: the compiled technique as combat knows it ----
function pseudoOf(state, move, compiled) {
  const coreInst = (state.ownedGu || []).find(g => g.instanceId === move.coreId);
  const coreGu = GU_BY_ID[coreInst.guId];
  return {
    id: move.id, name: kmNameOf(state, move), rank: 3, type: 'Attack',
    path: coreGu.path, element: coreGu.element, rarity: 'epic',
    energyCost: compiled.essence, cooldown: compiled.cooldown, effect: compiled.fx,
  };
}

// Everything the UI needs about one known move.
export function kmMoveStats(state, move) {
  const coreInst = (state.ownedGu || []).find(g => g.instanceId === move.coreId);
  const supports = (move.supportIds || []).map(id => (state.ownedGu || []).find(g => g.instanceId === id)).filter(Boolean);
  const status = moveStatus(state, move);
  const coreGu = coreInst ? GU_BY_ID[coreInst.guId] : null;
  const supportGus = supports.map(i => GU_BY_ID[i.guId]);
  const compiled = coreGu ? compileEffect(coreGu, supportGus) : null;
  const pseudo = coreInst ? pseudoOf(state, move, { fx: compiled.fx, essence: 0, cooldown: 0, coreGu }) : null;
  const slot = (state.killerMoves?.loadout || []).indexOf(move.id);
  const cfg = BALANCE.killerMoves;
  const grade = coreGu ? compatibilityOf(coreGu, supportGus) : null;
  const lvl = coreGu ? clamp(masteryOf(state, coreGu.path).level, 1, 5) : 1;
  const essence = coreGu ? Math.max(1, coreGu.energyCost + supports.reduce((a, i) => a + Math.ceil(GU_BY_ID[i.guId].energyCost * cfg.supportCostPct / 100), 0)) : 0;
  return {
    move, status, slot: slot >= 0 ? slot : null, name: kmNameOf(state, move), gu: pseudo,
    dmg: compiled ? { min: compiled.fx.attack.range[0], max: compiled.fx.attack.range[1] } : null,
    essence,
    activation: compiled ? clamp(
      cfg.baseActivation + (lvl - 1) * cfg.actPerMastery + (grade?.pct || 0) + compiled.activationBonus + cfg.actPerSupport * supports.length,
      cfg.activationMin, cfg.activationMax) : 0,
    roles: pseudo ? rolesOf(pseudo) : [],
    targetKind: compiled?.fx?.target?.kind || 'single',
    coreName: coreInst ? locGuName(coreGu) : '???',
    corePath: coreGu?.path,
    supportNames: supportGus.map(locGuName),
  };
}

// Equipped loadout entries for battle + loadout UI.
export function kmBattleEntries(state) {
  const km = state.killerMoves || kmSeed();
  return (km.loadout || [])
    .filter(id => id)
    .map(id => (km.known || []).find(m => m.id === id))
    .filter(Boolean)
    .map(move => ({ move, stats: kmMoveStats(state, move) }));
}

// A usable combat entry — null when the move is not equipped or incomplete.
export function kmCombatEntry(state, move) {
  const km = state.killerMoves || kmSeed();
  if (!move || !(km.loadout || []).includes(move.id)) return null;
  const status = moveStatus(state, move);
  if (!status.complete) return null;
  const coreInst = (state.ownedGu || []).find(g => g.instanceId === move.coreId);
  const supports = (move.supportIds || []).map(id => (state.ownedGu || []).find(g => g.instanceId === id)).filter(Boolean);
  const coreGu = GU_BY_ID[coreInst.guId];
  const { fx, activationBonus } = compileEffect(coreGu, supports.map(i => GU_BY_ID[i.guId]));
  const grade = compatibilityOf(coreGu, supports.map(i => GU_BY_ID[i.guId]));
  const lvl = clamp(masteryOf(state, coreGu.path).level, 1, 5);
  const essence = Math.max(1, coreGu.energyCost + supports.reduce((a, i) => a + Math.ceil(GU_BY_ID[i.guId].energyCost * BALANCE.killerMoves.supportCostPct / 100), 0));
  const activation = clamp(
    BALANCE.killerMoves.baseActivation + (lvl - 1) * BALANCE.killerMoves.actPerMastery + grade.pct + activationBonus + BALANCE.killerMoves.actPerSupport * supports.length,
    BALANCE.killerMoves.activationMin, BALANCE.killerMoves.activationMax);
  const cooldown = Math.max(2, coreGu.cooldown || 2);
  const gu = pseudoOf(state, move, { fx, essence, cooldown, coreGu });
  // live component condition scales the whole technique (hunger, injury, strain)
  const condMul = guCondition(state, coreInst).effMul
    * (supports.length ? supports.reduce((a, i) => a + guCondition(state, i).effMul, 0) / supports.length : 1);
  return { gu, move, effMul: condMul, corePath: coreGu.path, baseActivation: activation };
}

// Battle activation roll: the compiled base + Focus, a broken foe's opening
// and repeat-use fatigue (same curve as killer-tier Gu).
export function kmActivationOf(combat, entry) {
  const cfg = BALANCE.combat.killerActivation;
  const uses = combat?.masteryUses?.[kmCdKey(entry.move)] || 0;
  const focus = (combat?.playerStatuses || []).filter(s => s.type === 'focus').reduce((a, s) => a + (s.power || 0), 0);
  const broken = (combat?.enemies || []).some(e => (e.statuses || []).some(s => s.type === 'broken')) ? (cfg.brokenBonus || 0) : 0;
  return clamp(entry.baseActivation + focus + broken - uses * cfg.repeatPenalty, cfg.min, cfg.max);
}

// ---- Research (#9, #11, #12, #30) ----
// One experiment per attempt: essence + stones spent, a visible chance, and a
// guaranteed defined outcome. Failure never destroys Gu — only strain and a
// short cooldown. Success creates the move and grants mastery.
export function researchKillerMove(state, coreId, supportIds, blueprintId) {
  const cfg = BALANCE.killerMoves;
  let s = { ...state, killerMoves: state.killerMoves || kmSeed() };
  const km = s.killerMoves;
  const core = (s.ownedGu || []).find(g => g.instanceId === coreId);
  if (!core) return { state, reason: T('km.errNoCore') };
  const coreGu = GU_BY_ID[core.guId];
  if (!canLead(coreGu)) return { state, reason: T('km.errNotLead') };
  const supports = (supportIds || []).map(id => (s.ownedGu || []).find(g => g.instanceId === id)).filter(Boolean);
  if (!supports.length) return { state, reason: T('km.errNeedSupport') };
  if (supports.length !== (supportIds || []).length) return { state, reason: T('km.errNoCore') };
  const now = totalGameMin(s.time);
  if ((km.cdUntil || 0) > now) return { state, reason: T('km.errCooldown', { n: Math.ceil(km.cdUntil - now) }) };
  const bp = blueprintId && km.blueprints.includes(blueprintId) ? BLUEPRINT_BY_ID[blueprintId] : null;
  if (blueprintId && !bp) return { state, reason: T('km.errBpMismatch') };
  const supportGus = supports.map(i => GU_BY_ID[i.guId]);
  if (bp && !blueprintMatches(bp, coreGu, supportGus)) return { state, reason: T('km.errBpMismatch') };
  const pv = kmPreview(s, core, supports, bp);
  if (!pv.ok) return { state, reason: T(pv.reasonKey, pv.reasonParams) };
  const p = s.player;
  if (p.primevalEssence < pv.researchCost.essence) return { state, reason: T('km.errEssence', { n: pv.researchCost.essence }) };
  if (p.spiritStones < pv.researchCost.stones) return { state, reason: T('km.errStones', { n: pv.researchCost.stones }) };

  // pay the research cost
  s = applyEffects(s, { essence: -pv.researchCost.essence, spiritStones: -pv.researchCost.stones });
  const day = s.time?.day || 1;
  const allIds = [coreId, ...supports.map(i => i.instanceId)];

  if (Math.random() * 100 < pv.chance) {
    const move = { id: `km_${Date.now().toString(36)}`, coreId, supportIds: [...supportIds], blueprintId: bp?.id || null, createdDay: day };
    s = { ...s, killerMoves: { ...s.killerMoves, known: [...s.killerMoves.known, move] } };
    // the pattern is recorded as a blueprint — discovering it the hard way (#8)
    let learnedBp = null;
    for (const b of KM_BLUEPRINTS) {
      if (s.killerMoves.blueprints.includes(b.id)) continue;
      if (blueprintMatches(b, coreGu, supportGus)) {
        s = { ...s, killerMoves: { ...s.killerMoves, blueprints: [...s.killerMoves.blueprints, b.id] } };
        learnedBp = b.id;
      }
    }
    const name = kmNameOf(s, move);
    s = grantMastery(s, coreGu.path, BALANCE.mastery.xpRecipeDiscovery, 'researched', 'study');
    s = grantMastery(s, 'refinement', Math.round(BALANCE.mastery.xpRecipeDiscovery * 0.6), 'researched', 'study');
    s = pushToast(s, {
      icon: '⚡', title: T('km.toast.discovered'),
      lines: [
        name,
        T('km.discovered.line', { dmg: `${pv.dmg.min}–${pv.dmg.max}`, essence: pv.essence, act: pv.activation }),
        T('km.components') + ': ' + [locGuName(coreGu), ...supportGus.map(locGuName)].join(' + '),
      ],
    });
    s = { ...s, log: [...s.log, T('km.log.discovered', { name, dmg: `${pv.dmg.min}–${pv.dmg.max}`, essence: pv.essence, act: pv.activation })
      + (learnedBp ? ' ' + T('km.log.learnedBp', { name: T(`km.bpName.${learnedBp}`) }) : '')] };
    return { state: s, ok: true, move, pv, name };
  }

  // failure (#12, #30): essence and stones are lost, every component is
  // strained for a few days, and a short cooldown gates re-tries
  s = { ...s, ownedGu: s.ownedGu.map(g => allIds.includes(g.instanceId) ? { ...g, strainUntilDay: day + cfg.strainDays } : g) };
  s = { ...s, killerMoves: { ...s.killerMoves, cdUntil: now + cfg.retryCdMin } };
  s = pushToast(s, {
    icon: '💥', title: T('km.toast.failed'),
    lines: [
      T('km.failed.essence', { n: pv.researchCost.essence }),
      T('km.failed.strain', { n: cfg.strainDays }),
      T('km.failed.retry', { n: Math.ceil(cfg.retryCdMin) }),
    ],
  });
  s = { ...s, log: [...s.log, T('km.log.failed', { essence: pv.researchCost.essence, n: cfg.strainDays, chance: pv.chance })] };
  return { state: s, ok: false, pv };
}