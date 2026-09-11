import {
  CARD_PATHS,
  CARD_TYPES,
  DECK_LIMITS,
  ENCOUNTERS,
  GU_CARDS,
  INTENT_DEFS,
  KILLER_MOVE_CARDS,
  SAMPLE_LOADOUT,
  SAMPLE_RELICS,
  STARTER_CARDS,
} from './prototypeData';

const HAND_SIZE = 5;
const START_AP = 3;
const START_MAX_ESSENCE = 48;
const MAX_POISON = 12;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextInstanceId(state, prefix = 'card') {
  return `${prefix}_${state.nextId}`;
}

function expandCard(def) {
  const count = def.count || 1;
  return Array.from({ length: count }, () => ({ ...def, count: undefined }));
}

export function buildPrototypeDeck(loadout = SAMPLE_LOADOUT) {
  const equippedGu = new Set(loadout.equippedGu || []);
  const ownedGu = new Set(loadout.equippedGu || []);
  const equippedKillerMoves = new Set(loadout.equippedKillerMoves || []);
  const starterCounts = loadout.starterCounts || SAMPLE_LOADOUT.starterCounts || {};
  const killerMoves = KILLER_MOVE_CARDS.filter((card) => (
    equippedKillerMoves.has(card.id) && card.requiredGu.every((guId) => ownedGu.has(guId))
  ));
  const boundGu = new Set(killerMoves.flatMap((card) => card.boundGu || []));
  const guCards = GU_CARDS.filter((card) => equippedGu.has(card.guId) && !boundGu.has(card.guId));
  const starterCards = STARTER_CARDS.flatMap((card) => expandCard({ ...card, count: starterCounts[card.id] ?? card.count ?? 0 }));
  return [...starterCards, ...guCards, ...killerMoves].slice(0, DECK_LIMITS.max).map((card) => ({
    ...card,
    instanceId: null,
  }));
}

export function countPrototypeDeck(loadout = SAMPLE_LOADOUT) {
  return buildPrototypeDeck(loadout).length;
}

function withInstances(cards, state) {
  let nextId = state.nextId;
  const instanced = cards.map((card) => {
    const instance = { ...card, instanceId: `${card.id}_${nextId}` };
    nextId += 1;
    return instance;
  });
  return { cards: instanced, nextId };
}

function addStatus(target, effect) {
  const statuses = { ...(target.statuses || {}) };
  const current = statuses[effect.id] || { id: effect.id, stacks: 0, duration: 0 };
  const stacks = effect.id === 'poison'
    ? Math.min(MAX_POISON, current.stacks + (effect.stacks || 1))
    : current.stacks + (effect.stacks || 1);
  statuses[effect.id] = {
    id: effect.id,
    stacks,
    duration: effect.permanent ? null : Math.max(current.duration || 0, effect.duration || 0),
    permanent: !!effect.permanent || !!current.permanent,
    usedThisTurn: false,
  };
  return { ...target, statuses };
}

function removeStatusStack(target, id, amount = 1) {
  const statuses = { ...(target.statuses || {}) };
  const current = statuses[id];
  if (!current) return target;
  const stacks = current.stacks - amount;
  if (stacks <= 0) delete statuses[id];
  else statuses[id] = { ...current, stacks };
  return { ...target, statuses };
}

