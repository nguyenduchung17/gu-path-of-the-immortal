// Core translator — usable from BOTH React components (via useT in
// LangContext) and engine code (reducer, combat, exploration…). The language
// preference lives in localStorage ('gu_lang'), global to the app and never
// part of a character save.
//
//   T(key, params)              — a string defined ONLY in code/dictionary
//                                 (log lines, UI, toasts). Falls back en → key.
//   TL(key, fallback, params)  — a string whose English source lives in DATA
//                                 (Gu names, quest text…). Falls back to the
//                                 data value, and logs the missing vi key.
//
// A dev audit (auditLocalization) reports every missing key encountered.
import { DICT } from './translations';
import { DICT_LOG } from './log';
import { CONTENT_VI } from './content';
import { DICT_STARTER } from './starterDict';
import { DANGER_LABEL, visualOf } from '../data/enemies';
import { TERRAIN_LABELS } from '../data/terrain';

const STORAGE_KEY = 'gu_lang';

export const TABLES = {
  en: { ...DICT.en, ...DICT_LOG.en, ...DICT_STARTER.en },
  vi: { ...DICT.vi, ...DICT_LOG.vi, ...CONTENT_VI, ...DICT_STARTER.vi },
};

// Runtime registry of content keys missing a Vietnamese override.
const MISSING_VI = new Set();
const MISSING_EN = new Set();

export function browserLang() {
  try {
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nav.startsWith('vi') ? 'vi' : 'en';
  } catch { return 'en'; }
}

export function curLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && TABLES[v]) return v;
  } catch {}
  return browserLang();
}

