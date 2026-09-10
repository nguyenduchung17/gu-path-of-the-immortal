import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { GU_BY_ID, isKillerMove } from '@/game/data/gu';
import { ITEM_BY_ID } from '@/game/data/items';
import { visualOf, DANGER_LABEL } from '@/game/data/enemies';
import { PATH_BY_ID } from '@/game/data/paths';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { tierOf } from '@/game/config/aptitude';
import { appearanceOf } from '@/game/data/appearance';
import { zoneAt } from '@/game/data/world';
import BattleScene from './battle/BattleScene';
import BattleCommandMenu from './battle/BattleCommandMenu';
import Timeline from './battle/Timeline';
import TargetSelect from './battle/TargetSelect';
import { biomeOf } from './battle/biomes';
import IntentPanel from './battle/IntentPanel';
import { weatherOf } from '@/game/engine/weather';
import PortraitFrame from './PortraitFrame';
import { sfx } from '@/game/audio/sfx';

const PATH_COLORS = {
  fire: '#ff8a4a', water: '#4aa8ff', wind: '#9fe8b0', earth: '#d9a04a',
  lightning: '#ffe95a', ice: '#a8e0ff', poison: '#b0e04a',
  darkness: '#a88ad8', blood: '#e06a6a', metal: '#c8ccd8', wood: '#8fc86a',
  sword: '#dfe4f8',
};