function tickStatuses(target, phase) {
  let next = { ...target, statuses: { ...(target.statuses || {}) } };
  const log = [];
  if (phase === 'start' && next.statuses.regeneration?.stacks) {
    const amount = next.statuses.regeneration.stacks;
    next.hp = Math.min(next.maxHp, next.hp + amount);
    log.push({ key: 'card.log.regen', params: { nameKey: next.key, amount } });
  }
  if (phase === 'end' && next.statuses.poison?.stacks) {
    const amount = next.statuses.poison.stacks;
    next.hp = Math.max(0, next.hp - amount);
    log.push({ key: 'card.log.poison', params: { nameKey: next.key, amount } });
  }

  for (const [id, status] of Object.entries(next.statuses)) {
    if (status.permanent) continue;
    if (phase === 'end' && id === 'scorch') {
      const stacks = status.stacks - 1;
      if (stacks <= 0) delete next.statuses[id];
      else next.statuses[id] = { ...status, stacks, usedThisTurn: false };
      continue;
    }
    if (phase === 'end' && id === 'poison') {
      const stacks = Math.floor(status.stacks / 2);
      if (stacks <= 0) delete next.statuses[id];
      else next.statuses[id] = { ...status, stacks, usedThisTurn: false };
      continue;
    }
    if (!status.duration) continue;
    const duration = status.duration - 1;
    if (duration <= 0) delete next.statuses[id];
    else next.statuses[id] = { ...status, duration, usedThisTurn: false };
  }
  return { target: next, log };
}

function drawCards(state, count) {
  let next = { ...state, drawPile: [...state.drawPile], discardPile: [...state.discardPile], hand: [...state.hand] };
  const log = [];
  for (let i = 0; i < count; i += 1) {
    if (next.drawPile.length === 0 && next.discardPile.length > 0) {
      next = { ...next, drawPile: [...next.discardPile].reverse(), discardPile: [] };
      log.push({ key: 'card.log.shuffle' });
    }
    const card = next.drawPile[0];
    if (!card) break;
    next = { ...next, drawPile: next.drawPile.slice(1), hand: [...next.hand, card] };
  }
  return { state: next, log };
}

function currentEnemies(state) {
  return state.enemies.filter((enemy) => enemy.hp > 0);
}

function chooseIntent(enemy, turn) {
  const options = enemy.intents || ['attack'];
  const sealed = !!enemy.statuses?.skillSeal;
  const filtered = sealed ? options.filter((intent) => !['skill', 'debuff', 'prepare', 'buff'].includes(intent)) : options;
  return filtered[(turn - 1) % filtered.length] || 'attack';
}

function intentDef(intent) {
  return INTENT_DEFS[intent] || INTENT_DEFS.unknown;
}

function refreshEnemyIntents(state) {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      intent: enemy.hp > 0 ? chooseIntent(enemy, state.turn) : enemy.intent,
    })),
  };
}

function attackInstances(state) {
  return currentEnemies(state)
    .map((enemy) => ({ enemyId: enemy.id, intent: enemy.intent, ...intentDef(enemy.intent) }))
    .filter((intent) => !intent.hidden && intent.damage > 0);
}

export function predictIncomingDamage(inputState) {
  const attacks = attackInstances(inputState);
  let armorRemaining = inputState.player.armor || 0;
  let cloudBlocksRemaining = inputState.player.statuses?.cloudVeil?.stacks ? 1 : 0;
  let armorMitigated = 0;
  let blockedDamage = 0;
  let hpLoss = 0;
  const instances = [];

  for (const attack of attacks) {
    const incoming = attack.damage;
    if (cloudBlocksRemaining > 0) {
      cloudBlocksRemaining -= 1;
      blockedDamage += incoming;
      instances.push({ ...attack, incoming, hpLoss: 0, armorUsed: 0, blocked: true });
      continue;
    }
    const armorUsed = Math.min(armorRemaining, incoming);
    armorRemaining -= armorUsed;
    armorMitigated += armorUsed;
    const instanceHpLoss = Math.max(0, incoming - armorUsed);
    hpLoss += instanceHpLoss;
    instances.push({ ...attack, incoming, hpLoss: instanceHpLoss, armorUsed, blocked: false });
  }

  return {
    totalIncoming: attacks.reduce((sum, attack) => sum + attack.damage, 0),
    hpLoss,
    armorMitigated,
    blockedDamage,
    blocked: attacks.length > 0 && hpLoss === 0,
    instances,
  };
}

