// Dao/Path mastery engine: XP grants, level-ups, recipes, path discovery.
import { PATH_BY_ID } from '../data/paths';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { GU_BY_ID } from '../data/gu';
import { BALANCE } from '../config/balance';

export function masteryOf(state, pathId) {
  return state.mastery?.[pathId] || { level: 1, xp: 0 };
}

export function masteryThreshold(level) { // cumulative xp needed to REACH `level`
  const t = BALANCE.mastery.tiers;
  let sum = 0;
  for (let i = 0; i < level - 1 && i < t.length; i++) sum += t[i].xp;
  return sum;
}

export function masteryTitle(level) {
  return BALANCE.mastery.tiers[Math.min(Math.max(level, 1), 5) - 1].title;
}

// Merged bonus effects for a path at its current mastery level.
export function bonusOf(state, pathId) {
  const def = PATH_BY_ID[pathId];
  const level = masteryOf(state, pathId).level;
  const fx = {};
  if (!def) return fx;
  for (let i = 0; i < Math.min(level, def.levels.length); i++) {
    for (const [k, v] of Object.entries(def.levels[i].fx || {})) fx[k] = (fx[k] || 0) + v;
  }
  return fx;
}

let _tid = 0;
function pushToast(state, t) {
  return { ...state, toasts: [...(state.toasts || []), { id: `${Date.now()}-${_tid++}`, ...t }] };
}

// Mastery represents actual practice. It may ONLY be granted for the player's
// own meaningful action — using a Gu / Killer Move, refining, studying Path
// knowledge, a trial, a mentor's teaching, or a path challenge. The `via`
// argument must name that source; grants without a valid source are ignored,
// so weather, environment, enemy actions, regions and generic fleeing can
// never leak mastery in.
export const MASTERY_SOURCES = ['guUse', 'refine', 'study', 'trial', 'mentor', 'challenge'];

export function grantMastery(state, pathId, xp, statKey = null, via = null) {
  const def = PATH_BY_ID[pathId];
  if (!def || !MASTERY_SOURCES.includes(via)) return state;
  const cur = masteryOf(state, pathId);
  const next = { level: cur.level, xp: cur.xp + xp };
  let s = { ...state, mastery: { ...(state.mastery || {}), [pathId]: next } };
  if (statKey) {
    const ms = { ...(s.masteryStats || {}) };
    ms[pathId] = { ...(ms[pathId] || {}), [statKey]: (ms[pathId]?.[statKey] || 0) + 1 };
    s.masteryStats = ms;
  }
  // level-ups (with recipe milestones)
  let leveledTo = null;
  while (next.level < 5 && next.xp >= masteryThreshold(next.level + 1)) { next.level++; leveledTo = next.level; }
  if (leveledTo) {
    s.mastery = { ...s.mastery, [pathId]: { ...next } };
    const lines = [def.levels[leveledTo - 1].text];
    for (const r of RECIPES.filter(r => r.path === pathId && r.milestoneLevel === leveledTo)) {
      if (!s.knownRecipes.includes(r.id)) {
        s = learnRecipe(s, r.id, true);
        lines.push(`Unlocked: ${GU_BY_ID[r.guId]?.name || r.guId} recipe`);
      }
    }
    s = pushToast(s, { kind: 'pathLevel', icon: def.icon, title: `${def.name} — Level ${leveledTo}`, lines: [masteryTitle(leveledTo), ...lines] });
    s = { ...s, log: [...(s.log || []), `${def.name} reaches Level ${leveledTo} — ${masteryTitle(leveledTo)}.`] };
  }
  return s;
}

export function discoverPath(state, pathId) {
  if (!PATH_BY_ID[pathId] || (state.knownPaths || []).includes(pathId)) return state;
  const def = PATH_BY_ID[pathId];
  let s = { ...state, knownPaths: [...(state.knownPaths || []), pathId] };
  s = pushToast(s, { kind: 'path', icon: def.icon, title: `Path Discovered: ${def.name}`, lines: [def.description] });
  return { ...s, log: [...(s.log || []), `You discover the ${def.name}.`] };
}

export function learnRecipe(state, recipeId, silent = false) {
  const r = RECIPE_BY_ID[recipeId];
  if (!r || (state.knownRecipes || []).includes(recipeId)) return state;
  let s = { ...state, knownRecipes: [...(state.knownRecipes || []), recipeId] };
  s = discoverPath(s, r.path);
  s = grantMastery(s, 'refinement', BALANCE.mastery.xpRecipeDiscovery, 'recipes', 'study');
  s = { ...s, log: [...(s.log || []), `Recipe learned: ${GU_BY_ID[r.guId]?.name || recipeId}.`] };
  if (!silent) {
    s = pushToast(s, { kind: 'recipe', icon: '📖', title: `New Recipe: ${GU_BY_ID[r.guId]?.name}`, lines: [`${PATH_BY_ID[r.path].name} · requires mastery level ${r.masteryReq}`] });
  }
  return s;
}

// ---- Recipe knowledge journal ----
// Undiscovered recipes display ONLY what the character has actually heard.
// Clues only ever rise through the tiers: rumored → identified → located.
export const CLUE_RANK = { rumored: 1, identified: 2, located: 3 };

export function learnClue(state, recipeId, level) {
  const r = RECIPE_BY_ID[recipeId];
  if (!r || (state.knownRecipes || []).includes(recipeId)) return state;
  const cur = state.recipeKnowledge?.[recipeId];
  if ((CLUE_RANK[level] || 0) <= (cur ? CLUE_RANK[cur] || 0 : 0)) return state;
  let s = { ...state, recipeKnowledge: { ...(state.recipeKnowledge || {}), [recipeId]: level } };
  const text = level === 'located' ? r.lead : level === 'identified' ? r.clue : r.rumor;
  const headline = level === 'located'
    ? `Recipe located: ${GU_BY_ID[r.guId]?.name || '???'}`
    : level === 'identified' ? `Recipe identified: ${GU_BY_ID[r.guId]?.name || '???'}` : 'A new recipe rumor reaches your ears.';
  s = pushToast(s, { icon: '🔍', title: 'NEW CLUE DISCOVERED', lines: [headline, text] });
  return { ...s, log: [...(s.log || []), `Clue gained — ${headline}: ${text}`] };
}