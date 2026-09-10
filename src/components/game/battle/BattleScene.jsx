import React, { useEffect, useMemo, useState } from 'react';
import { getCharacterSheet, canvasURL } from '@/game/gfx/characterSprites';
import { appearanceOf } from '@/game/data/appearance';
import { getBeastSheet } from '@/game/gfx/beastSprites';
import { useT } from '@/game/i18n/LangContext';

// Fullscreen pixel-art battle stage: location-based backdrops, staged combatants
// on opposing sides with perspective ground, pose animation, cast anticipation,
// per-Gu VFX and Killer Move presentation.
// fx: { key, gu, kinds, killer, castColor, enemyDmg, playerDmg, dodge, block, crit, fail, heal, essence }
export default function BattleScene({ enemy, fx, casting, appearance, biome, result }) {
  const { t } = useT();
  const sheet = getCharacterSheet(appearanceOf({ appearance }));
  const beast = useMemo(() => {
    const bs = getBeastSheet(enemy.id);
    return {
      fit: bs.h > 16 ? 'h-full w-auto' : 'w-full h-full',
      idleA: canvasURL(bs.idle[0]), idleB: canvasURL(bs.idle[1]),
      attack: canvasURL(bs.attack), hurt: canvasURL(bs.hurt), defeat: canvasURL(bs.defeat),
    };
  }, [enemy.id]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((f) => 1 - f), 360);
    return () => clearInterval(t);
  }, []);

  const hit = fx || {};
  const k = hit.kinds || {};
  const col = casting?.color || hit.castColor || '#8fd8a0';
  const playerDefeat = result === 'defeat';
  const enemyDefeated = result === 'victory';

  // player pose: cast anticipation → strike → hurt, back to idle breathing
  let playerImg, playerCls = 'animate-battle-sway';
  if (playerDefeat) { playerImg = sheet.faint; playerCls = 'animate-battle-faint'; }
  else if (hit.fail) { playerImg = sheet.hurt.right[0]; playerCls = 'animate-battle-shake'; }
  else if (hit.playerDmg) { playerImg = sheet.hurt.right[0]; playerCls = 'animate-battle-shake'; }
  else if (k.attack && hit.enemyDmg) { playerImg = sheet.attack.right[1]; playerCls = 'animate-battle-lunge'; }
  else if (casting || hit.gu) { playerImg = sheet.cast.right[tick]; playerCls = ''; }
  else playerImg = sheet.frames.right[tick];
  const playerUrl = canvasURL(playerImg);

  // enemy pose — species sprite reacts: lunging attack / recoil / collapse
  let enemyCls = '';
  let enemyStyle = {};
  let enemyImg = beast.idleA;
  if (enemyDefeated) { enemyCls = 'animate-battle-defeat'; enemyImg = beast.defeat; }
  else if (hit.playerDmg) { enemyCls = 'animate-battle-lunge-r'; enemyImg = beast.attack; }
  else if (hit.enemyDmg) { enemyCls = 'animate-battle-shake'; enemyImg = beast.hurt; enemyStyle = { filter: 'brightness(1.9) saturate(0.6)' }; }
  else { enemyCls = 'animate-battle-sway'; enemyImg = tick ? beast.idleB : beast.idleA; }

  const isProjectile = k.attack && !k.burn && (casting?.color || hit.castColor);
  const quake = hit.killer && hit.enemyDmg > 0 && !enemyDefeated;

  return (
    <div className={`absolute inset-0 overflow-hidden ${quake ? 'animate-battle-quake' : ''}`} style={{ background: biome.sky }}>
      {/* backdrop layers — horizon + perspective ground */}
      <div className="absolute bottom-[40%] inset-x-0 h-12 opacity-70" style={{ background: biome.midline }} />
      <div className="absolute bottom-0 inset-x-0 h-[40%] opacity-70"
        style={{ background: `${biome.ground}, repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 3px, transparent 3px 7px)` }} />
      {biome.mist && <div className="absolute bottom-[36%] inset-x-0 h-24" style={{ background: `linear-gradient(180deg, transparent, ${biome.mist}, transparent)` }} />}
      {/* location badge */}
      <div className="absolute top-3 right-3 text-[10px] text-stone-300/90 bg-black/50 rounded-full px-3 py-1 font-heading tracking-widest border border-white/10">
        {t(biome.labelKey)}
      </div>

      {/* ---- ENEMY side (far, upper right) ---- */}
      <div className="absolute right-[12%] sm:right-[16%] bottom-[34%] sm:bottom-[36%] flex flex-col items-center">
        <div key={hit.key ? `e${hit.key}` : 'e'} className={`relative w-[92px] h-[92px] sm:w-[150px] sm:h-[150px] ${enemyCls}`} style={enemyStyle}>
          <img src={enemyImg} className={beast.fit} style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
          {hit.enemyDmg ? (
            <span key={`edmg${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-2xl sm:text-3xl text-amber-300 animate-battle-dmg" style={{ marginLeft: '-18px', textShadow: '2px 2px 0 #000' }}>
              -{hit.enemyDmg}
            </span>
          ) : null}
          {hit.crit && (
            <span key={`cr${hit.key}`} className="absolute -top-9 left-1/2 font-heading text-xs sm:text-sm text-rose-300 animate-battle-dmg" style={{ marginLeft: '-40px', textShadow: '2px 2px 0 #000' }}>
              {t('battle.weakness')}
            </span>
          )}
        </div>
        <div className="w-24 h-5 sm:w-40 sm:h-7 rounded-[50%] bg-black/45 mt-1" />
      </div>

      {/* ---- PLAYER side (near, lower left) ---- */}
      <div className="absolute left-[10%] sm:left-[16%] bottom-[8%] flex flex-col items-center">
        <div key={hit.key ? `p${hit.key}` : 'p'} className={`relative w-[76px] h-[114px] sm:w-[124px] sm:h-[186px] ${playerCls}`}>
          <img src={playerUrl} className="w-full h-full" style={{ imageRendering: 'pixelated' }} alt="" draggable={false} />
          {hit.playerDmg ? (
            <span key={`pd${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-2xl sm:text-3xl text-rose-300 animate-battle-dmg" style={{ marginLeft: '-18px', textShadow: '2px 2px 0 #000' }}>
              -{hit.playerDmg}
            </span>
          ) : null}
          {hit.dodge && (
            <span key={`dd${hit.key}`} className="absolute -top-4 left-1/2 font-heading text-sm sm:text-base text-sky-200 animate-battle-dmg" style={{ marginLeft: '-22px', textShadow: '2px 2px 0 #000' }}>
              {t('battle.dodge')}
            </span>
          )}
          {hit.block && (
            <span key={`bd${hit.key}`} className="absolute -top-5 left-1/2 font-heading text-xs sm:text-sm text-cyan-200 animate-battle-dmg" style={{ marginLeft: '-16px', textShadow: '2px 2px 0 #000' }}>
              {t('battle.block')}
            </span>
          )}
          {hit.fail && (
            <span key={`fd${hit.key}`} className="absolute -top-6 left-1/2 font-heading text-[10px] sm:text-xs text-rose-400 animate-battle-dmg whitespace-nowrap" style={{ marginLeft: '-48px', textShadow: '2px 2px 0 #000' }}>
              {t('battle.activationFailed')}
            </span>
          )}
          {hit.heal > 0 && (
            <span key={`hd${hit.key}`} className="absolute -top-5 left-1/2 font-heading text-lg sm:text-xl text-emerald-300 animate-battle-dmg" style={{ marginLeft: '-10px', textShadow: '2px 2px 0 #000' }}>
              +{hit.heal}
            </span>
          )}
          {hit.essence > 0 && (
            <span key={`ed2${hit.key}`} className="absolute -top-5 left-1/2 font-heading text-base sm:text-lg text-sky-300 animate-battle-dmg" style={{ marginLeft: '-10px', textShadow: '2px 2px 0 #000' }}>
              +{hit.essence}✦
            </span>
          )}
        </div>
        <div className="w-24 h-6 sm:w-44 sm:h-9 rounded-[50%] bg-black/55 mt-1" />
      </div>

      {/* ---- cast anticipation (gathering essence) ---- */}
      {casting && (
        <div className="absolute left-[10%] sm:left-[16%] bottom-[16%] w-28 h-28 sm:w-44 sm:h-44 rounded-full animate-battle-charge"
          style={{ background: `radial-gradient(circle, ${casting.color}55, transparent 70%)` }} />
      )}

      {/* ---- Gu cast aura + projectile ---- */}
      {hit.gu && (
        <div key={`c${hit.key}`} className="absolute left-[12%] sm:left-[18%] bottom-[18%] w-24 h-24 sm:w-40 sm:h-40 rounded-full animate-battle-cast"
          style={{ background: `radial-gradient(circle, ${col}cc, transparent 70%)` }} />
      )}
      {isProjectile && (
        <div key={`pj${hit.key}`} className="absolute left-[16%] sm:left-[22%] bottom-[26%] w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full animate-battle-projectile-far"
          style={{ background: col, boxShadow: `0 0 12px 3px ${col}` }} />
      )}

      {/* ---- defensive / wind effects on the player ---- */}
      {(k.barrier || k.defense) && (
        <>
          <div key={`sh${hit.key}`} className="absolute left-[9%] sm:left-[15%] bottom-[6%] w-[86px] h-[124px] sm:w-[140px] sm:h-[204px] rounded-t-full border-2 border-cyan-300/60 animate-battle-bind"
            style={{ background: 'radial-gradient(ellipse at bottom, rgba(120,220,255,0.18), transparent 75%)' }} />
          {[0, 1, 2].map((i) => (
            <span key={`sr${hit.key}${i}`} className="absolute left-[11%] sm:left-[17%] bottom-[10%] w-2 h-4 sm:w-2.5 sm:h-5 bg-stone-300 animate-battle-shards" style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </>
      )}
      {k.evasion && (
        <div key={`sw${hit.key}`} className="absolute left-[10%] sm:left-[16%] bottom-[10%] w-[88px] h-[88px] sm:w-[136px] sm:h-[136px] rounded-full border-2 border-teal-200/60 animate-battle-swirl"
          style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
      )}
      {(hit.heal > 0 || hit.essence > 0) && (
        <div key={`au${hit.key}`} className="absolute left-[10%] sm:left-[16%] bottom-[8%] w-[76px] h-[110px] sm:w-[128px] sm:h-[190px] animate-battle-aurarise"
          style={{ background: `radial-gradient(ellipse at bottom, ${hit.heal > 0 ? 'rgba(110,240,160,0.4)' : 'rgba(120,190,255,0.4)'}, transparent 70%)` }} />
      )}
      {k.summon && (
        <div key={`sm${hit.key}`} className="absolute left-[24%] sm:left-[28%] bottom-[10%] w-12 h-12 sm:w-20 sm:h-20 animate-battle-cast"
          style={{ background: 'radial-gradient(circle, rgba(60,180,120,0.5), transparent 70%)', boxShadow: 'inset 0 0 12px rgba(60,180,120,0.4)' }} />
      )}

      {/* ---- offensive / control effects on the enemy ---- */}
      {hit.enemyDmg > 0 && !enemyDefeated && (
        <div key={`im${hit.key}`} className={`absolute right-[12%] sm:right-[15%] bottom-[38%] w-20 h-20 sm:w-32 sm:h-32 rounded-full border-2 animate-battle-impact ${hit.killer ? 'scale-150' : ''}`}
          style={{ borderColor: col, background: `radial-gradient(circle, ${col}66, transparent 65%)` }} />
      )}
      {k.burn && (
        <div key={`br${hit.key}`} className="absolute right-[12%] sm:right-[16%] bottom-[34%] w-16 h-16 sm:w-28 sm:h-28 animate-battle-aurarise"
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(255,120,40,0.55), transparent 70%)' }} />
      )}
      {k.control && (
        <div key={`cb${hit.key}`} className="absolute right-[12%] sm:right-[15%] bottom-[36%] w-[88px] h-[88px] sm:w-[144px] sm:h-[144px] rounded-full border-2 border-dashed border-blue-300/70 animate-battle-bind" />
      )}
      {k.investigate && (
        <div key={`iv${hit.key}`} className="absolute right-[12%] sm:right-[15%] bottom-[38%] w-16 h-16 sm:w-28 sm:h-28 rounded-full border-2 border-amber-200/70 animate-battle-bind"
          style={{ background: 'radial-gradient(circle, rgba(255,240,180,0.14), transparent 65%)' }} />
      )}

      {/* ---- Killer Move banner ---- */}
      {hit.killer && hit.gu && (
        <div key={`kb${hit.key}`} className="absolute inset-x-0 top-16 flex justify-center animate-battle-banner pointer-events-none">
          <div className="px-5 py-1.5 bg-black/85 border-y-2 border-amber-400/70 text-amber-200 font-heading text-sm sm:text-base tracking-widest shadow-[0_0_24px_rgba(252,211,77,0.45)]">
            {t('battle.killerBanner', { name: hit.gu.name })}
          </div>
        </div>
      )}

      {/* ---- outcome banner ---- */}
      {result && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`px-8 py-3 bg-black/75 border-2 rounded-lg font-heading text-2xl sm:text-3xl tracking-widest animate-pop ${
            result === 'victory' ? 'border-amber-400/70 text-amber-200' : result === 'trial' ? 'border-cyan-400/70 text-cyan-200' : result === 'flee' ? 'border-stone-500/70 text-stone-200' : 'border-rose-600/70 text-rose-300'
          }`}>
            {result === 'victory' ? t('battle.victory') : result === 'trial' ? t('battle.trial') : result === 'flee' ? t('battle.escaped') : t('battle.defeat')}
          </div>
        </div>
      )}
    </div>
  );
}