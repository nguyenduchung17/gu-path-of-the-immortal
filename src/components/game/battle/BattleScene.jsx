import React, { useEffect, useMemo, useState } from 'react';
import { getCharacterSheet, canvasURL, portraitDataURL } from '@/game/gfx/characterSprites';
import { appearanceOf } from '@/game/data/appearance';
import { makeBeastSheet, beastPalette } from '@/game/gfx/sprites';

// Pixel-art battle stage for turn-based combat — location-based backdrops,
// pose-animated combatants, and per-Gu / Killer Move effect layers.
// fx: { key, gu, kinds, killer, castColor, enemyDmg, playerDmg, dodge, block, crit, fail, heal, essence }
const BACKGROUNDS = {
  forest: {
    sky: 'linear-gradient(180deg, #101828 0%, #16222c 54%, #243524 55%, #1c2a1c 100%)',
    treeline: 'repeating-linear-gradient(90deg, #14291a 0 7px, #0f2015 7px 14px)',
    ground: 'repeating-linear-gradient(90deg, #2c4228 0 4px, #263a22 4px 8px)',
  },
  dark: {
    sky: 'linear-gradient(180deg, #0a0a18 0%, #14102a 54%, #1c1830 55%, #120e22 100%)',
    treeline: 'repeating-linear-gradient(90deg, #170f22 0 7px, #0e0a16 7px 14px)',
    ground: 'repeating-linear-gradient(90deg, #221a30 0 4px, #1a1426 4px 8px)',
  },
  arena: {
    sky: 'linear-gradient(180deg, #241c12 0%, #33281a 54%, #4a3a24 55%, #3a2e1e 100%)',
    treeline: 'repeating-linear-gradient(90deg, #4a3018 0 7px, #3a2413 7px 14px)',
    ground: 'repeating-linear-gradient(90deg, #5a4830 0 4px, #4e3e28 4px 8px)',
  },
};

