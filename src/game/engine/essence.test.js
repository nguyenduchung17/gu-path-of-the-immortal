import test from 'node:test';
import assert from 'node:assert/strict';
import { changeEssence, ESSENCE_REASON } from './essence.js';

const player = (current = 20, max = 79) => ({ primevalEssence: current, maxPrimevalEssence: max, essenceHistory: [] });

test('Essence changes require an explicit valid reason', () => {
  assert.throws(() => changeEssence(player(), { delta: 5 }), /invalid or missing reason/);
  assert.throws(() => changeEssence(player(), { delta: 5, reason: 'FREE_REFILL' }), /invalid or missing reason/);
});

test('Essence transactions accept exactly one operation', () => {
  assert.throws(() => changeEssence(player(), { reason: ESSENCE_REASON.ITEM }), /exactly one/);
  assert.throws(() => changeEssence(player(), { delta: 1, setTo: 30, reason: ESSENCE_REASON.ITEM }), /exactly one/);
});

test('Essence gain and spending clamp to the aperture bounds', () => {
  const full = changeEssence(player(70), { delta: 20, reason: ESSENCE_REASON.ITEM, source: 'essencePill' });
  assert.equal(full.primevalEssence, 79);
  assert.deepEqual(full.essenceHistory[0], {
    reason: ESSENCE_REASON.ITEM, before: 70, after: 79, delta: 9,
    at: full.essenceHistory[0].at, source: 'essencePill',
  });

  const empty = changeEssence(player(5), { delta: -20, reason: ESSENCE_REASON.GU_COST });
  assert.equal(empty.primevalEssence, 0);
  assert.equal(empty.essenceHistory[0].delta, -5);
});

test('Essence audit history is capped to the most recent 80 changes', () => {
  let p = player(0, 1000);
  for (let i = 0; i < 90; i += 1) {
    p = changeEssence(p, { delta: 1, reason: ESSENCE_REASON.ACTIVE_RECOVERY, source: String(i) });
  }
  assert.equal(p.essenceHistory.length, 80);
  assert.equal(p.essenceHistory[0].source, '10');
  assert.equal(p.essenceHistory[79].source, '89');
});

