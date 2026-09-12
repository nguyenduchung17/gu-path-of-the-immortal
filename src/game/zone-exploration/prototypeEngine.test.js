import assert from 'node:assert/strict';
import test from 'node:test';
import { createZoneExplorationState, currentZone, discoveredZones, engageEnemy, movePlayer, resolveCombat, visibleEntities } from './prototypeEngine.js';
import { ZONE_IDS } from './prototypeData.js';

test('zone prototype starts in Green Valley Village', () => {
  const state = createZoneExplorationState();
  assert.equal(state.zoneId, ZONE_IDS.VILLAGE);
  assert.equal(currentZone(state).safe, true);
  assert.ok(discoveredZones(state).find((zone) => zone.id === ZONE_IDS.VILLAGE).discovered);
});

test('player can transition from Village to Outskirts', () => {
  let state = createZoneExplorationState();
  for (let i = 0; i < 7; i += 1) state = movePlayer(state, 1, 0);
  assert.equal(state.zoneId, ZONE_IDS.OUTSKIRTS);
  assert.ok(state.discoveredZoneIds.includes(ZONE_IDS.OUTSKIRTS));
});

test('engaging and winning a visible enemy removes it from the zone session', () => {
  let state = createZoneExplorationState();
  state = {
    ...state,
    zoneId: ZONE_IDS.OUTSKIRTS,
    player: { x: 1, y: 3 },
    discoveredZoneIds: [ZONE_IDS.VILLAGE, ZONE_IDS.OUTSKIRTS],
  };
  assert.ok(visibleEntities(state).enemies.some((enemy) => enemy.id === 'jadeBanditA'));
  state = engageEnemy(state, 'jadeBanditA');
  assert.equal(state.mode, 'combat');
  state = resolveCombat(state, 'victory');
  assert.equal(state.mode, 'explore');
  assert.equal(visibleEntities(state).enemies.some((enemy) => enemy.id === 'jadeBanditA'), false);
});

test('fleeing keeps the enemy alive', () => {
  let state = createZoneExplorationState();
  state = { ...state, zoneId: ZONE_IDS.OUTSKIRTS };
  state = engageEnemy(state, 'jadeBanditA');
  state = resolveCombat(state, 'flee');
  assert.ok(visibleEntities(state).enemies.some((enemy) => enemy.id === 'jadeBanditA'));
});
