import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { ITEM_BY_ID } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { tierOf } from '@/game/config/aptitude';
import { appearanceOf } from '@/game/data/appearance';
import { zoneAt } from '@/game/data/world';
import BattleScene from './battle/BattleScene';
import BattleCommandMenu from './battle/BattleCommandMenu';
import { biomeOf } from './battle/biomes';
import PortraitFrame from './PortraitFrame';
import { sfx } from '@/game/audio/sfx';

const PATH_COLORS = {
  fire: '#ff8a4a', water: '#4aa8ff', wind: '#9fe8b0', earth: '#d9a04a',
  lightning: '#ffe95a', ice: '#a8e0ff', poison: '#b0e04a',
  darkness: '#a88ad8', blood: '#e06a6a', metal: '#c8ccd8', wood: '#8fc86a',
};

const STATUS_META = {
  burn: { icon: '🔥', tone: 'bg-orange-900/50 text-orange-200 border-orange-700/50' },
  poison: { icon: '☠️', tone: 'bg-purple-900/50 text-purple-200 border-purple-700/50' },
  stun: { icon: '💫', tone: 'bg-sky-900/50 text-sky-200 border-sky-700/50' },
  control: { icon: '⛓️', tone: 'bg-blue-900/50 text-blue-200 border-blue-700/50' },
  summon: { icon: '🐉', tone: 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50' },
  defense: { icon: '🛡️', tone: 'bg-stone-800/60 text-stone-200 border-stone-600/50' },
  evasion: { icon: '🌪️', tone: 'bg-teal-900/50 text-teal-200 border-teal-700/50' },
  barrier: { icon: '💠', tone: 'bg-cyan-900/50 text-cyan-200 border-cyan-700/50' },
  buff: { icon: '✨', tone: 'bg-amber-900/50 text-amber-200 border-amber-700/50' },
};

function guSound(gu, kinds) {
  if (kinds.heal || kinds.essence) return 'heal';
  if (kinds.investigate) return 'sense';
  if (isKillerMove(gu)) return 'killer';
  if (kinds.attack) return gu.path === 'fire' ? 'fire' : gu.path === 'wind' ? 'wind' : gu.path === 'earth' ? 'stone' : gu.path === 'water' ? 'water' : 'cast';
  return 'cast';
}

function Bar({ value, max, from, to, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-[10px] text-stone-400 leading-none mb-1">
        <span>{label}</span><span>{Math.floor(value)}/{max}</span>
      </div>
      <div className="h-2.5 sm:h-3 rounded-full bg-black/60 overflow-hidden border border-black/50">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${from},${to})` }} />
      </div>
    </div>
  );
}

function StatusChips({ statuses }) {
  if (!statuses?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {statuses.map((s, i) => (
        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_META[s.type]?.tone || 'bg-white/10 text-stone-300 border-stone-600/50'}`}>
          {STATUS_META[s.type]?.icon || '•'} {s.type}{s.duration}
        </span>
      ))}
    </div>
  );
}