export default function BattleScene({ enemy, fx, appearance, bg = 'forest', result }) {
  const sheet = getCharacterSheet(appearanceOf({ appearance }));
  const beast = useMemo(() => {
    const bs = makeBeastSheet(beastPalette(enemy.id));
    return { a: canvasURL(bs[0]), b: canvasURL(bs[1]) };
  }, [enemy.id]);
  const portrait = portraitDataURL(appearanceOf({ appearance }));
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((f) => 1 - f), 360);
    return () => clearInterval(t);
  }, []);

  const hit = fx || {};
  const k = hit.kinds || {};
  const col = hit.castColor || '#8fd8a0';
  const playerDefeat = result === 'defeat';
  const enemyDefeated = result === 'victory';

  // player pose: cast → strike → hurt, back to idle breathing
  let playerImg, playerCls = 'animate-battle-sway';
  if (playerDefeat) { playerImg = sheet.faint; playerCls = 'animate-battle-faint'; }
  else if (hit.fail) { playerImg = sheet.hurt.right[0]; playerCls = 'animate-battle-shake'; }
  else if (hit.playerDmg) { playerImg = sheet.hurt.right[0]; playerCls = 'animate-battle-shake'; }
  else if (k.attack && hit.enemyDmg) { playerImg = sheet.attack.right[1]; playerCls = 'animate-battle-lunge'; }
  else if (hit.gu) { playerImg = sheet.cast.right[tick]; }
  else { playerImg = sheet.frames.right[tick]; }
  const playerUrl = canvasURL(playerImg);

  // enemy pose: idle bob, attack lunge, hurt flash, defeat fall
  let enemyCls = '';
  let enemyStyle = {};
  if (enemyDefeated) enemyCls = 'animate-battle-defeat';
  else if (hit.playerDmg) enemyCls = 'animate-battle-lunge-r';
  else if (hit.enemyDmg) { enemyCls = 'animate-battle-shake'; enemyStyle = { filter: 'brightness(1.9) saturate(0.6)' }; }
  else enemyCls = 'animate-battle-sway';

  const isProjectile = k.attack && !k.burn && hit.castColor;

  return (
    <div className="relative h-44 sm:h-52 overflow-hidden border-2 border-emerald-950 rounded-lg" style={{ background: BACKGROUNDS[bg]?.sky }}>
      {/* backdrop layers */}
      <div className="absolute bottom-[44%] inset-x-0 h-5 opacity-70" style={{ background: BACKGROUNDS[bg]?.treeline }} />
      <div className="absolute bottom-0 inset-x-0 h-[45%] opacity-60" style={{ background: `${BACKGROUNDS[bg]?.ground}, repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 5px)` }} />
      {/* location badge */}
      <div className="absolute top-1.5 right-2 text-[9px] text-stone-400/80 bg-black/40 rounded-full px-2 py-0.5 font-heading tracking-widest">
        {bg === 'arena' ? 'DUELING RING' : bg === 'dark' ? 'FORBIDDEN WILDS' : 'GREEN VALLEY WILDS'}
      </div>

      {/* ---- player combatant ---- */}
      <div key={hit.key ? `p${hit.key}` : 'p'} className={`absolute left-[16%] bottom-5 w-14 h-[84px] ${playerCls}`}>
        <img src={playerUrl} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
        {hit.playerDmg ? (
          <span key={`pd${hit.key}`} className="absolute -top-3 left-1/2 font-heading text-lg text-rose-300 animate-battle-dmg" style={{ marginLeft: '-12px', textShadow: '1px 1px 0 #000' }}>
            -{hit.playerDmg}
          </span>
        ) : null}
        {hit.dodge && (
          <span key={`dd${hit.key}`} className="absolute -top-3 left-1/2 font-heading text-sm text-sky-200 animate-battle-dmg" style={{ marginLeft: '-18px', textShadow: '1px 1px 0 #000' }}>
            DODGE
          </span>
        )}
        {hit.block && (
          <span key={`bd${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-xs text-cyan-200 animate-battle-dmg" style={{ marginLeft: '-12px', textShadow: '1px 1px 0 #000' }}>
            BLOCK
          </span>
        )}
        {hit.fail && (
          <span key={`fd${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-xs text-rose-400 animate-battle-dmg" style={{ marginLeft: '-30px', textShadow: '1px 1px 0 #000' }}>
            ACTIVATION FAILED
          </span>
        )}
        {hit.heal > 0 && (
          <span key={`hd${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-sm text-emerald-300 animate-battle-dmg" style={{ marginLeft: '-8px', textShadow: '1px 1px 0 #000' }}>
            +{hit.heal}
          </span>
        )}
        {hit.essence > 0 && (
          <span key={`ed2${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-sm text-sky-300 animate-battle-dmg" style={{ marginLeft: '-8px', textShadow: '1px 1px 0 #000' }}>
            +{hit.essence}✦
          </span>
        )}
      </div>

      {/* player mini portrait */}
      <div className="absolute left-2.5 top-1.5 w-8 h-8 rounded-md overflow-hidden border border-amber-800/70 bg-black/60">
        <img src={portrait} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
      </div>

      {/* ---- Gu cast aura + projectile ---- */}
      {hit.gu && (
        <div key={`c${hit.key}`} className="absolute left-[17%] bottom-8 w-16 h-16 rounded-full animate-battle-cast"
          style={{ background: `radial-gradient(circle, ${col}cc, transparent 70%)` }} />
      )}
      {isProjectile && (
        <div key={`pj${hit.key}`} className="absolute left-[24%] bottom-12 w-2.5 h-2.5 rounded-full animate-battle-projectile"
          style={{ background: col, boxShadow: `0 0 8px 2px ${col}` }} />
      )}

      {/* ---- defensive / wind effects on player ---- */}
      {(k.barrier || k.defense) && (
        <>
          <div key={`sh${hit.key}`} className="absolute left-[14%] bottom-3 w-[72px] h-[96px] rounded-t-full border-2 border-cyan-300/60 animate-battle-bind"
            style={{ background: 'radial-gradient(ellipse at bottom, rgba(120,220,255,0.18), transparent 75%)' }} />
          {[0, 1, 2].map((i) => (
            <span key={`sr${hit.key}${i}`} className="absolute left-[15%] bottom-4 w-1.5 h-3 bg-stone-300 animate-battle-shards" style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </>
      )}
      {k.evasion && (
        <div key={`sw${hit.key}`} className="absolute left-[14%] bottom-5 w-[76px] h-[76px] rounded-full border-2 border-teal-200/60 animate-battle-swirl"
          style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
      )}
      {(hit.heal > 0 || hit.essence > 0) && (
        <div key={`au${hit.key}`} className="absolute left-[15%] bottom-4 w-[64px] h-[88px] animate-battle-aurarise"
          style={{ background: `radial-gradient(ellipse at bottom, ${hit.heal > 0 ? 'rgba(110,240,160,0.35)' : 'rgba(120,190,255,0.35)'}, transparent 70%)` }} />
      )}
      {k.summon && (
        <div key={`sm${hit.key}`} className="absolute left-[24%] bottom-4 w-10 h-10 animate-battle-cast"
          style={{ background: 'radial-gradient(circle, rgba(60,180,120,0.5), transparent 70%)', boxShadow: 'inset 0 0 12px rgba(60,180,120,0.4)' }} />
      )}

      {/* ---- enemy combatant ---- */}
      <div key={hit.key ? `e${hit.key}` : 'e'} className={`absolute right-[14%] bottom-5 w-16 h-16 ${enemyCls}`} style={enemyStyle}>
        <img src={tick ? beast.b : beast.a} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
        {hit.enemyDmg ? (
          <span key={`edmg${hit.key}`} className="absolute -top-3 left-1/2 font-heading text-lg text-amber-300 animate-battle-dmg" style={{ marginLeft: '-12px', textShadow: '1px 1px 0 #000' }}>
            -{hit.enemyDmg}
          </span>
        ) : null}
        {hit.crit && (
          <span key={`cr${hit.key}`} className="absolute -top-6 left-1/2 font-heading text-xs text-rose-300 animate-battle-dmg" style={{ marginLeft: '-32px', textShadow: '1px 1px 0 #000' }}>
            WEAKNESS!
          </span>
        )}
      </div>

      {/* ---- offensive / control effects on enemy ---- */}
      {hit.enemyDmg > 0 && !enemyDefeated && (
        <div key={`im${hit.key}`} className="absolute right-[17%] bottom-10 w-14 h-14 rounded-full border-2 animate-battle-impact"
          style={{ borderColor: col, background: `radial-gradient(circle, ${col}55, transparent 65%)` }} />
      )}
      {k.burn && (
        <div key={`br${hit.key}`} className="absolute right-[16%] bottom-5 w-14 h-14 animate-battle-aurarise"
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(255,120,40,0.5), transparent 70%)' }} />
      )}
      {k.control && (
        <div key={`cb${hit.key}`} className="absolute right-[16%] bottom-6 w-[72px] h-[72px] rounded-full border-2 border-dashed border-blue-300/70 animate-battle-bind" />
      )}
      {k.investigate && (
        <div key={`iv${hit.key}`} className="absolute right-[17%] bottom-10 w-14 h-14 rounded-full border-2 border-amber-200/70 animate-battle-bind"
          style={{ background: 'radial-gradient(circle, rgba(255,240,180,0.12), transparent 65%)' }} />
      )}

      {/* ---- Killer Move banner ---- */}
      {hit.killer && hit.gu && (
        <div key={`kb${hit.key}`} className="absolute inset-x-0 top-6 flex justify-center animate-battle-banner pointer-events-none">
          <div className="px-4 py-1 bg-black/80 border-y-2 border-amber-400/70 text-amber-200 font-heading text-sm tracking-widest shadow-[0_0_18px_rgba(252,211,77,0.4)]">
            ⚡ KILLER MOVE — {hit.gu.name}
          </div>
        </div>
      )}

      {/* ---- outcome banner ---- */}
      {result && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`px-6 py-2 bg-black/70 border-2 rounded-lg font-heading text-lg tracking-widest animate-pop ${
            result === 'victory' ? 'border-amber-400/70 text-amber-200' : result === 'flee' ? 'border-stone-500/70 text-stone-200' : 'border-rose-600/70 text-rose-300'
          }`}>
            {result === 'victory' ? 'VICTORY' : result === 'flee' ? 'ESCAPED' : 'DEFEATED'}
          </div>
        </div>
      )}
    </div>
  );
}