function interpolate(s, params) {
  if (!params) return s;
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

// Dictionary-only lookup: en table is the canonical source, vi falls back to
// it. A missing vi entry is registered for the dev audit.
export function T(key, params) {
  const lang = curLang();
  const s = TABLES[lang]?.[key];
  if (s != null) return interpolate(s, params);
  const en = TABLES.en[key];
  if (en != null) {
    if (lang === 'vi') MISSING_VI.add(key);
    return interpolate(en, params);
  }
  return interpolate(key, params);
}

// Data-content lookup: the English source travels with the call (the value
// stored in the data file). vi override wins; missing vi is logged for audit.
export function TL(key, fallback, params) {
  const lang = curLang();
  const s = TABLES[lang]?.[key];
  if (s != null) return interpolate(s, params);
  if (lang === 'vi') MISSING_VI.add(key);
  if (fallback != null) return interpolate(fallback, params);
  return interpolate(key, params);
}

// ---- localized content accessors (data objects carry their ids) ----
export const locGuName = (gu) => TL(`gu.${gu.id}.name`, gu.name);
export const locGuDesc = (gu) => TL(`gu.${gu.id}.desc`, gu.description);
export const locGuTypeName = (type) => T(`guType.${type}`);
export const locItemName = (it) => TL(`item.${it.id}.name`, it.name);
export const locItemDesc = (it) => TL(`item.${it.id}.desc`, it.description);
export const locEnemyName = (def) => TL(`enemy.${def.id}.name`, def.name);
export const locEnemyDesc = (def) => TL(`enemy.${def.id}.desc`, def.description);
export const locEnemyRank = (defId) => TL(`enemyRank.${defId}`, visualOf(defId)?.rank || '');
export const locDanger = (n) => TL(`danger.${n}`, DANGER_LABEL[n] || '');
export const locSpeciesName = (sp) => TL(`species.${sp.id}.name`, sp.name);
export const locSpeciesSense = (sp) => TL(`species.${sp.id}.sense`, sp.sense);
export const locZoneName = (z) => TL(`zone.${z.id}.name`, z.name);
export const locRegionName = () => TL('region.name', 'Green Valley Region');
export const locLandmarkName = (lm) => TL(`lm.${lm.id}.name`, lm.name);
export const locHiddenPathName = (hp) => TL(`hp.${hp.id}.name`, hp.name);
export const locHazardName = (hz) => TL(`hazard.${hz.id}.name`, hz.name);
export const locInnName = (inn) => TL(`inn.${inn.id}.name`, inn.name);
// gathering nodes: a vi key when the node's own name differs from its item's
export const locResourceName = (node) => TL(`res.${node.id}.name`, node.name);
export const locQuestName = (q) => TL(`quest.${q.id}.name`, q.name);
export const locQuestDesc = (q) => TL(`quest.${q.id}.desc`, q.description);
export const locQuestHint = (q) => TL(`quest.${q.id}.hint`, q.hint);
export const locQuestRewardMsg = (q) => TL(`quest.${q.id}.reward`, q.rewards?.message || '');
export const locQuestChoice = (q, i) => TL(`quest.${q.id}.c${i}`, q.choices?.[i]?.label || '');
export const locQuestChoiceMsg = (q, i) => TL(`quest.${q.id}.m${i}`, q.choices?.[i]?.message || '');
export const locQuestObjLabel = (qid, o) => o.label ? TL(`quest.${qid}.${o.id}.label`, o.label) : null;
export const locNpcGreeting = (npc) => TL(`npc.${npc.id}.greeting`, npc.greeting);
export const locIntelName = (offer) => TL(`intel.${offer.id}.name`, offer.name);
export const locEventTitle = (ev) => TL(`event.${ev.id}.title`, ev.title);
export const locEventText = (ev) => TL(`event.${ev.id}.text`, ev.text);
export const locEventOption = (ev, i) => TL(`event.${ev.id}.opt${i}`, ev.options[i]?.label || '');
export const locEventMsg = (ev, i) => TL(`event.${ev.id}.msg${i}`, ev.options[i]?.effects?.message || '');
export const locMissionName = (m) => TL(`mission.${m.id}.name`, m.name);
export const locMissionDesc = (m) => TL(`mission.${m.id}.desc`, m.description);
export const locArenaName = (ch) => TL(`arena.${ch.id}.name`, ch.name);
export const locArenaRecRank = (ch) => TL(`arena.${ch.id}.recRank`, ch.recRank);
export const locArenaOpponentName = (ch) => TL(`arena.${ch.id}.opponent`, ch.opponent.name);
export const locArenaOpponentDesc = (ch) => TL(`arena.${ch.id}.desc`, ch.opponent.description);
export const locRecipeRumor = (r) => TL(`recipe.${r.id}.rumor`, r.rumor);
export const locRecipeClue = (r) => TL(`recipe.${r.id}.clue`, r.clue);
export const locRecipeLead = (r) => TL(`recipe.${r.id}.lead`, r.lead);
export const locContribName = (o) => TL(`contrib.${o.id}.name`, o.name);
export const locContribDesc = (o) => TL(`contrib.${o.id}.desc`, o.desc);
export const locPathName = (p) => TL(`path.${p.id}.name`, p.name);
export const locPathDesc = (p) => TL(`path.${p.id}.desc`, p.description);
export const locPathLevelText = (p, i) => TL(`path.${p.id}.lv${i}`, p.levels[i]?.text || '');
export const locSynergyName = (sy) => TL(`syn.${sy.id}.name`, sy.name);
export const locSynergyDesc = (sy) => TL(`syn.${sy.id}.desc`, sy.desc);
export const locTerrainLabel = (zoneId) => TL(`terrain.${zoneId}`, TERRAIN_LABELS[zoneId] || '');
export const locStatusName = (type) => TL(`status.${type}`, type);
export const locPhaseLabel = (phase) => T(`phase.${phase}`);
export const locChargeName = (def) => TL(`charge.${def.id}`, def.charge?.name || T('cmt.savage'));

// Cultivation stage — 'Nhất Chuyển · Sơ Giai' in Vietnamese, the data name in
// English.
export function locStageName(stage) {
  if (!stage) return '';
  if (curLang() === 'vi') {
    return `${T(`cult.rank${stage.rank}`)} · ${T(`cult.stage${stage.stage}`)}`;
  }
  return stage.name;
}
export function locStageShort(stage) {
  if (!stage) return '';
  if (curLang() === 'vi') {
    return `${T(`cult.rank${stage.rank}`)} ${T(`cult.short${stage.stage}`)}`;
  }
  return stage.short;
}

// ---- Development-only audit (#36) ----
// Reports: content keys missing a Vietnamese override (encountered at
// runtime), and dictionary keys defined in en but missing in vi (and vice
// versa). Call window.__locAudit() from the browser console.
export function auditLocalization() {
  const viKeys = Object.keys(TABLES.vi);
  const enKeys = Object.keys(TABLES.en);
  const enMissingVi = enKeys.filter((k) => !(k in TABLES.vi));
  const viMissingEn = viKeys.filter((k) => !(k in TABLES.en));
  const report = {
    totalKeys: { en: enKeys.length, vi: viKeys.length },
    runtimeMissingVi: [...MISSING_VI].sort(),
    runtimeMissingEn: [...MISSING_EN].sort(),
    dictMissingVi: enMissingVi,
    dictMissingEn: viMissingEn,
  };
  console.table(report.runtimeMissingVi.map((k) => ({ key: k, vi: 'MISSING' })));
  console.table(enMissingVi.map((k) => ({ key: k, en: TABLES.en[k], vi: 'MISSING' })));
  console.table(viMissingEn.map((k) => ({ key: k, vi: TABLES.vi[k], en: 'MISSING' })));
  console.log(`Localization audit — en:${enKeys.length} vi:${viKeys.length} · missing vi:${report.runtimeMissingVi.length} runtime / ${enMissingVi.length} dict`);
  return report;
}
try {
  if (typeof window !== 'undefined') window.__locAudit = auditLocalization;
} catch {}