// Fullscreen turn-based battle: staged scene up top, command interface at the
// bottom. Turns are paced — cast anticipation → action dispatch → impact VFX —
// instead of resolving instantly.
export default function CombatView() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const c = state.combat;
  const p = state.player;
  const enemy = c.enemy;
  const stage = CULTIVATION_STAGES[Math.min(19, p.rank * 4 + (p.stage || 0))];
  const app = appearanceOf(p);
  const tier = tierOf(p.aptitude);
  const biome = biomeOf(zoneAt(p.x, p.y)?.id, !!c.arena);

  const [fx, setFx] = useState(null);
  const [casting, setCasting] = useState(null);
  const [busy, setBusy] = useState(false);
  const prevLen = useRef(0);
  const pendingGu = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // battle start sting + entry flash
  useEffect(() => { sfx('encounter'); prevLen.current = c.log.length; }, []);

  // parse the newest battle log into animations + sounds
  const logLen = c.log.length;
  useEffect(() => {
    if (!logLen || c.over) return;
    const added = logLen - prevLen.current;
    prevLen.current = logLen;
    if (added <= 0) return;
    const lines = c.log.slice(-added);
    const gu = pendingGu.current;
    const kinds = {};
    let enemyDmg = 0, playerDmg = 0, dodge = false, block = false, crit = false, fail = false, heal = 0, essence = 0;
    let m;
    for (const l of lines) {
      if ((m = l.match(/strikes .*? for (\d+) damage/)) || (m = l.match(/is cut by thorns for (\d+) damage/))) enemyDmg += +m[1];
      else if (m = l.match(/enslaved beast strikes .*? for (\d+) damage/)) { enemyDmg += +m[1]; kinds.summon = true; }
      else if (m = l.match(/attacks for (\d+) damage/)) playerDmg += +m[1];
      else if (m = l.match(/suffers (\d+) burn damage/)) { enemyDmg += +m[1]; }
      else if (m = l.match(/You suffer (\d+) poison damage/)) playerDmg += +m[1];
      else if (m = l.match(/restores (\d+) HP/)) heal += +m[1];
      else if (m = l.match(/restores (\d+) essence/)) essence += +m[1];
      else if (l.includes('dodge')) dodge = true;
      else if (l.includes('barrier absorbs')) block = true;
      else if (l.includes('vulnerable')) crit = true;
      else if (l.includes('Not enough primeval essence') || l.includes('is on cooldown') || l.includes('fails to activate')) fail = true;
      else if (l.includes('set ablaze')) kinds.burn = true;
      else if (l.includes('blurs your form')) kinds.evasion = true;
      else if (l.includes('hardens your defense') || l.includes('brace behind')) kinds.defense = true;
      else if (l.includes('raises a barrier')) kinds.barrier = true;
      else if (l.includes('binds')) kinds.control = true;
      else if (l.includes('empowers your')) kinds.buff = true;
      else if (l.includes('answers the pact')) kinds.summon = true;
      else if (l.includes('reveals the enemy')) kinds.investigate = true;
    }
    if (gu) {
      for (const key of Object.keys(gu.effect || {})) kinds[key] = kinds[key] ?? key !== 'attack';
      if (gu.effect.attack) kinds.attack = true;
    }
    pendingGu.current = null;
    const castColor = gu ? PATH_COLORS[gu.path] || '#8fd8a0' : null;
    setFx({ key: logLen, gu, kinds, killer: !!(gu && isKillerMove(gu)), castColor, enemyDmg, playerDmg, dodge, block, crit, fail, heal, essence });
    if (fail) sfx('fail');
    else if (gu) sfx(guSound(gu, kinds));
    if (enemyDmg > 0) sfx(crit ? 'crit' : 'hit');
    if (playerDmg > 0) sfx('hurt');
    if (dodge) sfx('dodge');
    if (block) sfx('block');
  }, [logLen]);

  // outcome sting
  useEffect(() => {
    if (c.over) {
      if (c.result === 'victory') sfx('chime');
      else if (c.result === 'defeat') sfx('die');
    }
  }, [c.over]);

  // paced turn: anticipation → resolve → let the impact VFX breathe
  const act = (action, opts = {}) => {
    if (busy || c.over) return;
    const gu = opts.guInst ? GU_BY_ID[opts.guInst.guId] : null;
    const ms = opts.ms ?? (gu ? 650 : 250);
    setBusy(true);
    if (gu) { setCasting({ gu, color: PATH_COLORS[gu.path] || '#8fd8a0' }); sfx('cast'); }
    timers.current.push(setTimeout(() => {
      if (gu) pendingGu.current = gu;
      setCasting(null);
      dispatch({ type: 'PLAYER_ACTION', action, guInstanceId: opts.guInst?.instanceId, itemId: opts.itemId });
      timers.current.push(setTimeout(() => setBusy(false), 1300));
    }, ms));
  };

  const equippedCount = p.equippedGu.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0f0c] animate-pop">
      {/* encounter transition flash */}
      <div className="absolute inset-0 bg-white animate-battle-flash pointer-events-none z-10" />

      {/* ---- battlefield ---- */}
      <div className="relative flex-1 min-h-0">
        <BattleScene enemy={enemy} fx={fx} casting={casting} appearance={app} biome={biome} result={c.over ? c.result : null} />

        {/* enemy info panel */}
        <div className="absolute top-3 left-3 w-44 sm:w-64 rounded-xl bg-black/60 backdrop-blur border border-rose-900/60 p-2.5 sm:p-3 animate-pop">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-sm font-semibold text-rose-100 truncate">{enemy.name}</div>
            <div className="text-[10px] text-stone-400 shrink-0">ATK {enemy.attack} · DEF {enemy.defense}</div>
          </div>
          <Bar value={enemy.hp} max={enemy.maxHp} from="#9f1239" to="#fb7185" label={t('ui.hp')} />
          {c.revealed && (
            <div className="text-[10px] text-amber-300/80 mt-1">
              {t('battle.weakness')}: <span className="capitalize">{enemy.weakness === 'none' ? t('ui.none') : `${PATH_BY_ID[enemy.weakness]?.name || enemy.weakness}`}</span>
            </div>
          )}
          <StatusChips statuses={enemy.statuses} />
        </div>

        {/* player info panel */}
        <div className="absolute bottom-3 right-3 w-44 sm:w-64 rounded-xl bg-black/60 backdrop-blur border border-emerald-900/60 p-2.5 sm:p-3 animate-pop">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <PortraitFrame appearance={app} size={30} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-100 truncate">{p.name}</div>
                <div className="text-[9px] text-stone-400 truncate">{stage.name}</div>
              </div>
            </div>
            <div className="text-[9px] text-emerald-300/80 shrink-0 text-right leading-tight">
              {t(`apt.tier.${tier.id}`)}
            </div>
          </div>
          <Bar value={p.hp} max={p.maxHp} from="#e11d48" to="#fb7185" label={t('ui.hp')} />
          <div className="mt-1.5">
            <Bar value={p.primevalEssence} max={p.maxPrimevalEssence} from="#0284c7" to="#7dd3fc" label={t('ui.essence')} />
          </div>
          <StatusChips statuses={c.playerStatuses} />
        </div>

        {/* turn indicator */}
        {!c.over && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 border font-heading text-[11px] sm:text-xs tracking-widest whitespace-nowrap ${
            busy ? 'border-rose-700/50 text-rose-200' : 'border-emerald-600/50 text-emerald-200 animate-pulse'
          }`}>
            {busy ? t('battle.acting') : t('battle.turn')}
          </div>
        )}

        {/* secondary battle log — the animation is the main experience */}
        <div className="hidden sm:block absolute bottom-3 left-3 max-w-[30%] text-[10px] text-stone-400/90 space-y-0.5 pointer-events-none">
          {c.log.slice(-3).map((l, i, arr) => (
            <div key={i} className={i === arr.length - 1 ? 'text-emerald-200' : ''}>{l}</div>
          ))}
        </div>

        {/* outcome + rewards */}
        {c.over && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/40">
            <div className="max-w-sm w-full rounded-xl border-2 border-emerald-800/60 bg-[#0d1410]/95 p-4 animate-pop">
              <h2 className="text-xl font-heading font-semibold text-center text-emerald-100 mb-2">
                {c.result === 'victory' ? t('battle.victory') : c.result === 'flee' ? t('battle.escaped') : t('battle.defeat')}
              </h2>
              <div className="text-xs text-stone-400 space-y-1 mb-3 max-h-32 overflow-y-auto scrollbar-thin text-center">
                {c.log.slice(-6).map((l, i) => <div key={i}>{l}</div>)}
              </div>
              {c.result === 'victory' && c.rewards && (
                <div className="text-xs text-amber-200/90 space-y-0.5 mb-3 text-center">
                  {Object.keys(c.rewards.items).length > 0 && (
                    <div>{t('battle.loot')}: {Object.entries(c.rewards.items).map(([k, v]) => `${v} ${ITEM_BY_ID[k]?.name || k}`).join(', ')}</div>
                  )}
                  <div>{t('battle.stonesGain', { n: c.rewards.spiritStones, p: c.rewards.progress })}</div>
                  {(c.rewards.mastery || []).map((m, i) => (
                    <div key={i} className="text-emerald-300/90">{PATH_BY_ID[m.pathId].icon} {PATH_BY_ID[m.pathId].name} +{m.xp}</div>
                  ))}
                </div>
              )}
              <button onClick={() => { sfx('confirm'); dispatch({ type: 'END_COMBAT' }); }}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
                {t('ui.continue')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- bottom command interface ---- */}
      {!c.over && (
        <div className="shrink-0 bg-[#0c1310]/95 border-t-2 border-amber-900/40 px-2.5 sm:px-3 py-2.5">
          <BattleCommandMenu
            state={state}
            combat={c}
            busy={busy}
            onGu={(inst) => act('gu', { guInst: inst })}
            onItem={(itemId) => act('item', { itemId })}
            onDefend={() => act('defend')}
            onFlee={() => act('flee')}
          />
          <div className="hidden sm:block text-[9px] text-stone-600 text-center mt-1.5">{equippedCount} Gu equipped · {t('battle.log')} ↖</div>
        </div>
      )}
    </div>
  );
}