function rollDamage(card) {
  if (!card.damage) return 0;
  let damage = Math.ceil((card.damage[0] + card.damage[1]) / 2);
  return damage;
}

function applyDamageToEnemy(enemy, rawDamage, card, state) {
  let damage = rawDamage;
  let nextEnemy = enemy;
  const log = [];
  const bloodFury = state.player.statuses?.bloodFury?.stacks || 0;
  if (bloodFury && card.path === CARD_PATHS.BLOOD && card.type === CARD_TYPES.ATTACK) {
    damage += bloodFury * 3;
  }
  if (card.path === CARD_PATHS.FIRE && nextEnemy.statuses?.scorch?.stacks) {
    damage = Math.ceil(damage * 1.3);
    nextEnemy = removeStatusStack(nextEnemy, 'scorch', 1);
    log.push({ key: 'card.log.scorchBurst', params: { amount: damage } });
  }
  const emberHeart = state.relics.some((relic) => relic.id === 'emberHeartPendant');
  if (emberHeart && card.path === CARD_PATHS.FIRE && nextEnemy.hp <= nextEnemy.maxHp / 2) {
    damage = Math.ceil(damage * 1.1);
  }
  const armorBreakStacks = nextEnemy.statuses?.armorBreak?.stacks || 0;
  const armorEffectiveness = Math.max(0, 1 - armorBreakStacks * 0.25);
  const protectedArmor = Math.ceil((nextEnemy.armor || 0) * armorEffectiveness);
  const ignoredArmor = Math.floor(protectedArmor * (card.pierce || 0));
  const effectiveArmor = Math.max(0, protectedArmor - ignoredArmor);
  const hpDamage = Math.max(0, damage - effectiveArmor);
  const armorDamage = Math.min(nextEnemy.armor || 0, damage - hpDamage);
  nextEnemy = {
    ...nextEnemy,
    hp: Math.max(0, nextEnemy.hp - hpDamage),
    armor: Math.max(0, (nextEnemy.armor || 0) - armorDamage),
  };
  if (card.armorBreak) {
    nextEnemy = addStatus(nextEnemy, { id: 'armorBreak', stacks: card.armorBreak, duration: 2 });
  }
  return { enemy: nextEnemy, damage: hpDamage, log };
}

function gainArmor(player, baseArmor) {
  const fortify = player.statuses?.fortify?.stacks || 0;
  return Math.ceil(baseArmor * (1 + fortify * 0.1));
}

function playableCost(card, state) {
  let apCost = card.apCost || 0;
  let essenceCost = card.essenceCost || 0;
  if (card.path === CARD_PATHS.WIND && state.player.statuses?.windChain?.stacks) {
    apCost = Math.max(0, apCost - 1);
  }
  essenceCost = Math.max(0, essenceCost - (state.nextEssenceDiscount || 0));
  if (state.firstWindFree && card.path === CARD_PATHS.WIND && !state.usedFirstWindFree) {
    apCost = 0;
  }
  return { apCost, essenceCost };
}

function spendCardCost(state, card) {
  const cost = playableCost(card, state);
  let player = {
    ...state.player,
    hp: Math.max(1, state.player.hp - (card.hpCost || 0)),
    essence: Math.max(0, state.player.essence - cost.essenceCost),
  };
  if (card.path === CARD_PATHS.WIND && player.statuses?.windChain?.stacks) {
    player = removeStatusStack(player, 'windChain', 1);
  }
  return {
    ...state,
    ap: state.ap - cost.apCost,
    nextEssenceDiscount: Math.max(0, (state.nextEssenceDiscount || 0) - cost.essenceCost),
    usedFirstWindFree: state.usedFirstWindFree || (state.firstWindFree && card.path === CARD_PATHS.WIND),
    player,
  };
}

