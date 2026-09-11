import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame } from './createGame.js';
import { gameReducer } from './gameReducer.js';
import { applyDeath } from '../engine/death.js';
import { validDeathRecord, withSaveIdentity } from './saveIdentity.js';
import { ESSENCE_REASON } from '../engine/essence.js';
import { BREAKTHROUGH_REQS } from '../data/cultivation.js';

const appearance = {
  body: 'average', hair: 'short', hairColor: '#111111', skin: '#d8a47f', eyes: 'calm',
  outfit: 'robes', outfitPrimary: '#315c43', outfitSecondary: '#c8a96b', accessory: 'none',
};
const aptitude = { score: 5, constitution: null };

function fresh(name, difficulty, slot = 1) {
  return createNewGame(name, 'other', 16, difficulty, slot, appearance, aptitude, 'windBlade');
}

test('reusing a slot creates an independent character identity', () => {
  const oldCharacter = fresh('Fang Yuan', 'trueCultivation', 1);
  const newCharacter = fresh('New Character', 'standard', 1);
  assert.notEqual(oldCharacter.characterId, newCharacter.characterId);
  assert.equal(newCharacter.status, 'ALIVE');
  assert.equal(newCharacter.deceased, null);
  assert.equal(newCharacter.difficulty, 'standard');
});

test('NEW_GAME replaces stale deceased runtime state', () => {
  const oldCharacter = fresh('Fang Yuan', 'trueCultivation', 1);
  const deceased = applyDeath(oldCharacter, {}, { ...oldCharacter.player, hp: 0 }, 'combat');
  const next = gameReducer(deceased, {
    type: 'NEW_GAME', name: 'New Character', gender: 'other', age: 16,
    difficulty: 'standard', slot: 1, appearance, aptitude, starterGuId: 'windBlade',
  });
  assert.equal(next.status, 'ALIVE');
  assert.equal(next.deceased, null);
  assert.equal(next.difficulty, 'standard');
  assert.notEqual(next.characterId, deceased.characterId);
});

test('permadeath record is scoped to the character that died', () => {
  const character = fresh('Fang Yuan', 'trueCultivation', 1);
  const deceased = applyDeath(character, {}, { ...character.player, hp: 0 }, 'combat');
  assert.equal(deceased.status, 'DECEASED');
  assert.equal(deceased.deceased.characterId, character.characterId);
  assert.equal(validDeathRecord(deceased), true);
});

test('a stale death record from another character is ignored', () => {
  const character = fresh('New Character', 'standard', 2);
  const repaired = withSaveIdentity({
    ...character,
    status: 'DECEASED',
    deceased: { characterId: 'char_deleted', cause: 'combat', at: { name: 'Fang Yuan' } },
  });
  assert.equal(repaired.status, 'ALIVE');
  assert.equal(repaired.deceased, null);
  assert.equal(validDeathRecord(repaired), false);
});

test('removed Secluded Cultivation action cannot change Essence or progress', () => {
  const character = fresh('Cultivator', 'standard', 1);
  const spent = { ...character, player: { ...character.player, primevalEssence: 20, cultivationProgress: 10 } };
  const next = gameReducer(spent, { type: 'SECLUDE' });
  assert.strictEqual(next, spent);
  assert.equal(next.player.primevalEssence, 20);
  assert.equal(next.player.cultivationProgress, 10);
});

test('sleeping at an inn restores HP but does not restore Essence', () => {
  const character = fresh('Traveller', 'standard', 1);
  const before = { ...character, player: { ...character.player, hp: 1, primevalEssence: 20, spiritStones: 999 } };
  const next = gameReducer(before, { type: 'SLEEP_INN', innId: 'townInn' });
  assert.equal(next.player.hp, next.player.maxHp);
  assert.equal(next.player.primevalEssence, 20);
  assert.deepEqual(next.player.essenceHistory, []);
});

test('Recover Essence is cancellable and preserves each recovered point', () => {
  const character = fresh('Recovering Cultivator', 'standard', 1);
  const spent = { ...character, player: { ...character.player, primevalEssence: 20 } };
  const started = gameReducer(spent, { type: 'START_RECOVERY', mode: 'normal' });
  const recovered = gameReducer(started, { type: 'RECOVERY_TICK', amount: 7 });
  const cancelled = gameReducer(recovered, { type: 'CANCEL_RECOVERY' });
  assert.equal(cancelled.recovery, null);
  assert.equal(cancelled.player.primevalEssence, 27);
  assert.equal(cancelled.player.essenceHistory.at(-1).reason, ESSENCE_REASON.ACTIVE_RECOVERY);
});

test('paid instant recovery costs exactly the configured missing-Essence price', () => {
  const character = fresh('Stone Cultivator', 'standard', 1);
  const before = { ...character, player: { ...character.player, primevalEssence: 20, spiritStones: 999 } };
  const missing = before.player.maxPrimevalEssence - before.player.primevalEssence;
  const next = gameReducer(before, { type: 'INSTANT_RECOVERY' });
  assert.equal(next.player.primevalEssence, next.player.maxPrimevalEssence);
  assert.equal(next.player.spiritStones, 999 - missing);
  assert.equal(next.player.essenceHistory.at(-1).reason, ESSENCE_REASON.PAID_RECOVERY);
});

test('minor breakthrough restores only the configured partial Essence amount', () => {
  const character = fresh('Minor Breakthrough', 'standard', 1);
  const ready = {
    ...character,
    player: {
      ...character.player,
      cultivationProgress: 100,
      realmInsight: 999,
      primevalEssence: BREAKTHROUGH_REQS[0].essence,
    },
  };
  const next = gameReducer(ready, { type: 'BREAKTHROUGH' });
  assert.equal(next.player.stage, 1);
  assert.ok(next.player.primevalEssence < next.player.maxPrimevalEssence);
  assert.equal(next.player.essenceHistory.at(-1).reason, ESSENCE_REASON.BREAKTHROUGH_RESTORE);
  assert.equal(next.player.essenceHistory.at(-1).source, 'minor');
});

test('major rank breakthrough may restore full Essence as an explicit special effect', () => {
  const character = fresh('Major Breakthrough', 'standard', 1);
  const ready = {
    ...character,
    player: { ...character.player, stage: 3, cultivationProgress: 100, realmInsight: 999, spiritStones: 999 },
    mastery: { wind: { level: 3, xp: 0 } },
    inventory: {
      ...character.inventory,
      materials: { ...character.inventory.materials, herb: 2, beastCore: 1 },
    },
  };
  const next = gameReducer(ready, { type: 'BREAKTHROUGH' });
  assert.equal(next.player.rank, 1);
  assert.equal(next.player.stage, 0);
  assert.equal(next.player.primevalEssence, next.player.maxPrimevalEssence);
  assert.equal(next.player.essenceHistory.at(-1).reason, ESSENCE_REASON.BREAKTHROUGH_RESTORE);
  assert.equal(next.player.essenceHistory.at(-1).source, 'major');
});

