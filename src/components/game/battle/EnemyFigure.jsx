import React, { useEffect, useMemo, useState } from 'react';
import { getBeastSheet } from '@/game/gfx/beastSprites';
import { canvasURL } from '@/game/gfx/characterSprites';
import { intentView } from '@/game/engine/intent';
import { useT } from '@/game/i18n/LangContext';

// One combatant on the multi-enemy battlefield (#13, #47, #48, #49): its own
// sprite, pose, mini HP bar, intent badge, damage popup and control overlays.
// Leaders render larger with an aura and a crown (#9) so "that one is dangerous"
// reads at a glance.
export default function EnemyFigure({ e, combat, fx, sel, onPick, castColor }) {
  const { t } = useT();
  const beast = useMemo(() => {
    const bs = getBeastSheet(e.id);
    return {
      fit: bs.h > 16 ? 'h-full w-auto' : 'w-full h-full',
      idleA: canvasURL(bs.idle[0]), idleB: canvasURL(bs.idle[1]),
      attack: canvasURL(bs.attack), hurt: canvasURL(bs.hurt), defeat: canvasURL(bs.defeat),
    };
  }, [e.id]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const tm = setInterval(() => setTick((f) => 1 - f), 360);
    return () => clearInterval(tm);
  }, []);

  const hit = fx || {};
  const dmg = hit.enemyHits?.[e.uid] || 0;
  const k = hit.kinds || {};
  const defeated = e.hp <= 0;
  const leader = e.packRole === 'leader' || e.packLeader;
  const scale = leader ? 'scale-[1.3]' : '';
  const st = e.statuses || [];
  const has = (type) => st.some(s => s.type === type);
  const intent = !defeated && !combat.over ? intentView(combat, e) : null;

  let cls = 'animate-battle-sway';
  let img = tick ? beast.idleB : beast.idleA;
  let style = {};
  if (defeated) { cls = 'animate-battle-defeat'; img = beast.defeat; }
  else if (hit.playerDmg) { cls = 'animate-battle-lunge-r'; img = beast.attack; }
  else if (dmg > 0) { cls = 'animate-battle-shake'; img = beast.hurt; style = { filter: 'brightness(1.9) saturate(0.6)' }; }

  const base = 'w-[80px] h-[80px] sm:w-[120px] sm:h-[120px]';
  const col = castColor || '#8fd8a0';

  return (
    <button
      onClick={() => !defeated && onPick?.(e.uid)}
      className={`relative flex flex-col items-center ${defeated ? 'opacity-80' : 'cursor-pointer'}`}>
      {/* intent badge (#29) — the committed plan, at the player's scouting level */}
      {intent && (
        <span className="mb-0.5 px-1.5 py-0.5 rounded-full bg-black/70 border border-white/15 text-[8px] sm:text-[9px] text-amber-200 whitespace-nowrap pointer-events-none">
          {intent.icon} {!intent.revealed && !intent.heavy ? t(intent.roughKey).slice(0, 14) : (intent.name || t(intent.labelKey)).slice(0, 16)}
        </span>
      )}
      <div className={`relative ${base} ${cls} ${scale}`} style={style}>
        <img src={img} className={beast.fit} style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
        {leader && (
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] leading-none text-amber-300 pointer-events-none"
            style={{ textShadow: '1px 1px 0 #000' }}>♛</span>
        )}
        {/* selection highlight (#14, #49) */}
        {sel && !defeated && (
          <span className="absolute -inset-1 rounded-full border-2 border-amber-400/90 animate-pulse pointer-events-none"
            style={{ boxShadow: '0 0 16px rgba(252,211,77,0.45)' }} />
        )}
        {/* per-target damage popup (#48) — every hit enemy reacts visibly */}
        {dmg > 0 && (
          <span className="absolute -top-3 left-1/2 font-heading text-xl sm:text-2xl text-amber-300 animate-battle-dmg pointer-events-none"
            style={{ marginLeft: '-16px', textShadow: '2px 2px 0 #000' }}>-{dmg}</span>
        )}
        {/* impact ring on targets this action actually hit (#48) */}
        {dmg > 0 && !defeated && (
          <span className="absolute inset-0 rounded-full border-2 animate-battle-impact pointer-events-none"
            style={{ borderColor: col, background: `radial-gradient(circle, ${col}66, transparent 65%)` }} />
        )}
        {/* persistent control overlays per enemy */}
        {has('frozen') && <span className="absolute inset-0 rounded-lg border-2 border-cyan-200/80 animate-battle-bind pointer-events-none"
          style={{ background: 'linear-gradient(160deg, rgba(190,235,255,0.35), rgba(120,190,255,0.12))' }} />}
        {has('paralysis') && <span className="absolute inset-0 rounded-full border-2 border-yellow-300/80 animate-battle-bind pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,240,120,0.20), transparent 65%)' }} />}
        {has('burn') && <span className="absolute inset-x-2 bottom-0 h-2/3 animate-battle-aurarise pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(255,120,40,0.55), transparent 70%)' }} />}
        {has('poison') && <span className="absolute inset-x-2 bottom-0 h-2/3 animate-battle-aurarise pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(150,230,60,0.5), transparent 70%)' }} />}
        {has('broken') && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 font-heading text-[9px] text-amber-200 animate-battle-dmg pointer-events-none"
            style={{ textShadow: '1px 1px 0 #000' }}>{t('battle.broken')}</span>
        )}
      </div>
      {/* shadow + mini HP bar (#14) */}
      <div className="w-16 h-4 sm:w-28 sm:h-6 rounded-[50%] bg-black/45" />
      <div className="w-16 sm:w-24 h-1.5 mt-0.5 rounded-full bg-black/60 overflow-hidden border border-black/50">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%`, background: 'linear-gradient(90deg,#9f1239,#fb7185)' }} />
      </div>
      <span className={`text-[8px] sm:text-[9px] mt-0.5 font-heading tracking-wide truncate max-w-[88px] sm:max-w-[120px] ${sel ? 'text-amber-200' : 'text-stone-400'}`}>
        {e.label}
      </span>
    </button>
  );
}