export function createCardCombatState(options = {}) {
  const encounterId = options.encounterId || 'single';
  const encounter = ENCOUNTERS[encounterId] || ENCOUNTERS.single;
  const baseState = {
    turn: 1,
    phase: 'player',
    ap: START_AP,
    nextId: 1,
    player: {
      key: 'card.player',
      maxHp: 80,
      hp: 80,
      maxEssence: START_MAX_ESSENCE,
      essence: START_MAX_ESSENCE,
      armor: 0,
      statuses: {},
    },
    enemies: clone(encounter.waves[0]).map((enemy) => ({ ...enemy, statuses: {}, intent: chooseIntent(enemy, 1) })),
    encounterId,
    waveIndex: 0,
    waves: clone(encounter.waves),
    deck: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    relics: SAMPLE_RELICS.filter((relic) => (options.loadout || SAMPLE_LOADOUT).relics?.includes(relic.id)),
    firstWindFree: (options.loadout || SAMPLE_LOADOUT).relics?.includes('cloudstepToken'),
    usedFirstWindFree: false,
    nextEssenceDiscount: 0,
    log: [{ key: 'card.log.start' }],
    winner: null,
  };
  const { cards, nextId } = withInstances(buildPrototypeDeck(options.loadout), baseState);
  let state = { ...baseState, nextId, deck: cards, drawPile: cards };
  const innate = state.drawPile.filter((card) => card.keywords?.includes('innate'));
  if (innate.length) {
    state = {
      ...state,
      hand: innate,
      drawPile: state.drawPile.filter((card) => !card.keywords?.includes('innate')),
    };
  }
  const drawn = drawCards(state, HAND_SIZE - state.hand.length);
  return { ...drawn.state, log: [...state.log, ...drawn.log] };
}

function maybeAdvanceWave(state) {
  if (currentEnemies(state).length > 0) return state;
  const nextWaveIndex = state.waveIndex + 1;
  if (nextWaveIndex >= state.waves.length) {
    return { ...state, phase: 'ended', winner: 'player', log: [...state.log, { key: 'card.log.victory' }] };
  }
  const enemies = clone(state.waves[nextWaveIndex]).map((enemy) => ({
    ...enemy,
    statuses: {},
    intent: chooseIntent(enemy, state.turn),
  }));
  return {
    ...state,
    waveIndex: nextWaveIndex,
    enemies,
    log: [...state.log, { key: 'card.log.nextWave', params: { wave: nextWaveIndex + 1 } }],
  };
}

