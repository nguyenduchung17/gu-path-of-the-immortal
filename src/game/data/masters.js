import { questDone } from '../engine/questEngine';
import { T, TL, locPathName } from '../i18n/tr';
import { PATH_BY_ID } from './paths';

// Advanced mentor / master NPCs. They are rare, found through exploration
// (no quest markers — a proximity reveal only), and will NOT teach you at
// first meeting: each has a progression of steps with different requirements
// (mastery, aptitude, realm, quests, trial duels, rare materials) and
// teachings — new Dao Paths, Gu recipes, Killer Move Gu. npcs.js appends
// these to the NPC roster; world.js places and protects them.

export const MASTER_STAGES = [
  { id: 0, key: 'master.st0' },
  { id: 1, key: 'master.st1' },
  { id: 2, key: 'master.st2' },
  { id: 3, key: 'master.st3' },
  { id: 4, key: 'master.st4' },
];

// Trial duel opponents (not world enemies — only fought in a master's trial).
export const TRIAL_DEFS = {
  masterJian: { id: 'trial_jian', name: 'Master Jian', hp: 70, attack: 12, defense: 5, speed: 9, abilities: [], weakness: 'none', drops: [], description: 'A hidden sword cultivator of terrifying precision.' },
  hermitSpring: { id: 'trial_hound', name: 'Spring Hound', hp: 45, attack: 9, defense: 3, speed: 7, abilities: [], weakness: 'none', drops: [], description: 'The hermit\u2019s tamed hound, eager to play.' },
  drunkenFang: { id: 'trial_fang', name: 'Old Drunken Fang', hp: 60, attack: 10, defense: 4, speed: 6, abilities: [], weakness: 'none', drops: [], description: 'A wandering fist master, drunk and unbeatable.' },
};

export const MASTERS = [
  {
    id: 'masterJian', name: 'Master Jian', role: 'swordCultivator', mentor: true, hidden: true,
    x: 23, y: 24, discoverRadius: 3,
    sense: 'By the waterfall sits an old man with a rusted sword. You feel watched by something sharper than eyes.',
    greeting: 'The old man does not look up. "You lack discipline. Walk far enough to earn your steps, then return."',
    look: { body: 'male', hair: 'long', hairColor: '#d8dce8', skin: '#c99767', eyes: '#7fd8e8', outfit: 'martial', outfitPrimary: '#2a3a5a', outfitSecondary: '#c9d4e8', accessory: 'headband' },
    aura: '140,180,255',
    steps: [
      { kind: 'req', text: '"You lack discipline." Master Jian will not teach an undisciplined cultivator. Reach Mastery Level 2 on any Dao Path first.',
        req: { anyMastery: 2 },
        grants: { unlockPath: 'sword', message: 'Master Jian opens one eye. "Hm. You have begun. The Sword Path — I will show you its threshold."' } },
      { kind: 'quest', questId: 'q_jian_fragment', text: '"A blade of mine broke long ago. The Bandit Chief of the northeast camp wears its fragment as a trophy. Bring it to me."' },
      { kind: 'quest', questId: 'q_jian_beasts', text: '"Stone beasts crushed my old training ground in the wild forest. Cull two of them, and we will speak of flying steel."' },
      { kind: 'duel', text: '"I will teach you only if you survive three of my strikes." A trial duel — stay standing for 3 turns.',
        trial: { type: 'survive', turns: 3, def: TRIAL_DEFS.masterJian, intro: 'Master Jian rises, sword bare. "Three strikes. Endure them."' },
        grants: { recipes: ['flyingSword'], message: '"Enough. Take this recipe — refine your own flying sword."' } },
      { kind: 'quest', questId: 'q_jian_forge', text: '"One last lesson — the Sword Rain. Bring me 2 Wind Crystals to temper the teaching."' },
    ],
  },
  {
    id: 'hermitSpring', name: 'Hermit of the Spring', role: 'beastTamer', mentor: true, hidden: true,
    x: 13, y: 25, discoverRadius: 3,
    sense: 'By the spirit spring, a wild-haired hermit hums to a dozing hound. The air thrums with beast-qi.',
    greeting: 'The hermit tilts his head. "Your aperture sings quietly. If it can hold a beast\u2019s will, sit with me."',
    look: { body: 'male', hair: 'spiky', hairColor: '#5a4a2a', skin: '#a8785a', eyes: '#6fae4f', outfit: 'robe', outfitPrimary: '#4a6b3a', outfitSecondary: '#8a6a43', accessory: 'scarf' },
    aura: '110,220,140',
    steps: [
      { kind: 'req', text: 'The hermit only teaches cultivators whose aptitude can hold a beast pact — Aptitude score 6 or better.',
        req: { aptitude: 6 },
        grants: { message: 'The hermit studies your breathing. "Your aperture is not wasted on beasts. Sit."' } },
      { kind: 'quest', questId: 'q_hermit_gift', text: '"Bring me 2 Moon Petals — the spring itself grows them. A gift opens a pact."' },
      { kind: 'duel', text: '"My hound wants to play. Show it your fangs — land 15 damage within four turns."',
        trial: { type: 'damage', amount: 15, turns: 4, def: TRIAL_DEFS.hermitSpring, intro: 'The hound stretches, all teeth. "Play nicely," the hermit says.' },
        grants: { giveGu: 'serpentSwarm', message: '"Your will bites deep. Take my swarm pact — the Serpent Swarm Gu answers you now."' } },
    ],
  },
  {
    id: 'drunkenFang', name: 'Old Drunken Fang', role: 'fistMaster', mentor: true, hidden: true,
    x: 56, y: 17, discoverRadius: 3,
    hours: { open: 18 * 60, close: 4 * 60 }, // found only at night, in the copper hills
    sense: 'Under the pines sprawls a wine-drunk old cultivator, snoring at the sky — yet his essence roils like a storm.',
    greeting: 'The drunkard waves his gourd. "Come back when your bones can carry a real rank, pup!"',
    look: { body: 'male', hair: 'topknot', hairColor: '#3a2a18', skin: '#d9a878', eyes: '#3a2a18', outfit: 'tunic', outfitPrimary: '#7a3a5a', outfitSecondary: '#d9b45b', accessory: 'belt' },
    aura: '252,180,90',
    steps: [
      { kind: 'req', text: 'Old Fang only spars with cultivators who have broken through — reach Rank 2 (global stage 4).',
        req: { stage: 4 },
        grants: { message: '"A Rank 2 pup, drunk on essence! Good. Show this old drunk your stance."' } },
      { kind: 'duel', text: '"Land 20 damage\u2019s worth within four turns — no healing wine!" A drinking trial of fists.',
        trial: { type: 'damage', amount: 20, turns: 4, def: TRIAL_DEFS.drunkenFang, intro: 'The drunkard wobbles upright, fists loose. "Come, then!"' },
        grants: { giveGu: 'tempestGu', message: '"Hahaha! Good fists. Take my old Tempest Gu — it suits your wind."' } },
      { kind: 'quest', questId: 'q_fang_etch', text: '"Scatter those cursed crows off the hills — 3 of them — and I\u2019ll etch my last diagram for you."' },
    ],
  },
  {
    id: 'elderMo', name: 'Elder Mo', role: 'refiner', mentor: true, hidden: false,
    x: 46, y: 42, discoverRadius: 4,
    sense: 'A stern old cultivator tends a hissing refinement furnace by the Gu district.',
    greeting: 'Elder Mo does not look up from the furnace. "Refiners are made, not born. Show me hands that have actually refined."',
    look: { body: 'male', hair: 'bun', hairColor: '#e8e4d8', skin: '#c99767', eyes: '#e8a03a', outfit: 'robe', outfitPrimary: '#556077', outfitSecondary: '#e8a03a', accessory: 'shoulderCloth' },
    steps: [
      { kind: 'req', text: 'Elder Mo teaches only those with Refinement Path Mastery Level 2.',
        req: { mastery: { path: 'refinement', level: 2 } },
        grants: { recipes: ['insightEye'], message: '"Hmph. Acceptable waste ratios. Take my Insight Eye recipe — see what you refine before you refine it."' } },
      { kind: 'quest', questId: 'q_mo_ores', text: '"Bring me 3 Iron Ore from the hills. A refiner\u2019s student stocks the furnace himself."' },
      { kind: 'quest', questId: 'q_mo_core', text: '"A mutated beast in the deep forest carries a corrupted core. Fetch it — carefully."' },
    ],
  },
];

