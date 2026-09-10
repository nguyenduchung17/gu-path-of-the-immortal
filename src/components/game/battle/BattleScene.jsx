import React, { useEffect, useRef, useState } from 'react';
import { makeHumanSheet, makeBeastSheet, beastPalette } from '@/game/gfx/sprites';

// Pixel-art battle stage for turn-based combat. The world stays exploration-
// style: same sprite language, but a dedicated battle presentation.
// fx: { key, enemyDmg, playerDmg, dodge, castColor, projectile }
export default function BattleScene({ enemy, fx }) {
  const cache = useRef({});
  if (!cache.current.player) {
    const sheet = makeHumanSheet({ robe: '#2f7a52', hair: '#141414' });
    cache.current.player = sheet.right[0].toDataURL();
  }
  if (!cache.current[enemy.id]) {
    const bs = makeBeastSheet(beastPalette(enemy.id));
    cache.current[enemy.id] = { a: bs[0].toDataURL(), b: bs[1].toDataURL() };
  }
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => 1 - f), 340);
    return () => clearInterval(t);
  }, []);
  const hit = fx || {};
  const beast = cache.current[enemy.id];

  return (
    <div
      className="relative h-40 sm:h-48 overflow-hidden border-2 border-emerald-950 rounded-lg"
      style={{ background: 'linear-gradient(180deg, #101828 0%, #16222c 54%, #243524 55%, #1c2a1c 100%)' }}
    >
      {/* distant treeline */}
      <div className="absolute bottom-[44%] inset-x-0 h-5 opacity-70" style={{ background: 'repeating-linear-gradient(90deg, #14291a 0 7px, #0f2015 7px 14px)' }} />
      {/* ground texture */}
      <div className="absolute bottom-0 inset-x-0 h-[45%] opacity-60" style={{ background: 'repeating-linear-gradient(90deg, #2c4228 0 4px, #263a22 4px 8px), repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 5px)' }} />

      {/* player combatant */}
      <div key={hit.key ? `p${hit.key}` : 'p'} className={`absolute left-[16%] bottom-5 w-12 h-[72px] ${hit.enemyDmg ? 'animate-battle-lunge' : ''}`}>
        <img src={cache.current.player} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
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
      </div>

      {/* casting aura + projectile */}
      {hit.castColor && (
        <div key={`c${hit.key}`} className="absolute left-[17%] bottom-6 w-14 h-14 rounded-full animate-battle-cast"
          style={{ background: `radial-gradient(circle, ${hit.castColor}bb, transparent 70%)` }} />
      )}
      {hit.projectile && hit.castColor && (
        <div key={`pj${hit.key}`} className="absolute left-[24%] bottom-12 w-2.5 h-2.5 rounded-full animate-battle-projectile"
          style={{ background: hit.castColor, boxShadow: `0 0 8px 2px ${hit.castColor}` }} />
      )}

      {/* enemy combatant */}
      <div key={hit.key ? `e${hit.key}` : 'e'} className={`absolute right-[14%] bottom-5 w-14 h-14 ${hit.enemyDmg ? 'animate-battle-shake' : ''}`}>
        <img src={frame ? beast.b : beast.a} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
        {hit.enemyDmg ? (
          <span key={`ed${hit.key}`} className="absolute -top-3 left-1/2 font-heading text-lg text-amber-300 animate-battle-dmg" style={{ marginLeft: '-12px', textShadow: '1px 1px 0 #000' }}>
            -{hit.enemyDmg}
          </span>
        ) : null}
      </div>
    </div>
  );
}