// Every status shows icon, remaining duration and stacks — hover for details.
const STATUS_META = {
  burn: { icon: '🔥', label: 'Burn', desc: 'Fire damage every action — stacks.', tone: 'bg-orange-900/50 text-orange-200 border-orange-700/50' },
  poison: { icon: '☠️', label: 'Poison', desc: 'Venom damage every action — stacks.', tone: 'bg-purple-900/50 text-purple-200 border-purple-700/50' },
  stun: { icon: '💫', label: 'Stun', desc: 'Cannot act — charged attacks are interrupted.', tone: 'bg-sky-900/50 text-sky-200 border-sky-700/50' },
  control: { icon: '⛓️', label: 'Bound', desc: 'Attacks weakened by the binding.', tone: 'bg-blue-900/50 text-blue-200 border-blue-700/50' },
  summon: { icon: '🐉', label: 'Beast Pact', desc: 'Your enslaved beast strikes every action.', tone: 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50' },
  defense: { icon: '🛡️', label: 'Defense', desc: 'Reduces incoming damage.', tone: 'bg-stone-800/60 text-stone-200 border-stone-600/50' },
  evasion: { icon: '🌪️', label: 'Evasion', desc: 'Chance to dodge attacks.', tone: 'bg-teal-900/50 text-teal-200 border-teal-700/50' },
  barrier: { icon: '💠', label: 'Barrier', desc: 'Absorbs damage until it shatters — shows remaining strength · actions.', tone: 'bg-cyan-900/50 text-cyan-200 border-cyan-700/50' },
  buff: { icon: '✨', label: 'Empower', desc: 'Element Gu damage increased.', tone: 'bg-amber-900/50 text-amber-200 border-amber-700/50' },
  haste: { icon: '💨', label: 'Haste', desc: 'Actions come sooner.', tone: 'bg-teal-900/50 text-teal-200 border-teal-600/50' },
  slow: { icon: '🕸️', label: 'Slow', desc: 'Actions come later.', tone: 'bg-slate-800/60 text-slate-200 border-slate-500/50' },
  guard: { icon: '🛡️', label: 'Guard', desc: 'Incoming damage reduced.', tone: 'bg-stone-700/60 text-stone-100 border-stone-400/50' },
  focus: { icon: '🎯', label: 'Focus', desc: 'Killer Move activation chance increased.', tone: 'bg-amber-900/50 text-amber-200 border-amber-600/50' },
  weakness: { icon: '💔', label: 'Exposed', desc: 'Takes increased damage.', tone: 'bg-rose-900/50 text-rose-200 border-rose-600/50' },
  armorBreak: { icon: '🔨', label: 'Armor Break', desc: 'Defense reduced.', tone: 'bg-orange-900/50 text-orange-200 border-orange-600/50' },
  soaked: { icon: '💧', label: 'Soaked', desc: 'Lightning bites deeper; fire scalds.', tone: 'bg-sky-900/50 text-sky-200 border-sky-600/50' },
  broken: { icon: '⚡', label: 'BROKEN', desc: 'Guard shattered — takes more damage, acts late.', tone: 'bg-amber-800/60 text-amber-100 border-amber-400/60' },
  paralysis: { icon: '⚡', label: 'Paralyzed', desc: 'Loses its next action. Nerves harden after it lands.', tone: 'bg-yellow-900/50 text-yellow-200 border-yellow-600/50' },
  frozen: { icon: '❄️', label: 'Frozen', desc: 'Loses its next action — charged attacks are interrupted.', tone: 'bg-sky-900/50 text-sky-100 border-cyan-500/50' },
  momentum: { icon: '💨', label: 'Wind Momentum', desc: 'Each stack: +5% Speed. Lasts the whole battle (max 5).', tone: 'bg-teal-900/50 text-teal-200 border-teal-600/50' },
  ccResist: { icon: '🧿', label: 'Hardened', desc: 'Control resistance +30% — paralysis and freeze land less often.', tone: 'bg-indigo-900/50 text-indigo-200 border-indigo-600/50' },
  demoralized: { icon: '🏳️', label: 'Demoralized', desc: 'Its leader has fallen — damage and speed reduced.', tone: 'bg-stone-800/60 text-stone-300 border-stone-500/50' },
};

// scouting: what an enemy's status resistances look like on the panel
const STATUS_RESIST_ICON = { burn: '🔥', poison: '☠️', paralysis: '⚡', freeze: '❄️' };

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

// Chips are grouped per status type: stacks collapse into one chip with a ×n
// count, every chip shows the remaining duration, barriers show remaining
// absorb strength — hover any chip for its full description.
function StatusChips({ statuses }) {
  if (!statuses?.length) return null;
  const groups = [];
  for (const s of statuses) {
    if (s.type === 'barrier') { groups.push({ type: s.type, count: 1, power: s.power || 0, duration: s.duration }); continue; }
    const g = groups.find(x => x.type === s.type);
    if (g) { g.count++; g.power = Math.max(g.power, s.power || 0); g.duration = Math.max(g.duration, s.duration); }
    else groups.push({ type: s.type, count: 1, power: s.power || 0, duration: s.duration });
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {groups.map((g, i) => {
        const meta = STATUS_META[g.type];
        const value = g.type === 'barrier' ? `${g.power}·${g.duration}`
          : g.type === 'momentum' ? `×${g.count}`
          : g.type === 'demoralized' ? '—'
          : `${g.count > 1 ? `×${g.count} ` : ''}${g.duration}`;
        return (
          <span key={i} title={`${meta?.label || g.type} — ${meta?.desc || ''}`}
            className={`text-[9px] px-1.5 py-0.5 rounded border ${meta?.tone || 'bg-white/10 text-stone-300 border-stone-600/50'}`}>
            {meta?.icon || '•'} {value}
          </span>
        );
      })}
    </div>
  );
}

// Fullscreen turn-based battle: staged scene up top, command interface at the
// bottom. Turns are paced — cast anticipation → action dispatch → impact VFX —
// instead of resolving instantly. Multi-enemy packs interleave on one timeline;
// single-target actions aim at the selected enemy (#14), and every hit foe
// shows its own damage number (#48).
export default function CombatView() {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const c = state.combat;
  const p = state.player;
  const enemies = c.enemies || [c.enemy];
  const living = enemies.filter(e => e.hp > 0);
  const stage = CULTIVATION_STAGES[Math.min(19, p.rank * 4 + (p.stage || 0))];
  const app = appearanceOf(p);
  const tier = tierOf(p.aptitude);
  const biome = biomeOf(zoneAt(p.x, p.y)?.id, !!c.arena);
  const weather = weatherOf(state.time);

  // the selected target — an explicit tactical choice (#14), falling back to
  // the primary foe; clicking a figure or a target card re-aims it
  const [targetUid, setTargetUid] = useState(c.primaryUid);
  const sel = living.find(e => e.uid === targetUid) || living[0] || enemies[0];
  const selUid = sel?.uid;

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
    let playerDmg = 0, dodge = false, block = false, crit = false, fail = false, heal = 0, essence = 0;
    let statusText = null, playerStatusText = null;
    let m;
    for (const l of lines) {
      if ((m = l.match(/enslaved beast strikes .*? for (\d+) damage/))) { kinds.summon = true; }
      else if ((m = l.match(/attacks for (\d+) damage/))) playerDmg += +m[1];
      else if ((m = l.match(/hits you for (\d+) damage/))) playerDmg += +m[1];
      else if ((m = l.match(/sinks its fangs in for (\d+) damage/))) playerDmg += +m[1];
      else if ((m = l.match(/You suffer (\d+) poison damage/))) playerDmg += +m[1];
      else if ((m = l.match(/restores (\d+) HP/))) heal += +m[1];
      else if ((m = l.match(/restores (\d+) essence/))) essence += +m[1];
      else if (l.includes('dodge')) dodge = true;
      else if (l.includes('barrier absorbs')) block = true;
      else if (l.includes('vulnerable')) crit = true;
      else if (l.includes('Not enough primeval essence') || l.includes('is on cooldown') || l.includes('fails to activate')) fail = true;
      else if (l.includes('set ablaze')) kinds.burn = true;
      else if ((m = l.match(/\+(\d+) essence/))) essence += +m[1];
      else if (l.includes('PARALYZED')) { kinds.paralysis = true; statusText = t('battle.paralyzed'); }
      else if (l.includes('FROZEN solid')) { kinds.frozen = true; statusText = t('battle.frozen'); }
      else if ((m = l.match(/POISON ×(\d+)/))) { kinds.poison = true; statusText = t('battle.poisonStack', { n: m[1] }); }
      else if ((m = l.match(/WIND MOMENTUM \+(\d+)/))) { kinds.momentum = true; playerStatusText = t('battle.momentumGain', { n: m[1] }); }
      else if (l.includes('Stone Guard braces')) kinds.defense = true;
      else if (l.includes('blurs your form')) kinds.evasion = true;
      else if (l.includes('hardens your defense') || l.includes('brace behind')) kinds.defense = true;
      else if (l.includes('raises a barrier')) kinds.barrier = true;
      else if (l.includes('binds')) kinds.control = true;
      else if (l.includes('empowers your')) kinds.buff = true;
      else if (l.includes('answers the pact')) kinds.summon = true;
      else if (l.includes('reveals the enemy') || l.includes('intent — weaknesses')) kinds.investigate = true;
      else if (l.includes('guard SHATTERS')) kinds.broken = true;
      else if (l.includes('feasts on the burning')) crit = true;
      else if (l.includes('blunts')) block = true;
      else if (l.includes('quickens your form')) kinds.haste = true;
      else if (l.includes('HOWLS')) kinds.haste = true;
    }
    if (gu) {
      for (const key of Object.keys(gu.effect || {})) {
        if (key === 'target') continue;
        kinds[key] = kinds[key] ?? key !== 'attack';
      }
      if (gu.effect.attack) kinds.attack = true;
    }
    pendingGu.current = null;
    const castColor = gu ? PATH_COLORS[gu.path] || '#8fd8a0' : null;
    // per-enemy damage comes from the engine's exact HP deltas (#48) —
    // every hit figure shows its own number, all of them react
    const enemyHits = { ...(c.lastHits || {}) };
    const enemyDmg = Object.values(enemyHits).reduce((a, b) => a + b, 0);
    setFx({ key: logLen, gu, kinds, killer: !!(gu && isKillerMove(gu)), castColor, enemyHits, enemyDmg, playerDmg, dodge, block, crit, fail, heal, essence, statusText, playerStatusText });
    if (kinds.broken) sfx('crit');
    if (fail) sfx('fail');
    else if (gu) sfx(guSound(gu, kinds));
    if (enemyDmg > 0) sfx(crit ? 'crit' : 'hit');
    if (playerDmg > 0) sfx('hurt');
    if (dodge) sfx('dodge');
    if (block) sfx('block');
    if (kinds.paralysis || kinds.frozen) sfx('crit');
    if (kinds.momentum) sfx('wind');
    if (kinds.poison) sfx('cast');
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
      dispatch({ type: 'PLAYER_ACTION', action, guInstanceId: opts.guInst?.instanceId, itemId: opts.itemId, targetUid: selUid });
      timers.current.push(setTimeout(() => setBusy(false), 1300));
    }, ms));
  };

  const equippedCount = p.equippedGu.length;
  const telegraphs = living.filter(e => e.telegraph);
  const selLeader = sel && (sel.packRole === 'leader' || sel.packLeader);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0a0f0c] animate-pop">
      {/* encounter transition flash */}
      <div className="absolute inset-0 bg-white animate-battle-flash pointer-events-none z-10" />

      {/* ---- battlefield ---- */}
      <div className="relative flex-1 min-h-0">
        <BattleScene combat={c} enemies={enemies} fx={fx} casting={casting} appearance={app} biome={biome}
          result={c.over ? c.result : null} targetUid={selUid} onTarget={setTargetUid} />

        {/* selected-enemy info panel (#14) */}
        {sel && (
          <div className="absolute top-3 left-3 w-44 sm:w-64 rounded-xl bg-black/60 backdrop-blur border border-rose-900/60 p-2.5 sm:p-3 animate-pop">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-sm font-semibold text-rose-100 truncate flex items-center gap-1">
                {selLeader && <span className="text-amber-300" title={t('battle.leader')}>♛</span>}
                {sel.label}
              </div>
              <div className="text-[10px] text-stone-400 shrink-0">ATK {sel.attack} · DEF {sel.defense} · {t('battle.spd')} {sel.baseSpeed}</div>
            </div>
            <div className="text-[9px] text-stone-400 -mt-1 mb-1">
              {selLeader && <span className="text-amber-300 font-semibold">♛ {t('battle.leader')} · </span>}
              {sel.elite && <span className="text-rose-400 font-semibold">☠ {t('battle.elite')} · </span>}
              {visualOf(sel.id).rank}{!c.arena && !c.trial ? ` · ${DANGER_LABEL[visualOf(sel.id).danger] || ''}` : ''}
            </div>
            <Bar value={sel.hp} max={sel.maxHp} from="#9f1239" to="#fb7185" label={t('ui.hp')} />
            <div className="mt-1.5">
              <Bar value={sel.stability ?? sel.maxStability} max={sel.maxStability} from="#64748b" to="#cbd5e1"
                label={sel.statuses?.some(s => s.type === 'broken') ? t('battle.broken') : t('battle.guard')} />
            </div>
            {c.revealed && (
              <div className="text-[10px] text-amber-300/80 mt-1">
                {t('battle.weakness')}: <span className="capitalize">{sel.weakness === 'none' ? t('ui.none') : `${PATH_BY_ID[sel.weakness]?.name || sel.weakness}`}</span>
              </div>
            )}
            {c.revealed && sel.resists?.length > 0 && (
              <div className="text-[10px] text-sky-300/80 mt-0.5">
                {t('battle.resists')}: {sel.resists.map(p2 => PATH_BY_ID[p2]?.name || p2).join(' · ')}
              </div>
            )}
            {c.revealed && sel.statusResist && (
              <div className="text-[9px] text-stone-400 mt-0.5">
                {t('battle.statusResists')}: {Object.entries(sel.statusResist)
                  .map(([k2, v]) => `${STATUS_RESIST_ICON[k2] || k2} ${v >= 100 ? t('battle.resImmune') : `${v}%`}`).join(' · ')}
              </div>
            )}
            {!c.over && <IntentPanel combat={c} enemy={sel} />}
            <StatusChips statuses={sel.statuses} />
          </div>
        )}

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
              <div className="text-stone-400">{t('battle.spd')} {c.speeds?.player ?? '—'}</div>
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

        {/* action timeline — who acts next, so the player can plan ahead */}
        {!c.over && <Timeline combat={c} />}

        {/* telegraphed heavy moves — answer with Defend, delay, a stun or a BREAK */}
        {!c.over && telegraphs.length > 0 && (
          <div className="absolute top-[76px] left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/60 text-[10px] text-amber-200 font-heading tracking-wide animate-pulse whitespace-nowrap pointer-events-none max-w-[92vw] truncate">
            ⚠ {telegraphs.map(e2 => `${e2.label} prepares ${e2.telegraph.name}`).join(' · ')}
          </div>
        )}

        {/* battlefield terrain — Gu power shifts with the ground */}
        {c.terrain && !c.over && (
          <div className="absolute top-12 right-3 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur border border-emerald-800/60 text-[10px] text-stone-300 whitespace-nowrap animate-pop pointer-events-none">
            ⛰ {t('intent.terrain')} · <span className="text-emerald-200/80">
              {Object.entries(c.terrain).map(([p2, mm]) => `${PATH_BY_ID[p2]?.name || p2} ${mm > 0 ? '+' : ''}${mm}%`).join(' · ')}
            </span>
          </div>
        )}

        {/* weather conditions — Gu power shifts with the sky */}
        {weather.id !== 'clear' && !c.over && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur border border-stone-700/60 text-[10px] text-stone-300 whitespace-nowrap animate-pop">
            {weather.icon} {t(`weather.${weather.id}`)} · <span className="text-amber-200/80">
              {Object.entries(weather.mods).map(([p2, mm]) => `${PATH_BY_ID[p2]?.name || p2} ${mm > 0 ? '+' : ''}${mm}%`).join(' · ')}
            </span>
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
                {c.result === 'victory' ? t('battle.victory') : c.result === 'trial' ? t('battle.trial') : c.result === 'flee' ? t('battle.escaped') : t('battle.defeat')}
              </h2>
              <div className="text-xs text-stone-400 space-y-1 mb-3 max-h-32 overflow-y-auto scrollbar-thin text-center">
                {c.log.slice(-6).map((l, i) => <div key={i}>{l}</div>)}
              </div>
              {c.result === 'victory' && c.rewards && (
                <div className="text-xs text-amber-200/90 space-y-0.5 mb-3 text-center">
                  {Object.keys(c.rewards.items).length > 0 && (
                    <div>{t('battle.loot')}: {Object.entries(c.rewards.items).map(([k2, v]) => `${v} ${ITEM_BY_ID[k2]?.name || k2}`).join(', ')}</div>
                  )}
                  <div>{t('battle.stonesGain', { n: c.rewards.spiritStones, p: c.rewards.progress })}</div>
                  {c.rewards.insight > 0 && <div className="text-violet-300/90">✧ {t('cult.insight')} +{c.rewards.insight}</div>}
                  {(c.rewards.mastery || []).map((mm, i) => (
                    <div key={i} className="text-emerald-300/90">{PATH_BY_ID[mm.pathId].icon} {PATH_BY_ID[mm.pathId].name} +{mm.xp}</div>
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
          <TargetSelect combat={c} targetUid={selUid} onPick={setTargetUid} />
          <BattleCommandMenu
            state={state}
            combat={c}
            busy={busy}
            onGu={(inst) => act('gu', { guInst: inst })}
            onItem={(itemId) => act('item', { itemId })}
            onStrike={() => act('strike')}
            onObserve={() => act('observe')}
            onDefend={() => act('defend')}
            onFlee={() => act('flee')}
          />
          <div className="hidden sm:block text-[9px] text-stone-600 text-center mt-1.5">{equippedCount} Gu equipped · {t('battle.log')} ↖</div>
        </div>
      )}
    </div>
  );
}