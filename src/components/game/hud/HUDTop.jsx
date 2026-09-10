import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { sfx, isMuted, toggleMuted } from '@/game/audio/sfx';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { diffOf } from '@/game/config/balance';
import { phaseOf, timeLabel, PHASE_ICON } from '@/game/engine/time';
import { weatherOf, weatherEffectLine } from '@/game/engine/weather';
import { zoneAt, DEFAULT_ZONE } from '@/game/data/world';
import { appearanceOf } from '@/game/data/appearance';
import { tierOf, constitutionName } from '@/game/config/aptitude';
import { useT } from '@/game/i18n/LangContext';
import PortraitFrame from '../PortraitFrame';

const DANGER_CHIP = {
  0: 'border-emerald-600/50 bg-emerald-950/60 text-emerald-300',
  1: 'border-lime-600/40 bg-lime-950/60 text-lime-300',
  2: 'border-yellow-600/40 bg-yellow-950/60 text-yellow-300',
  3: 'border-amber-600/50 bg-amber-950/60 text-amber-300',
  4: 'border-orange-700/50 bg-orange-950/60 text-orange-300',
  5: 'border-red-700/60 bg-red-950/60 text-red-300',
};

function Bar({ value, max, from, to }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full bg-black/50 overflow-hidden ring-1 ring-black/40">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
    </div>
  );
}

// Compact floating top HUD over the fullscreen world.
export default function HUDTop() {
  const { state } = useGame();
  const { t: tr, lang } = useT();
  const [muted, setMuted] = useState(isMuted());
  const p = state.player;
  const stage = CULTIVATION_STAGES[Math.min(19, p.rank * 4 + (p.stage || 0))];
  const t = state.time || { day: 1, min: 420 };
  const zone = zoneAt(p.x, p.y) || DEFAULT_ZONE;
  const weather = weatherOf(t);
  const tier = tierOf(p.aptitude);
  const conName = constitutionName(p.aptitude, lang);

  return (
    <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
      <div className="flex items-start justify-between gap-2 p-2.5">
        {/* left cluster: identity + vitals */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-black/45 backdrop-blur border border-emerald-900/50 px-3 py-2 shadow-lg">
          <PortraitFrame appearance={appearanceOf(p)} size={38} />
          <div className="leading-tight">
            <div className="text-xs font-semibold text-stone-100">{p.name}</div>
            <div className="text-[10px] text-emerald-300/80">
              {stage.name} · {tr(`apt.tier.${tier.id}`)}{conName ? ` · ${conName}` : ''} · <span className="text-amber-200/70">{diffOf(state).label}</span>
            </div>
          </div>
          <div className="w-24 sm:w-40 space-y-1.5">
            <div>
              <div className="flex justify-between text-[8px] text-rose-300/80 leading-none mb-0.5">
                <span>HP</span><span>{Math.floor(p.hp)}/{p.maxHp}</span>
              </div>
              <Bar value={p.hp} max={p.maxHp} from="#e11d48" to="#fb7185" />
            </div>
            <div>
              <div className="flex justify-between text-[8px] text-sky-300/80 leading-none mb-0.5">
                <span>{tr('ui.essence')}</span><span>{Math.floor(p.primevalEssence)}/{p.maxPrimevalEssence}</span>
              </div>
              <Bar value={p.primevalEssence} max={p.maxPrimevalEssence} from="#0284c7" to="#7dd3fc" />
            </div>
          </div>
        </div>

        {/* right cluster: resources, clock, location */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          <button
            onClick={() => { const m = toggleMuted(); setMuted(m); if (!m) sfx('ui'); }}
            title={muted ? 'Sound off' : 'Sound on'}
            className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur border border-stone-700 text-stone-300 hover:text-amber-300"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur border border-amber-500/30 text-amber-200" title="Primordial Stones">💎 {p.spiritStones}</div>
          <div className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur border border-stone-700 text-stone-300" title={`${tr('ui.day')} ${t.day}`}>
            {tr('ui.day')} {t.day} · {PHASE_ICON[phaseOf(t.min)]} {timeLabel(t.min)}
          </div>
          <div
            className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur border border-stone-700 text-stone-300"
            title={weatherEffectLine(weather) || 'No effect on Gu'}
          >
            {weather.icon} {tr(`weather.${weather.id}`)}
          </div>
          <div className={`text-[11px] px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur border ${DANGER_CHIP[zone.danger] ?? DANGER_CHIP[2]}`} title={zone.safe ? 'Safe zone' : zone.dangerLabel}>
            {zone.name}
          </div>
        </div>
      </div>
    </div>
  );
}