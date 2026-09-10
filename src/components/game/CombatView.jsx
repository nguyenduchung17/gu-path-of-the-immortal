import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { ITEM_BY_ID, ITEMS } from '@/game/data/items';
import { PATH_BY_ID } from '@/game/data/paths';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { effectiveCost } from '@/game/engine/combat';
import { appearanceOf } from '@/game/data/appearance';
import { zoneAt } from '@/game/data/world';
import BattleScene from './battle/BattleScene';
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
  switch (gu.path) {
    case 'fire': return 'fire';
    case 'wind': return 'wind';
    case 'earth': return 'stone';
    case 'water': return 'water';
    case 'enslavement': return 'summon';
    default: return 'cast';
  }
}

function Bar({ value, max, from, to, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="text-[10px] text-stone-400 mb-0.5">{label} {Math.floor(value)}/{max}</div>
      <div className="h-2.5 rounded-full bg-black/50 overflow-hidden border border-black/40">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${from},${to})` }} />
      </div>
    </div>
  );
}

export default function CombatView() {
  const { state, dispatch } = useGame();
  const c = state.combat;
  const p = state.player;
  const enemy = c.enemy;
  const stage = CULTIVATION_STAGES[Math.min(19, p.rank * 4 + (p.stage || 0))];
  const app = appearanceOf(p);
  const zone = zoneAt(p.x, p.y);
  const bgKind = c.arena ? 'arena' : (zone?.danger ?? 2) >= 3 ? 'dark' : 'forest';

  const [fx, setFx] = useState(null);
  const prevLen = useRef(0);
  const pendingGu = useRef(null);

  // battle start sting + entry flash
  useEffect(() => { sfx('encounter'); prevLen.current = state.combat?.log.length || 0; }, []);

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
      else if (l.includes('Not enough primeval essence') || l.includes('is on cooldown')) fail = true;
      else if (l.includes('set ablaze')) kinds.burn = true;
      else if (l.includes('blurs your form')) kinds.evasion = true;
      else if (l.includes('hardens your defense')) kinds.defense = true;
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
    // layered sound feedback
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

  const strikeWithGu = (inst) => {
    const gu = GU_BY_ID[inst.guId];
    pendingGu.current = gu;
    sfx('cast');
    dispatch({ type: 'PLAYER_ACTION', action: 'gu', guInstanceId: inst.instanceId });
  };

  if (c.over) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border-2 border-emerald-800/60 bg-[#0d1410] p-4 animate-pop">
          <div className="mb-3">
            <BattleScene enemy={enemy} fx={fx} appearance={app} bg={bgKind} result={c.result} />
          </div>
          <h2 className="text-xl font-heading font-semibold text-center text-emerald-100 mb-2">
            {c.result === 'victory' ? 'Victory' : c.result === 'flee' ? 'Escaped' : 'Defeated'}
          </h2>
          <div className="text-xs text-stone-400 space-y-1 mb-3 max-h-32 overflow-y-auto scrollbar-thin text-center">
            {c.log.slice(-8).map((l, i) => <div key={i}>{l}</div>)}
          </div>
          {c.result === 'victory' && c.rewards && (
            <div className="text-xs text-amber-200/90 space-y-0.5 mb-3 text-center">
              {Object.keys(c.rewards.items).length > 0 && <div>Loot: {Object.entries(c.rewards.items).map(([k, v]) => `${v} ${ITEM_BY_ID[k]?.name || k}`).join(', ')}</div>}
              <div>💎 +{c.rewards.spiritStones} primordial stones · ✦ +{c.rewards.progress}% cultivation</div>
              {(c.rewards.mastery || []).map((m, i) => (
                <div key={i} className="text-emerald-300/90">{PATH_BY_ID[m.pathId].icon} {PATH_BY_ID[m.pathId].name} mastery +{m.xp}</div>
              ))}
            </div>
          )}
          <button onClick={() => { sfx('confirm'); dispatch({ type: 'END_COMBAT' }); }} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">Continue</button>
        </div>
      </div>
    );
  }

  const equipped = state.player.equippedGu.map(id => state.ownedGu.find(g => g.instanceId === id)).filter(Boolean);
  const meds = ITEMS.filter(it => it.category === 'medicine' || it.category === 'food').filter(it => (state.inventory[it.category]?.[it.id] || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-[2px] flex items-center justify-center p-3">
      {/* encounter transition flash */}
      <div className="absolute inset-0 bg-white animate-battle-flash pointer-events-none" />
      <div className="max-w-lg w-full rounded-xl border-2 border-rose-900/60 bg-[#0d1410] p-4 animate-pop">
        {/* battle stage */}
        <div className="mb-3">
          <BattleScene enemy={enemy} fx={fx} appearance={app} bg={bgKind} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/10 p-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PortraitFrame appearance={app} size={34} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-100 truncate">{p.name}</div>
                  <div className="text-[9px] text-stone-400">{stage.name}</div>
                </div>
              </div>
            </div>
            <Bar value={p.hp} max={p.maxHp} from="#e11d48" to="#fb7185" label="HP" />
            <div className="mt-1.5"><Bar value={p.primevalEssence} max={p.maxPrimevalEssence} from="#0284c7" to="#7dd3fc" label="Essence" /></div>
            {c.playerStatuses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.playerStatuses.map((s, i) => (
                  <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_META[s.type]?.tone || 'bg-white/10 text-stone-300 border-stone-600/50'}`}>
                    {STATUS_META[s.type]?.icon || '•'} {s.type}{s.duration}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-rose-800/40 bg-rose-900/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-rose-100 truncate">{enemy.name}</div>
              <div className="text-[10px] text-stone-400 shrink-0">ATK {enemy.attack} · DEF {enemy.defense}</div>
            </div>
            <Bar value={enemy.hp} max={enemy.maxHp} from="#9f1239" to="#fb7185" label="HP" />
            {c.revealed && <div className="text-[10px] text-amber-300/80 mt-1">Weakness: <span className="capitalize">{enemy.weakness === 'none' ? 'none' : `${PATH_BY_ID[enemy.weakness]?.name || enemy.weakness} Path`}</span></div>}
            {enemy.statuses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {enemy.statuses.map((s, i) => (
                  <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_META[s.type]?.tone || 'bg-white/10 text-stone-300 border-stone-600/50'}`}>
                    {STATUS_META[s.type]?.icon || '•'} {s.type}{s.duration}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-24 overflow-y-auto scrollbar-thin text-[11px] text-stone-400 bg-black/30 rounded-lg p-2 mb-3 border border-stone-800">
          {c.log.slice(-7).map((l, i, arr) => <div key={i} className={i === arr.length - 1 ? 'text-emerald-200' : ''}>{l}</div>)}
        </div>

        <div className="text-[10px] text-stone-500 mb-1">Use Gu — cost ⚡ · cooldown ⏳ · mastery bonuses apply automatically:</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {equipped.map(inst => {
            const gu = GU_BY_ID[inst.guId];
            const path = PATH_BY_ID[gu.path];
            const cd = c.cooldowns[inst.instanceId] || 0;
            const cost = effectiveCost(gu, state);
            const noEssence = p.primevalEssence < cost;
            const disabled = cd > 0 || noEssence;
            const killer = isKillerMove(gu);
            return (
              <button key={inst.instanceId} disabled={disabled}
                onClick={() => strikeWithGu(inst)}
                className={`text-left px-2 py-1.5 rounded-lg text-xs border ${disabled ? 'border-stone-800 bg-stone-900/40 text-stone-500' : killer ? 'border-amber-500/50 bg-amber-900/20 text-amber-100 hover:bg-amber-800/30' : 'border-emerald-700/40 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-800/30'}`}>
                <div className="font-medium truncate">{killer && <span className="text-amber-300">★ </span>}{gu.name}</div>
                <div className={`text-[9px] ${disabled ? 'text-stone-500' : 'text-stone-400'}`}>{path.icon} {path.name} · ⚡{cost}{cd > 0 ? ` · ⏳${cd}` : ''}{gu.cooldown ? ` · CD ${gu.cooldown}` : ''}</div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {meds.map(it => (
            <button key={it.id} onClick={() => { sfx('ui'); dispatch({ type: 'PLAYER_ACTION', action: 'item', itemId: it.id }); }}
              className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-200">
              🧪 {it.name} ({state.inventory[it.category]?.[it.id]})
            </button>
          ))}
          <button onClick={() => { sfx('cancel'); dispatch({ type: 'PLAYER_ACTION', action: 'flee' }); }}
            className="text-[10px] px-2 py-1 rounded bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 ml-auto">
            🏃 Flee
          </button>
        </div>
      </div>
    </div>
  );
}