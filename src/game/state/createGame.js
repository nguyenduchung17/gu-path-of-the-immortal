// Fresh-save construction — one place that knows the shape of a new
// character. Extracted from gameReducer so both stay focused.
import { GU_BY_ID } from '../data/gu';
import { NPC_BY_ID } from '../data/npcs';
import { PATH_BY_ID } from '../data/paths';
import { CULTIVATION_STAGES } from '../data/cultivation';
import { BALANCE, DIFFICULTIES } from '../config/balance';
import { essenceCapFor, normalizeAptitude, rollAptitudeScore, rollConstitution } from '../config/aptitude';
import { starterGuOf } from '../data/starterGu';
import { syncVitality } from '../engine/strength';
import { initialWildGu } from '../data/wildGu';
import { foodOf } from '../engine/guLife';
import { emptyQuests } from '../engine/questEngine';
import { seedFog } from '../engine/guLife';
import { initialEnemies } from '../data/world';
import { DEFAULT_APPEARANCE } from '../data/appearance';
import { kmSeed } from '../engine/killerMoves';
import { T, locPathName, locGuName } from '../i18n/tr';
import { newCharacterId } from './saveIdentity';

const START_STAGE = CULTIVATION_STAGES[0];

export function globalStage(p) { return p.rank * 4 + (p.stage || 0); }

export function createNewGame(name, gender, age, difficulty, slot, appearance, aptitude, starterGuId, creationSessionId, characterId) {
  const starter = starterGuOf(starterGuId);
  const apt = normalizeAptitude(
    aptitude && typeof aptitude.score === 'number' ? aptitude : { score: rollAptitudeScore(), constitution: rollConstitution() }
  );
  const essenceCap = essenceCapFor(START_STAGE.maxEssence, apt);
  const starterFood = foodOf(starter);
  const fresh = {
    version: 19,
    difficulty: DIFFICULTIES[difficulty] ? difficulty : 'standard',
    slot: slot || 1,
    slotId: slot || 1,
    characterId: characterId || newCharacterId(),
    creationSessionId: creationSessionId || null,
    status: 'ALIVE',
    time: { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes },
    playtimeSec: 0,
    deceased: null,
    sleeping: null,
    player: {
      name: name || 'Nameless', gender: gender || 'other', age: Number(age) || 16,
      rank: 0, stage: 0, cultivationProgress: 0,
      aptitude: apt,
      hp: START_STAGE.maxHp, maxHp: START_STAGE.maxHp,
      primevalEssence: essenceCap, maxPrimevalEssence: essenceCap,
      essenceHistory: [],
      willpower: 10,
      strength: 6, agility: 6, perception: 6, intelligence: 6, luck: 6,
      x: 42, y: 44, currentArea: 'greenValleyRegion', facing: 'down',
      spiritStones: 50, equippedGu: ['g_start'], totalInsight: 0, vitalInstability: null,
      realmInsight: 0, cultStreak: 0,
      appearance: appearance || DEFAULT_APPEARANCE,
    },
    ownedGu: [{ instanceId: 'g_start', guId: starter.id, rank: starter.rank }],
    inventory: { materials: { herb: 3 }, medicine: { medicine: 1 }, food: { ration: 2 }, guFood: starterFood ? { [starterFood]: 2 } : {}, guGear: { sealingJar: 1 }, questItems: {} },
    settings: { autoFeed: false },
    // Staged tutorial — every fresh character is offered the welcome screen and
    // guided lessons (old saves get the same shape from migration v13).
    tutorial: { welcome: true, active: false, completed: false, skipped: false, step: 0, moves: 0, tipsSeen: {} },
    vitalGu: null,
    vitalSwitchDay: -99,
    quests: emptyQuests(),
    reputation: { villagers: 0, merchants: 0, sect: 0, blackMarket: 0 },
    worldState: {
      gathered: {},
      discovered: { zones: { greenValleyTown: true }, landmarks: { townGate: true, teleportFormation: true }, inns: { townInn: true }, paths: {} },
      enemies: initialEnemies(),
      wildGu: initialWildGu(),
      fog: seedFog(42, 44, 6),
    },
    mastery: {}, masteryStats: {},
    knownPaths: [starter.path], knownRecipes: [], recipeKnowledge: {},
    contribution: { greenValley: 0 },
    masters: {},
    bestiary: {},
    missions: { active: [], completed: [] },
    arena: { wins: 0, losses: 0 },
    killerMoves: kmSeed(),
    recovery: null, breakthrough: null, toasts: [],
    combat: null, pendingEvent: null, dialogue: null,
    log: [
      T('wld.intro1', { stage: `${T('cult.rank0')} · ${T('cult.stage0')}`, path: locPathName(PATH_BY_ID[starter.path]) }),
      T('wld.intro2', { gu: locGuName(starter) }),
    ],
    createdAt: Date.now(),
  };
  // STRENGTH PATH (Lực Đạo): a strength starter enjoys the level-1 vitality
  // bonus from its first breath; other cultivators gain it when they learn it
  return { ...fresh, player: syncVitality(fresh.player, starter.path === 'strength' ? 1 : 0) };
}
