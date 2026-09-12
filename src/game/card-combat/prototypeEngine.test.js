import assert from 'node:assert/strict';
import test from 'node:test';
import { CARD_PATHS, DECK_LIMITS, GU_CARDS, KILLER_MOVE_CARDS, PATH_IDENTITIES } from './prototypeData.js';
import {
  buildPrototypeDeck,
  createCardCombatState,
  endPlayerTurn,
  getCurrentEnemies,
  getPlayableCost,
  playCard,
  predictIncomingDamage,
} from './prototypeEngine.js';

const ALL_GU = GU_CARDS.map((card) => card.guId);

test('Path Identities include every prototype Gu and Killer Move path', () => {
  const identityPaths = new Set(PATH_IDENTITIES.map((item) => item.path));
  const cardPaths = new Set([...GU_CARDS, ...KILLER_MOVE_CARDS].map((card) => card.path));
  for (const path of cardPaths) {
    assert.ok(identityPaths.has(path), `Missing Path Identity for ${path}`);
  }
  assert.ok(identityPaths.has(CARD_PATHS.CLOUD), 'Cloud Path should be visible');
  assert.ok(identityPaths.has(CARD_PATHS.LIGHTNING), 'Lightning Path should be visible');
  assert.ok(identityPaths.has(CARD_PATHS.ICE), 'Ice Path should be visible');
  assert.ok(identityPaths.has(CARD_PATHS.SWORD), 'Sword Path should be visible');
  assert.ok(identityPaths.has(CARD_PATHS.BLOOD), 'Blood Path should be visible');
});

function cardIn(state, id, zone = 'hand') {
  return state[zone].find((card) => card.id === id);
}

function cardAnywhere(state, id) {
  return [...state.hand, ...state.drawPile, ...state.discardPile, ...state.exhaustPile, ...state.deck].find((card) => card.id === id);
}

function forceHand(state, cardIds) {
  const hand = cardIds.map((id, index) => {
    const card = cardAnywhere(state, id);
    assert.ok(card, `Expected card ${id} to exist in prototype deck`);
    return { ...card, instanceId: `${id}_forced_${index}` };
  });
  return {
    ...state,
    hand,
    drawPile: state.drawPile.filter((card) => !cardIds.includes(card.id)),
  };
}

test('starter cards draw into opening hand and spend AP without random miss', () => {
  const state = createCardCombatState();
  assert.equal(state.hand.length, 5);
  const strike = cardIn(state, 'strike');
  const beforeHp = state.enemies[0].hp;
  const next = playCard(state, strike.instanceId, state.enemies[0].id);
  assert.equal(next.ap, 2);
  assert.ok(next.enemies[0].hp < beforeHp);
  assert.equal(next.player.essence, state.player.essence);
});

test('Guard gains Armor and remaining non-Retain cards discard on end turn', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['guard', 'strike', 'focusBreath']);
  const guard = cardIn(state, 'guard');
  state = playCard(state, guard.instanceId, state.enemies[0].id);
  assert.equal(state.player.armor, 6);
  state = endPlayerTurn(state);
  assert.equal(state.phase, 'player');
  assert.ok(state.discardPile.some((card) => card.id === 'strike'));
});

test('Killer Move replaces bound component Gu cards', () => {
  const deck = buildPrototypeDeck({
    equippedGu: GU_CARDS.map((card) => card.guId),
    equippedKillerMoves: ['thunderGaleFang'],
    relics: [],
  });
  assert.ok(deck.some((card) => card.id === 'thunderGaleFang'));
  for (const guId of KILLER_MOVE_CARDS.find((card) => card.id === 'thunderGaleFang').boundGu) {
    assert.equal(deck.some((card) => card.guId === guId), false);
  }
});

test('Scorch is consumed by the next Fire attack for bonus damage', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['emberFangGu', 'emberFangGu']);
  const targetId = state.enemies[0].id;
  state = playCard(state, state.hand[0].instanceId, targetId);
  assert.equal(state.enemies[0].statuses.scorch.stacks, 2);
  const before = state.enemies[0].hp;
  state = playCard(state, state.hand.find((card) => card.id === 'emberFangGu').instanceId, targetId);
  assert.ok(state.enemies[0].hp <= before - 13);
  assert.equal(state.enemies[0].statuses.scorch.stacks, 3);
  assert.ok(state.log.some((entry) => entry.key === 'card.log.scorchBurst'));
});

test('Scorch loses one stack at end of turn instead of lasting unchanged', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['emberFangGu']);
  state = playCard(state, cardIn(state, 'emberFangGu').instanceId, state.enemies[0].id);
  assert.equal(state.enemies[0].statuses.scorch.stacks, 2);
  state = endPlayerTurn(state);
  assert.equal(state.enemies[0].statuses.scorch.stacks, 1);
});

test('Poison stacks and deals end-of-turn damage', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['poisonNeedleGu', 'poisonNeedleGu']);
  const targetId = state.enemies[0].id;
  state = playCard(state, state.hand[0].instanceId, targetId);
  state = playCard(state, state.hand.find((card) => card.id === 'poisonNeedleGu').instanceId, targetId);
  assert.equal(state.enemies[0].statuses.poison.stacks, 12);
  const before = state.enemies[0].hp;
  state = endPlayerTurn(state);
  assert.ok(state.enemies[0].hp <= before - 12);
  assert.equal(state.enemies[0].statuses.poison.stacks, 6);
});

