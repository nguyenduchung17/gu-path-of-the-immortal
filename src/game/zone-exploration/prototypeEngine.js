import { createCardCombatState } from '@/game/card-combat/prototypeEngine';
import { SAMPLE_LOADOUT } from '@/game/card-combat/prototypeData';
import { ZONE_IDS, ZONE_ORDER, ZONES } from './prototypeData';

function cellKey(x, y) {
  return `${x},${y}`;
}

function zoneById(zoneId) {
  return ZONES[zoneId] || ZONES[ZONE_IDS.VILLAGE];
}

function entityAt(zone, defeatedEnemyIds, x, y) {
  const enemy = (zone.enemies || []).find((item) => item.x === x && item.y === y && !defeatedEnemyIds.includes(item.id));
  if (enemy) return { type: 'enemy', ...enemy };
  const npc = (zone.npcs || []).find((item) => item.x === x && item.y === y);
  if (npc) return { type: 'npc', ...npc };
  const resource = (zone.resources || []).find((item) => item.x === x && item.y === y);
  if (resource) return { type: 'resource', ...resource };
  const exit = (zone.exits || []).find((item) => item.x === x && item.y === y);
  if (exit) return { type: 'exit', ...exit };
  const hiddenExit = (zone.hiddenExits || []).find((item) => item.x === x && item.y === y);
  if (hiddenExit) return { type: 'hiddenExit', ...hiddenExit };
  const futureExit = (zone.futureExits || []).find((item) => item.x === x && item.y === y);
  if (futureExit) return { type: 'futureExit', ...futureExit };
  return null;
}

export function tileAt(zone, x, y) {
  for (const patch of zone.patches || []) {
    if (patch.cells.some(([px, py]) => px === x && py === y)) return patch.type;
  }
  return zone.defaultTile;
}

export function createZoneExplorationState() {
  const zone = ZONES[ZONE_IDS.VILLAGE];
  return {
    mode: 'explore',
    zoneId: zone.id,
    player: { ...zone.start },
    discoveredZoneIds: [zone.id],
    defeatedEnemyIds: [],
    gatheredResourceIds: [],
    activeEnemy: null,
    combat: null,
    lastMessageKey: 'zone.log.start',
  };
}

export function discoveredZones(state) {
  return ZONE_ORDER.map((zoneId) => ({
    ...zoneById(zoneId),
    discovered: state.discoveredZoneIds.includes(zoneId),
  }));
}

export function visibleEntities(state) {
  const zone = zoneById(state.zoneId);
  return {
    npcs: zone.npcs || [],
    enemies: (zone.enemies || []).filter((enemy) => !state.defeatedEnemyIds.includes(enemy.id)),
    resources: (zone.resources || []).filter((resource) => !state.gatheredResourceIds.includes(resource.id)),
    exits: zone.exits || [],
    decor: zone.decor || [],
  };
}

export function movePlayer(state, dx, dy) {
  if (state.mode !== 'explore') return state;
  const zone = zoneById(state.zoneId);
  const x = Math.max(0, Math.min(zone.width - 1, state.player.x + dx));
  const y = Math.max(0, Math.min(zone.height - 1, state.player.y + dy));
  const entity = entityAt(zone, state.defeatedEnemyIds, x, y);

  if (entity?.type === 'enemy') {
    return engageEnemy({ ...state, player: { x, y } }, entity.id);
  }

  if (entity?.type === 'exit') {
    const nextZone = zoneById(entity.to);
    return {
      ...state,
      zoneId: nextZone.id,
      player: { ...entity.target },
      discoveredZoneIds: Array.from(new Set([...state.discoveredZoneIds, nextZone.id])),
      lastMessageKey: entity.key,
    };
  }

  if (entity?.type === 'hiddenExit') {
    return { ...state, player: { x, y }, lastMessageKey: 'zone.log.hiddenPlaceholder' };
  }

  if (entity?.type === 'futureExit') {
    return { ...state, player: { x, y }, lastMessageKey: entity.key };
  }

  return { ...state, player: { x, y }, lastMessageKey: entity?.key || 'zone.log.move' };
}

export function engageEnemy(state, enemyId) {
  const zone = zoneById(state.zoneId);
  const enemy = (zone.enemies || []).find((item) => item.id === enemyId);
  if (!enemy || state.defeatedEnemyIds.includes(enemy.id)) return state;
  return {
    ...state,
    mode: 'combat',
    activeEnemy: enemy,
    combat: createCardCombatState({ encounterId: enemy.encounterId, loadout: SAMPLE_LOADOUT }),
    lastMessageKey: 'zone.log.engage',
  };
}

export function resolveCombat(state, result) {
  if (state.mode !== 'combat') return state;
  const defeated = result === 'victory' && state.activeEnemy?.id;
  return {
    ...state,
    mode: 'explore',
    defeatedEnemyIds: defeated ? Array.from(new Set([...state.defeatedEnemyIds, state.activeEnemy.id])) : state.defeatedEnemyIds,
    activeEnemy: null,
    combat: null,
    lastMessageKey: result === 'victory' ? 'zone.log.victoryReturn' : result === 'flee' ? 'zone.log.fleeReturn' : 'zone.log.defeatReturn',
  };
}

export function gatherResource(state, resourceId) {
  const zone = zoneById(state.zoneId);
  const resource = (zone.resources || []).find((item) => item.id === resourceId);
  if (!resource || state.gatheredResourceIds.includes(resourceId)) return state;
  return {
    ...state,
    gatheredResourceIds: [...state.gatheredResourceIds, resourceId],
    lastMessageKey: resource.key,
  };
}

export function mapCells(state) {
  const zone = zoneById(state.zoneId);
  const entities = visibleEntities(state);
  const entityMap = new Map();
  [...entities.decor, ...entities.exits, ...entities.resources, ...entities.npcs, ...entities.enemies].forEach((entity) => {
    entityMap.set(cellKey(entity.x, entity.y), entity);
  });
  return Array.from({ length: zone.height }, (_, y) => (
    Array.from({ length: zone.width }, (_, x) => ({
      x,
      y,
      tile: tileAt(zone, x, y),
      entity: entityMap.get(cellKey(x, y)) || null,
      hasPlayer: state.player.x === x && state.player.y === y,
    }))
  ));
}

export function currentZone(state) {
  return zoneById(state.zoneId);
}
