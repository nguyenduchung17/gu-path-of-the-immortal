import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Map, RotateCcw, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { primeAudio, sfx } from '@/game/audio/sfx';
import { LangProvider, useT } from '@/game/i18n/LangContext';
import LangSwitch from '@/game/i18n/LangSwitch';
import {
  createZoneExplorationState,
  currentZone,
  discoveredZones,
  engageEnemy,
  gatherResource,
  mapCells,
  movePlayer,
  resolveCombat,
  visibleEntities,
} from '@/game/zone-exploration/prototypeEngine';
import {
  endPlayerTurn,
  getCurrentEnemies,
  getPlayableCost,
  playCard,
  predictIncomingDamage,
} from '@/game/card-combat/prototypeEngine';
import { CARD_TYPES, INTENT_DEFS, STATUS_DEFS } from '@/game/card-combat/prototypeData';

const TILE_STYLE = {
  safe: 'bg-emerald-950/55 border-emerald-500/15',
  ground: 'bg-stone-800/65 border-stone-500/15',
  grass: 'bg-lime-950/70 border-lime-500/20',
  forest: 'bg-green-950/75 border-green-500/20',
  cave: 'bg-slate-950/80 border-slate-400/20',
  water: 'bg-cyan-950/70 border-cyan-300/20',
};