test('Fortify increases later Defense Armor gain', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['stoneShellGu', 'guard']);
  const targetId = state.enemies[0].id;
  state = playCard(state, cardIn(state, 'stoneShellGu').instanceId, targetId);
  const beforeArmor = state.player.armor;
  state = playCard(state, cardIn(state, 'guard').instanceId, targetId);
  assert.equal(state.player.armor - beforeArmor, 7);
});

test('Wind chain and Cloudstep can reduce AP cost without creating an infinite loop', () => {
  let state = createCardCombatState({
    loadout: { equippedGu: ALL_GU, equippedKillerMoves: [], relics: ['cloudstepToken'] },
  });
  state = forceHand(state, ['swiftFangGu', 'galeBladeGu']);
  const targetId = state.enemies[0].id;
  const firstCost = getPlayableCost(cardIn(state, 'swiftFangGu'), state);
  assert.equal(firstCost.apCost, 0);
  state = playCard(state, cardIn(state, 'swiftFangGu').instanceId, targetId);
  const secondCost = getPlayableCost(cardIn(state, 'galeBladeGu'), state);
  assert.equal(secondCost.apCost, 0);
  state = playCard(state, cardIn(state, 'galeBladeGu').instanceId, targetId);
  assert.ok(state.ap >= 3);
});

test('Wisdom retrieves a card from discard pile', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['wisdomThreadGu']);
  state = { ...state, discardPile: [{ ...cardAnywhere(state, 'strike'), instanceId: 'strike_discarded' }] };
  state = playCard(state, state.hand[0].instanceId, state.enemies[0].id);
  assert.ok(state.hand.some((card) => card.instanceId === 'strike_discarded'));
});

test('Wisdom can retrieve the chosen discarded card', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['wisdomThreadGu']);
  state = {
    ...state,
    discardPile: [
      { ...cardAnywhere(state, 'strike'), instanceId: 'strike_discarded' },
      { ...cardAnywhere(state, 'guard'), instanceId: 'guard_discarded' },
    ],
  };
  state = playCard(state, state.hand[0].instanceId, state.enemies[0].id, { retrieveInstanceId: 'guard_discarded' });
  assert.ok(state.hand.some((card) => card.instanceId === 'guard_discarded'));
  assert.equal(state.discardPile.some((card) => card.instanceId === 'strike_discarded'), true);
});

test('prototype starts with a larger Essence pool for longer card battles', () => {
  const state = createCardCombatState();
  assert.equal(state.player.maxEssence, 48);
  assert.equal(state.player.essence, 48);
});

test('Dark Skill Seal prevents enemy Skill intent and chooses an alternative', () => {
  let state = createCardCombatState({ encounterId: 'single' });
  state = forceHand(state, ['darkSealGu']);
  const targetId = state.enemies[0].id;
  state = playCard(state, cardIn(state, 'darkSealGu').instanceId, targetId);
  state = endPlayerTurn(state);
  assert.notEqual(state.enemies[0].intent, 'skill');
});

test('Cloud Veil blocks one damage instance', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['cloudVeilGu']);
  state = playCard(state, cardIn(state, 'cloudVeilGu').instanceId, state.enemies[0].id);
  const before = state.player.hp;
  state = endPlayerTurn(state);
  assert.equal(state.player.hp, before);
});

test('Bone Thorns reflects damage when attacked', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['boneThornGu']);
  state = playCard(state, cardIn(state, 'boneThornGu').instanceId, state.enemies[0].id);
  const before = state.enemies[0].hp;
  state = endPlayerTurn(state);
  assert.ok(state.enemies[0].hp < before);
});

test('Blood Leech lifesteals without sacrificing HP', () => {
  let state = createCardCombatState();
  state = { ...state, player: { ...state.player, hp: 60 }, enemies: state.enemies.map((enemy) => ({ ...enemy, armor: 0 })) };
  state = forceHand(state, ['bloodLeechGu']);
  const beforeHp = state.player.hp;
  state = playCard(state, cardIn(state, 'bloodLeechGu').instanceId, state.enemies[0].id);
  assert.ok(state.player.hp > beforeHp);
  assert.equal(state.player.essence, 45);
  assert.ok(state.log.some((entry) => entry.key === 'card.log.lifesteal'));
});

test('Blood Rend sacrifices HP for stronger damage without lifesteal', () => {
  let state = createCardCombatState();
  state = { ...state, player: { ...state.player, hp: 60 }, enemies: state.enemies.map((enemy) => ({ ...enemy, armor: 0 })) };
  state = forceHand(state, ['bloodRendGu']);
  const beforeHp = state.player.hp;
  const beforeEnemyHp = state.enemies[0].hp;
  state = playCard(state, cardIn(state, 'bloodRendGu').instanceId, state.enemies[0].id);
  assert.equal(state.player.hp, beforeHp - 5);
  assert.ok(state.enemies[0].hp <= beforeEnemyHp - 15);
  assert.equal(state.log.some((entry) => entry.key === 'card.log.lifesteal'), false);
});