export function playCard(inputState, instanceId, targetId, choices = {}) {
  if (inputState.phase !== 'player' || inputState.winner) return inputState;
  const card = inputState.hand.find((item) => item.instanceId === instanceId);
  if (!card) return inputState;
  const cost = playableCost(card, inputState);
  if (inputState.ap < cost.apCost || inputState.player.essence < cost.essenceCost) {
    return { ...inputState, log: [...inputState.log, { key: 'card.log.cannotPay' }] };
  }
  let state = spendCardCost(inputState, card);
  let player = { ...state.player };
  let enemies = state.enemies.map((enemy) => ({ ...enemy }));
  const targetIds = card.targetMode === 'all'
    ? currentEnemies(state).map((enemy) => enemy.id)
    : [targetId || currentEnemies(state)[0]?.id].filter(Boolean);
  const log = /** @type {Array<{ key: string, params?: Record<string, unknown> }>} */ ([
    { key: 'card.log.play', params: { cardKey: card.key } },
  ]);

  if (card.armor) {
    const amount = gainArmor(player, card.armor);
    player = { ...player, armor: player.armor + amount };
    log.push({ key: 'card.log.armor', params: { amount } });
  }
  if (card.heal) {
    player = { ...player, hp: Math.min(player.maxHp, player.hp + card.heal) };
    log.push({ key: 'card.log.heal', params: { amount: card.heal } });
  }
  if (card.essenceRecover) {
    player = { ...player, essence: Math.min(player.maxEssence, player.essence + card.essenceRecover) };
    log.push({ key: 'card.log.essence', params: { amount: card.essenceRecover } });
  }
  for (const effect of card.applySelfStatus || []) player = addStatus(player, effect);
  if (card.essenceDiscount) state = { ...state, nextEssenceDiscount: Math.max(state.nextEssenceDiscount || 0, card.essenceDiscount) };

  for (const id of targetIds) {
    const index = enemies.findIndex((enemy) => enemy.id === id && enemy.hp > 0);
    if (index < 0) continue;
    let enemy = enemies[index];
    const rawDamage = rollDamage(card);
    if (rawDamage > 0) {
      const result = applyDamageToEnemy(enemy, rawDamage, card, state);
      enemy = result.enemy;
      log.push(...result.log, { key: 'card.log.damage', params: { nameKey: enemy.key, amount: result.damage } });
      if (card.lifesteal && result.damage > 0) {
        const heal = Math.ceil(result.damage * card.lifesteal);
        player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) };
        log.push({ key: 'card.log.lifesteal', params: { amount: heal } });
      }
    }
    for (const effect of card.applyTargetStatus || []) enemy = addStatus(enemy, effect);
    enemies[index] = enemy;
  }

  if (card.retrieveFromDiscard && state.discardPile.length) {
    const pickedId = choices.retrieveInstanceId || state.discardPile[0].instanceId;
    const picked = state.discardPile.find((item) => item.instanceId === pickedId) || state.discardPile[0];
    state = {
      ...state,
      discardPile: state.discardPile.filter((item) => item.instanceId !== picked.instanceId),
      hand: [...state.hand, picked],
    };
    log.push({ key: 'card.log.retrieve', params: { cardKey: picked.key } });
  }
  if (card.draw) {
    const drawn = drawCards({ ...state, player, enemies }, card.draw);
    state = drawn.state;
    log.push(...drawn.log, { key: 'card.log.draw', params: { amount: card.draw } });
  }

  const hand = state.hand.filter((item) => item.instanceId !== instanceId);
  const destination = card.keywords?.includes('exhaust') ? 'exhaustPile' : 'discardPile';
  state = {
    ...state,
    player,
    enemies,
    hand,
    [destination]: [...state[destination], card],
    log: [...state.log, ...log],
  };
  return maybeAdvanceWave(refreshEnemyIntents(state));
}

function enemyAction(state, enemy) {
  if (enemy.hp <= 0) return { state, log: [] };
  const intent = enemy.intent || chooseIntent(enemy, state.turn);
  const details = intentDef(intent);
  let player = { ...state.player };
  let nextEnemy = { ...enemy, intent };
  const log = [];
  if (details.damage) {
    const damage = details.damage;
    if (player.statuses?.cloudVeil && !player.statuses.cloudVeil.usedThisTurn) {
      player = {
        ...player,
        statuses: {
          ...player.statuses,
          cloudVeil: { ...player.statuses.cloudVeil, usedThisTurn: true, stacks: 0 },
        },
      };
      delete player.statuses.cloudVeil;
      log.push({ key: 'card.log.cloudBlock' });
    } else {
      const hpDamage = Math.max(0, damage - (player.armor || 0));
      const armorDamage = Math.min(player.armor || 0, damage - hpDamage);
      player = { ...player, armor: Math.max(0, (player.armor || 0) - armorDamage), hp: Math.max(0, player.hp - hpDamage) };
      log.push({ key: 'card.log.enemyDamage', params: { nameKey: enemy.key, amount: hpDamage } });
    }
    const thorns = player.statuses?.thorns?.stacks || 0;
    if (thorns) {
      const boneMirror = state.relics.some((relic) => relic.id === 'crackedBoneMirror') ? 2 : 0;
      const reflected = thorns + boneMirror;
      nextEnemy = { ...nextEnemy, hp: Math.max(0, nextEnemy.hp - reflected) };
      log.push({ key: 'card.log.thorns', params: { amount: reflected } });
    }
  } else if (intent === 'defend') {
    nextEnemy = { ...nextEnemy, armor: (nextEnemy.armor || 0) + details.armor };
    log.push({ key: 'card.log.enemyDefend', params: { nameKey: enemy.key } });
  } else if (intent === 'skill' || intent === 'buff') {
    nextEnemy = addStatus(nextEnemy, { id: 'fortify', stacks: 1, duration: 2 });
    log.push({ key: 'card.log.enemySkill', params: { nameKey: enemy.key } });
  } else if (intent === 'debuff') {
    player = addStatus(player, { id: 'poison', stacks: 1, duration: 3 });
    log.push({ key: 'card.log.enemyDebuff', params: { nameKey: enemy.key } });
  } else if (intent === 'heal') {
    nextEnemy = { ...nextEnemy, hp: Math.min(nextEnemy.maxHp, nextEnemy.hp + details.heal) };
    log.push({ key: 'card.log.enemyHeal', params: { nameKey: enemy.key, amount: details.heal } });
  }
  const enemies = state.enemies.map((item) => (item.id === enemy.id ? nextEnemy : item));
  return { state: { ...state, player, enemies }, log };
}