function ZoneExplorationPrototypeInner() {
  const { t } = useT();
  const [state, setState] = useState(() => createZoneExplorationState());
  const zone = currentZone(state);
  const entities = visibleEntities(state);
  const cells = useMemo(() => mapCells(state), [state]);

  const move = (dx, dy) => {
    primeAudio();
    sfx('step');
    setState((current) => movePlayer(current, dx, dy));
  };

  const reset = () => {
    primeAudio();
    sfx('open');
    setState(createZoneExplorationState());
  };

  const startEnemy = (enemyId) => {
    primeAudio();
    sfx('encounter');
    setState((current) => engageEnemy(current, enemyId));
  };

  const gather = (resourceId) => {
    primeAudio();
    sfx('chime');
    setState((current) => gatherResource(current, resourceId));
  };

  const inspectEntity = (entity) => {
    primeAudio();
    sfx('ui');
    setState((current) => ({
      ...current,
      lastMessageKey: entity.roleKey || entity.key || 'zone.log.inspect',
    }));
  };

  const handleCellClick = (cell) => {
    if (state.mode !== 'explore' || cell.hasPlayer) return;
    const dx = cell.x - state.player.x;
    const dy = cell.y - state.player.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    if (distance > 1) {
      primeAudio();
      sfx('fail');
      setState((current) => ({ ...current, lastMessageKey: 'zone.log.tooFar' }));
      return;
    }
    if (cell.entity?.encounterId) startEnemy(cell.entity.id);
    else if (cell.entity?.type === 'resource') gather(cell.entity.id);
    else if (cell.entity?.type === 'npc') inspectEntity(cell.entity);
    else move(dx, dy);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (state.mode !== 'explore') return;
      if (event.target?.tagName === 'INPUT' || event.target?.tagName === 'TEXTAREA') return;
      const key = event.key.toLowerCase();
      const directions = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      const direction = directions[key];
      if (!direction) return;
      event.preventDefault();
      move(direction[0], direction[1]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.mode]);

  return (
    <div className="min-h-screen bg-[#15110d] text-stone-100">
      <div className="relative overflow-hidden border-b border-amber-200/10 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_32%),linear-gradient(135deg,_#1b140f,_#10201b_58%,_#12131e)]">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#f8e7b0_1px,transparent_1px),linear-gradient(#f8e7b0_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full border border-emerald-200/30 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-emerald-100">
                {t('zone.prototype.badge')}
              </span>
              <LangSwitch />
            </div>
            <h1 className="text-2xl font-semibold tracking-wide text-amber-100">{t('zone.prototype.title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-300">{t('zone.prototype.subtitle')}</p>
            <p className="mt-2 text-xs text-emerald-100/80">{t('zone.prototype.controlsHint')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/prototype/card-combat">
              <Button variant="outline" className="border-amber-200/30 bg-black/20 text-amber-100 hover:bg-amber-200/10">
                <Swords className="mr-2 h-4 w-4" />
                {t('zone.prototype.cardLab')}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-amber-200/30 bg-black/20 text-amber-100 hover:bg-amber-200/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('card.prototype.backGame')}
              </Button>
            </Link>
            <Button onClick={reset} className="bg-emerald-700 text-white hover:bg-emerald-600">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('zone.prototype.reset')}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 xl:grid-cols-[1fr_330px]">
        <section className="space-y-4">
          <div className="rounded-xl border border-amber-200/10 bg-black/25 p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">{zone.safe ? t('zone.prototype.safe') : t('zone.prototype.wilderness')}</div>
                <h2 className="text-xl font-semibold text-amber-100">{t(zone.key)}</h2>
                <p className="mt-1 text-sm text-stone-400">{t(zone.subtitleKey)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-stone-300">
                {t('zone.prototype.position', { x: state.player.x, y: state.player.y })}
              </div>
            </div>

            <div className="overflow-auto rounded-xl border border-amber-200/10 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.08),_transparent_55%),#0d1110] p-3">
              <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${zone.width}, minmax(42px, 1fr))` }}>
                {cells.flat().map((cell) => (
                  <button
                    key={`${cell.x}-${cell.y}`}
                    title={cell.entity ? t(cell.entity.key) : t(`zone.tile.${cell.tile}`)}
                    onClick={() => handleCellClick(cell)}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-lg border text-lg transition hover:ring-1 hover:ring-amber-200/40 ${TILE_STYLE[cell.tile] || TILE_STYLE.ground}`}
                  >
                    {cell.hasPlayer ? (
                      <span className="z-[2] flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/60 bg-amber-300 text-sm font-black text-stone-950 shadow-lg shadow-amber-950/40">你</span>
                    ) : (
                      <span className="z-[1]">{cell.entity?.icon || tileIcon(cell.tile)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[170px_1fr]">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-2 text-xs font-semibold text-amber-100">{t('zone.prototype.move')}</div>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <MoveButton label="↑" onClick={() => move(0, -1)} />
                  <span />
                  <MoveButton label="←" onClick={() => move(-1, 0)} />
                  <MoveButton label="•" onClick={() => {}} disabled />
                  <MoveButton label="→" onClick={() => move(1, 0)} />
                  <span />
                  <MoveButton label="↓" onClick={() => move(0, 1)} />
                  <span />
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-2 text-xs font-semibold text-amber-100">{t('zone.prototype.localInfo')}</div>
                <p className="text-sm text-stone-300">{t(state.lastMessageKey)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-300">
                  <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2 py-1">{t('zone.prototype.npcs')}: {entities.npcs.length}</span>
                  <span className="rounded-full border border-rose-200/20 bg-rose-300/10 px-2 py-1">{t('zone.prototype.enemies')}: {entities.enemies.length}</span>
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-1">{t('zone.prototype.resources')}: {entities.resources.length}</span>
                  <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-1">{t('zone.prototype.exits')}: {entities.exits.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <Panel title={t('zone.prototype.regionMap')}>
            <div className="space-y-2">
              {discoveredZones(state).map((item) => (
                <div key={item.id} className={`rounded-lg border p-2 ${item.discovered ? 'border-emerald-200/20 bg-emerald-300/10' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                    <Map className="h-3.5 w-3.5" />
                    {item.discovered ? t(item.key) : t('zone.hidden.unknown')}
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {item.discovered ? t(item.subtitleKey) : t('zone.prototype.undiscoveredHint')}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-2">
                <div className="text-sm font-semibold text-stone-300">{t('zone.hidden.unknown')}</div>
                <p className="mt-1 text-[11px] text-stone-500">{t('zone.prototype.secretHint')}</p>
              </div>
            </div>
          </Panel>

          <Panel title={t('zone.prototype.visibleThings')}>
            <ThingList title={t('zone.prototype.npcs')} items={entities.npcs} t={t} actionLabel={t('zone.prototype.talk')} onAction={(item) => inspectEntity(item)} />
            <ThingList title={t('zone.prototype.enemies')} items={entities.enemies} t={t} actionLabel={t('zone.prototype.engage')} onAction={(item) => startEnemy(item.id)} />
            <ThingList title={t('zone.prototype.resources')} items={entities.resources} t={t} actionLabel={t('zone.prototype.gather')} onAction={(item) => gather(item.id)} />
            <ThingList title={t('zone.prototype.exits')} items={entities.exits} t={t} />
          </Panel>
        </aside>
      </main>

      {state.mode === 'combat' && (
        <ZoneCombatOverlay
          state={state}
          setState={setState}
          t={t}
        />
      )}
    </div>
  );
}

function ZoneCombatOverlay({ state, setState, t }) {
  const combat = state.combat;
  const liveEnemies = getCurrentEnemies(combat);
  const [targetId, setTargetId] = useState(liveEnemies[0]?.id || null);
  const preview = predictIncomingDamage(combat);
  const selectedTarget = liveEnemies.find((enemy) => enemy.id === targetId) || liveEnemies[0];

  const updateCombat = (updater) => {
    setState((current) => ({ ...current, combat: updater(current.combat) }));
  };

  const play = (card) => {
    primeAudio();
    sfx(card.type === CARD_TYPES.KILLER_MOVE ? 'killer' : card.damage ? 'hit' : 'cast');
    updateCombat((current) => playCard(current, card.instanceId, selectedTarget?.id));
  };

  const endTurn = () => {
    primeAudio();
    sfx(preview.hpLoss > 0 ? 'hurt' : 'confirm');
    updateCombat(endPlayerTurn);
  };

  const leave = (result) => {
    primeAudio();
    sfx(result === 'victory' ? 'chime' : 'cancel');
    setState((current) => resolveCombat(current, result));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-4 backdrop-blur">
      <div className="mx-auto max-w-6xl rounded-2xl border border-amber-200/20 bg-[#17120e] p-4 shadow-2xl shadow-black">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-rose-200">{t('zone.prototype.combatTransition')}</div>
            <h2 className="text-xl font-semibold text-amber-100">{t(state.activeEnemy.key)}</h2>
          </div>
          <Button onClick={() => leave('flee')} variant="outline" className="border-white/15 bg-white/5 text-stone-100 hover:bg-white/10">
            {t('zone.prototype.flee')}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {combat.enemies.map((enemy) => {
                const intent = INTENT_DEFS[enemy.intent] || INTENT_DEFS.unknown;
                return (
                  <button
                    key={enemy.id}
                    onClick={() => setTargetId(enemy.id)}
                    disabled={enemy.hp <= 0}
                    title={t(intent.tooltipKey, { damage: intent.damage, armor: intent.armor, heal: intent.heal })}
                    className={`rounded-xl border p-3 text-left ${selectedTarget?.id === enemy.id ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.04]'} disabled:opacity-40`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-amber-100">{t(enemy.key)}</div>
                      <div className="rounded-full border border-rose-200/30 bg-rose-300/10 px-2 py-1 text-xs text-rose-100">{intent.icon} {t(intent.summaryKey, { damage: intent.damage, armor: intent.armor, heal: intent.heal })}</div>
                    </div>
                    <Meter label={t('card.prototype.hp')} value={enemy.hp} max={enemy.maxHp} tone="bg-rose-500" />
                    <StatusRow statuses={enemy.statuses} t={t} />
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-amber-100">{t('card.prototype.hand')}</div>
                <Button disabled={combat.phase !== 'player' || !!combat.winner} onClick={endTurn} className="bg-rose-700 text-white hover:bg-rose-600 disabled:opacity-50">
                  {t('card.prototype.endTurn')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {combat.hand.map((card) => {
                  const cost = getPlayableCost(card, combat);
                  const cannotPay = combat.ap < cost.apCost || combat.player.essence < cost.essenceCost;
                  return (
                    <button
                      key={card.instanceId}
                      disabled={combat.phase !== 'player' || !!combat.winner || cannotPay}
                      title={t(card.descriptionKey)}
                      onClick={() => play(card)}
                      className="min-h-40 rounded-xl border-2 border-amber-200/20 bg-gradient-to-b from-stone-800 to-stone-950 p-2 text-left shadow-lg transition hover:-translate-y-1 disabled:opacity-40"
                    >
                      <div className="text-xs font-semibold text-amber-100">{t(card.key)}</div>
                      <div className="mt-1 text-[10px] text-stone-400">{t(`card.type.${card.type}`)} · {cost.apCost} {t('card.prototype.ap')} · {cost.essenceCost} {t('card.prototype.essence')}</div>
                      <p className="mt-2 text-[11px] leading-snug text-stone-200">{t(card.descriptionKey)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <h3 className="text-sm font-semibold text-amber-100">{t('card.prototype.player')}</h3>
            <Meter label={t('card.prototype.hp')} value={combat.player.hp} max={combat.player.maxHp} tone="bg-emerald-500" />
            <Meter label={t('card.prototype.essence')} value={combat.player.essence} max={combat.player.maxEssence} tone="bg-cyan-400" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-white/10 bg-black/20 p-2">{t('card.prototype.armor')}: {combat.player.armor}</div>
              <div className="rounded border border-white/10 bg-black/20 p-2">{t('card.prototype.ap')}: {combat.ap}</div>
            </div>
            <StatusRow statuses={combat.player.statuses} t={t} />
            <div className="rounded-md border border-rose-200/20 bg-rose-300/10 p-2 text-xs text-rose-100">
              {preview.hpLoss > 0 ? t('card.preview.lossLine', { loss: preview.hpLoss }) : preview.totalIncoming > 0 ? t('card.preview.blockedLine') : t('card.preview.noAttackLine')}
            </div>
            {combat.winner && (
              <Button onClick={() => leave(combat.winner === 'player' ? 'victory' : 'defeat')} className="w-full bg-emerald-700 text-white hover:bg-emerald-600">
                {combat.winner === 'player' ? t('zone.prototype.returnAfterVictory') : t('zone.prototype.returnAfterDefeat')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThingList({ title, items, t, actionLabel = null, onAction = null }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-semibold text-amber-100">{title}</div>
      <div className="space-y-1.5">
        {items.length === 0 && <p className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-stone-500">{t('zone.prototype.noneHere')}</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-white/[0.04] px-2 py-1.5">
            <div className="text-xs text-stone-200">
              <span className="mr-1.5">{item.icon}</span>
              {t(item.key)}
              {item.roleKey && <div className="text-[10px] text-stone-500">{t(item.roleKey)}</div>}
            </div>
            {actionLabel && (
              <button onClick={() => onAction(item)} className="rounded bg-amber-600 px-2 py-1 text-[10px] text-white hover:bg-amber-500">
                {actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MoveButton({ label, onClick, disabled = false }) {
  return (
    <button disabled={disabled} onClick={onClick} className="h-10 rounded-md border border-white/10 bg-white/[0.06] text-stone-100 hover:bg-white/[0.12] disabled:opacity-25">
      {label}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-amber-200/10 bg-black/25 p-3">
      <h2 className="mb-3 text-sm font-semibold text-amber-100">{title}</h2>
      {children}
    </div>
  );
}

function Meter({ label, value, max, tone }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[11px] text-stone-300">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-black/50">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusRow({ statuses, t }) {
  const entries = Object.values(statuses || {}).filter((status) => status.stacks > 0);
  if (!entries.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {entries.map((status) => {
        const def = STATUS_DEFS[status.id] || { key: `card.status.${status.id}`, tooltipKey: `card.status.${status.id}.tip` };
        return (
          <span key={status.id} title={t(def.tooltipKey)} className="cursor-help rounded-full border border-amber-200/20 bg-black/35 px-2 py-1 text-[10px] text-amber-100">
            {t(def.key)} x{status.stacks}
          </span>
        );
      })}
    </div>
  );
}

function tileIcon(tile) {
  return {
    safe: '▫',
    ground: '·',
    grass: '♧',
    forest: '♣',
    cave: '▪',
    water: '~',
  }[tile] || '·';
}

export default function ZoneExplorationPrototype() {
  return (
    <LangProvider>
      <ZoneExplorationPrototypeInner />
    </LangProvider>
  );
}