test('AoE Killer Move damages multiple enemies', () => {
  let state = createCardCombatState({
    encounterId: 'multi',
    loadout: { equippedGu: ALL_GU, equippedKillerMoves: ['emberRainFormation'], relics: [] },
  });
  state = forceHand(state, ['emberRainFormation']);
  const before = state.enemies.map((enemy) => enemy.hp);
  state = { ...state, player: { ...state.player, essence: 32 } };
  state = playCard(state, cardIn(state, 'emberRainFormation').instanceId, state.enemies[0].id);
  assert.ok(state.enemies.every((enemy, index) => enemy.hp < before[index]));
});

test('draw pile recycles discard pile when empty', () => {
  let state = createCardCombatState({
    loadout: { equippedGu: ALL_GU, equippedKillerMoves: [], relics: [] },
  });
  state = forceHand(state, ['swiftFangGu']);
  state = {
    ...state,
    drawPile: [],
    discardPile: [{ ...cardIn(state, 'strike'), instanceId: 'strike_discarded' }],
  };
  state = playCard(state, state.hand[0].instanceId, state.enemies[0].id);
  assert.ok(state.log.some((entry) => entry.key === 'card.log.shuffle'));
});

test('multi enemy and wave encounters initialize correctly', () => {
  const multi = createCardCombatState({ encounterId: 'multi' });
  const waves = createCardCombatState({ encounterId: 'waves' });
  assert.equal(getCurrentEnemies(multi).length, 3);
  assert.equal(waves.waves.length, 2);
});

test('loadout can build a smaller deck and never exceeds the prototype max deck size', () => {
  const slimDeck = buildPrototypeDeck({
    equippedGu: ['emberFangGu', 'waterFlowGu'],
    equippedKillerMoves: [],
    starterCounts: { strike: 4, guard: 3, focusBreath: 2 },
    relics: [],
  });
  assert.equal(slimDeck.length, 11);

  const cappedDeck = buildPrototypeDeck({
    equippedGu: ALL_GU,
    equippedKillerMoves: ['thunderGaleFang', 'emberRainFormation'],
    starterCounts: { strike: 40, guard: 40, focusBreath: 40 },
    relics: [],
  });
  assert.equal(cappedDeck.length, DECK_LIMITS.max);
});

test('attack intent previews 10 incoming HP loss before Armor', () => {
  const state = createCardCombatState();
  const preview = predictIncomingDamage(state);
  assert.equal(state.enemies[0].intent, 'attack');
  assert.equal(preview.totalIncoming, 10);
  assert.equal(preview.hpLoss, 10);
});

test('Guard Armor immediately reduces predicted HP loss', () => {
  let state = createCardCombatState();
  state = forceHand(state, ['guard', 'guard']);
  state = playCard(state, cardIn(state, 'guard').instanceId, state.enemies[0].id);
  let preview = predictIncomingDamage(state);
  assert.equal(state.player.armor, 6);
  assert.equal(preview.totalIncoming, 10);
  assert.equal(preview.hpLoss, 4);
  state = playCard(state, cardIn(state, 'guard').instanceId, state.enemies[0].id);
  preview = predictIncomingDamage(state);
  assert.equal(state.player.armor, 12);
  assert.equal(preview.hpLoss, 0);
  assert.equal(preview.blocked, true);
});

test('multiple attacking enemies combine predicted incoming damage', () => {
  const state = createCardCombatState({ encounterId: 'multi' });
  const attackingState = {
    ...state,
    player: { ...state.player, armor: 10 },
    enemies: state.enemies.map((enemy) => ({ ...enemy, intent: 'attack' })),
  };
  const preview = predictIncomingDamage(attackingState);
  assert.equal(preview.totalIncoming, 30);
  assert.equal(preview.armorMitigated, 10);
  assert.equal(preview.hpLoss, 20);
});

test('Cloud Veil preview blocks the first incoming damage instance', () => {
  const state = createCardCombatState({ encounterId: 'multi' });
  const veiledState = {
    ...state,
    player: { ...state.player, armor: 0, statuses: { cloudVeil: { id: 'cloudVeil', stacks: 1, duration: 1 } } },
    enemies: state.enemies.map((enemy) => ({ ...enemy, intent: 'attack' })),
  };
  const preview = predictIncomingDamage(veiledState);
  assert.equal(preview.totalIncoming, 30);
  assert.equal(preview.blockedDamage, 10);
  assert.equal(preview.hpLoss, 20);
});

test('Skill Seal updates a Skill intent to an allowed alternative immediately', () => {
  let state = createCardCombatState({ encounterId: 'multi' });
  state = forceHand(state, ['darkSealGu']);
  const targetId = 'ashenCultivator';
  assert.equal(state.enemies.find((enemy) => enemy.id === targetId).intent, 'skill');
  state = playCard(state, cardIn(state, 'darkSealGu').instanceId, targetId);
  assert.equal(state.enemies.find((enemy) => enemy.id === targetId).intent, 'attack');
});