export const MASTER_BY_ID = Object.fromEntries(MASTERS.map(m => [m.id, m]));

// Requirement checklists (✓/✗ per line) for the mentor UI.
export function reqChecks(state, req = {}) {
  const p = state.player;
  const checks = [];
  if (req.anyMastery) {
    const lvls = Object.values(state.mastery || {}).map(m => m.level || 1);
    const max = lvls.length ? Math.max(...lvls) : 1;
    checks.push({ met: max >= req.anyMastery, text: `Any Dao Path at Mastery Level ${req.anyMastery} (yours: ${max})` });
  }
  if (req.mastery) {
    const lvl = state.mastery?.[req.mastery.path]?.level || 1;
    checks.push({ met: lvl >= req.mastery.level, text: `${req.mastery.path[0].toUpperCase() + req.mastery.path.slice(1)} Mastery Level ${req.mastery.level} (yours: ${lvl})` });
  }
  if (req.aptitude) {
    const sc = p.aptitude?.score ?? 5;
    checks.push({ met: sc >= req.aptitude, text: `Cultivation Aptitude ≥ ${req.aptitude} (yours: ${sc})` });
  }
  if (req.stage) {
    const g = p.rank * 4 + (p.stage || 0);
    checks.push({ met: g >= req.stage, text: `Reach Rank ${Math.floor(req.stage / 4) + 1} cultivation (global stage ${req.stage}; yours: ${g})` });
  }
  return { ok: checks.every(c => c.met), checks };
}

// Relationship stage index for a master, given its state slice.
export function masterStageOf(m, ms) {
  if (!ms?.found) return 0;
  return Math.min(4, 1 + (ms.step || 0));
}

// Fast-forward quest steps that were completed elsewhere (quest turn-ins).
export function syncMasterSteps(state) {
  let masters = state.masters || {};
  let changed = false;
  for (const m of MASTERS) {
    const ms = masters[m.id];
    if (!ms?.found) continue;
    let step = ms.step || 0;
    while (step < m.steps.length && m.steps[step].kind === 'quest' && questDone(state, m.steps[step].questId)) step++;
    if (step !== (ms.step || 0)) { masters = { ...masters, [m.id]: { ...ms, step } }; changed = true; }
  }
  return changed ? { ...state, masters } : state;
}