export function endPlayerTurn(inputState) {
  if (inputState.phase !== 'player' || inputState.winner) return inputState;
  const retained = inputState.hand.filter((card) => card.keywords?.includes('retain'));
  const discarded = inputState.hand.filter((card) => !card.keywords?.includes('retain'));
  let state = {
    ...inputState,
    hand: retained,
    discardPile: [...inputState.discardPile, ...discarded],
    phase: 'enemy',
    log: [...inputState.log, { key: 'card.log.endTurn' }],
  };
  state = {
    ...state,
    enemies: state.enemies.map((enemy) => {
      const ticked = tickStatuses(enemy, 'end');
      state = { ...state, log: [...state.log, ...ticked.log] };
      return ticked.target;
    }),
  };
  state = maybeAdvanceWave(state);
  if (state.winner) return state;
  for (const enemy of currentEnemies(state)) {
    const action = enemyAction(state, enemy);
    state = { ...action.state, log: [...action.state.log, ...action.log] };
  }
  if (state.player.hp <= 0) return { ...state, phase: 'ended', winner: 'enemy', log: [...state.log, { key: 'card.log.defeat' }] };
  return startPlayerTurn(state);
}

export function startPlayerTurn(inputState) {
  let state = {
    ...inputState,
    turn: inputState.turn + 1,
    phase: 'player',
    ap: START_AP,
    usedFirstWindFree: false,
    nextEssenceDiscount: 0,
    player: { ...inputState.player, armor: 0 },
    enemies: inputState.enemies.map((enemy) => ({ ...enemy, armor: 0 })),
  };
  const playerTick = tickStatuses(state.player, 'start');
  state = { ...state, player: playerTick.target, log: [...state.log, ...playerTick.log] };
  state = {
    ...state,
    enemies: state.enemies.map((enemy) => ({ ...enemy, intent: chooseIntent(enemy, state.turn) })),
  };
  const drawn = drawCards(state, HAND_SIZE - state.hand.length);
  return {
    ...drawn.state,
    log: [...drawn.state.log, ...drawn.log, { key: 'card.log.startTurn', params: { turn: drawn.state.turn } }],
  };
}

export function resetEncounter(encounterId = 'single') {
  return createCardCombatState({ encounterId });
}

export function getPlayableCost(card, state) {
  return playableCost(card, state);
}

export function getCurrentEnemies(state) {
  return currentEnemies(state);
}

export function cardRequiresTarget(card) {
  return card.type === CARD_TYPES.ATTACK || card.type === CARD_TYPES.CONTROL || card.applyTargetStatus?.length;
}
