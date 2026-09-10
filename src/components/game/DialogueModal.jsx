import React, { useState } from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import { NPC_BY_ID, npcAvailable } from '@/game/data/npcs';
import { QUESTS } from '@/game/data/quests';
import { questStatusOf, questView, QS } from '@/game/engine/questEngine';
import { diffOf } from '@/game/config/balance';
import { shopOpen } from '@/game/engine/time';
import { INNS } from '@/game/data/world';
import { npcAppearance } from '@/game/gfx/characterSprites';
import { appearanceOf } from '@/game/data/appearance';
import PortraitFrame from './PortraitFrame';
import MentorPanel from './MentorPanel';

// Game-style dialogue: the world stays visible behind, the NPC (who turned to
// face you) gets a pixel portrait, and the player's own portrait joins in.
export default function DialogueModal({ onShop, onService, onInn }) {
  const { state, dispatch } = useGame();
  const { t } = useT();
  const npc = NPC_BY_ID[state.dialogue.npcId];
  const [view, setView] = useState('main');
  if (!npc) return null;

  const npcQuests = QUESTS.filter(q => q.giver === npc.id);
  const close = () => dispatch({ type: 'CLOSE_DIALOGUE' });

  // hidden masters get the mentor dialogue instead of a shop menu
  if (npc.mentor) {
    return (
      <div className="fixed inset-0 z-20 bg-black/25 flex items-end justify-center p-3 pb-20 sm:pb-8 pointer-events-none">
        <div className="max-w-md w-full rounded-2xl border border-cyan-800/50 bg-[#0d1410]/95 backdrop-blur p-4 animate-pop pointer-events-auto shadow-2xl">
          <MentorPanel npc={npc} onShop={onShop} onClose={close} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 bg-black/25 flex items-end justify-center p-3 pb-20 sm:pb-8 pointer-events-none">
      <div className="max-w-md w-full rounded-2xl border border-emerald-800/50 bg-[#0d1410]/95 backdrop-blur p-4 animate-pop pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <PortraitFrame appearance={npcAppearance(npc.id)} size={52} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-100">{npc.name}</div>
            {npc.role && <div className="text-[10px] text-amber-300/80">{t(`role.${npc.role}`)}</div>}
            <p className="text-[11px] text-stone-400 italic">"{npc.greeting}"</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <PortraitFrame appearance={appearanceOf(state.player)} size={30} />
            <span className="text-[8px] text-stone-500">You</span>
          </div>
        </div>

        {view === 'main' && (
          <div className="space-y-2">
            {npc.shop && (shopOpen(npc, state.time)
              ? <button onClick={() => { onShop(npc.id); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">🛒 Trade</button>
              : <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-stone-500">🛒 Trade — closed for the night (opens 06:00)</div>
            )}
            {npc.service === 'inn' && (() => {
              const inn = INNS.find(i => i.npcId === npc.id);
              const cost = inn ? Math.max(1, Math.round(inn.cost * diffOf(state).priceMul)) : 0;
              return (
                <button onClick={() => { close(); onInn(npc.id); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                  🛏️ Rent a Room — sleep until morning (💎 {cost})
                </button>
              );
            })()}
            {npc.service === 'missions' && (npcAvailable(npc, state.time)
              ? <button onClick={() => { onService('missions'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">📋 Mission Board</button>
              : <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-stone-500">📋 Mission Board — the hall keeps daytime hours {t('np.closed')}</div>)}
            {npc.service === 'contribution' && (npcAvailable(npc, state.time)
              ? <button onClick={() => { onService('contribution'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">🏛️ Contribution Exchange</button>
              : <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-stone-500">🏛️ Contribution Exchange {t('np.closed')}</div>)}
            {npc.service === 'arena' && (npcAvailable(npc, state.time)
              ? <button onClick={() => { onService('arena'); close(); }} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">⚔️ Arena Challenges</button>
              : <div className="w-full px-3 py-2 rounded-lg bg-white/5 text-sm text-stone-500">⚔️ Arena Challenges {t('np.closed')}</div>)}
            {npcQuests.length > 0 && <button onClick={() => setView('quests')} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">📜 Quests ({npcQuests.length})</button>}
            {npc.id === 'sectElder' && <p className="text-[11px] text-stone-400 px-3">Cultivate at the ✦ terrace by the training ground for ×1.5 cultivation progress.</p>}
            <button onClick={close} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">Leave</button>
          </div>
        )}

        {view === 'quests' && (
          <div className="space-y-3">
            <button onClick={() => setView('main')} className="text-[11px] text-stone-400 hover:text-stone-200">← Back</button>
            {npcQuests.map(q => {
              const status = questStatusOf(state, q);
              if (status === QS.LOCKED) return null;
              if (q.objective?.type === 'choice') {
                if (status === QS.ACTIVE) return (
                  <div key={q.id} className="rounded-lg border border-violet-800/40 bg-violet-900/10 p-3">
                    <div className="text-sm font-semibold text-violet-100">{q.name}</div>
                    <p className="text-[11px] text-stone-400 mt-1 mb-2">{q.description}</p>
                    {q.choices.map((ch, i) => (
                      <button key={i} onClick={() => { dispatch({ type: 'QUEST_CHOICE', questId: q.id, choiceIndex: i }); close(); }}
                        className="block w-full text-left text-xs px-2 py-1.5 rounded bg-white/5 hover:bg-violet-800/30 mb-1">{ch.label}</button>
                    ))}
                  </div>
                );
                return null;
              }
              if (status === QS.TURNED_IN || status === QS.COMPLETED) return (
                <div key={q.id} className="text-xs text-stone-500 px-3 py-2 rounded bg-black/20">✓ {q.name} — "Thank you again."</div>
              );
              if (status === QS.TURN_IN_READY) return (
                <div key={q.id} className="rounded-lg border border-amber-600/50 bg-amber-900/10 p-3">
                  <div className="text-sm font-semibold text-amber-100">{q.name}</div>
                  <p className="text-[11px] text-amber-300/80 mt-1">"You've completed the task."</p>
                  <button onClick={() => dispatch({ type: 'TURN_IN_QUEST', questId: q.id })} className="mt-2 text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white">Turn In</button>
                </div>
              );
              if (status === QS.ACTIVE) {
                const view = questView(state, q);
                return (
                  <div key={q.id} className="rounded-lg border border-stone-800 bg-black/20 p-3">
                    <div className="text-sm font-semibold text-emerald-100">{q.name}</div>
                    <p className="text-[11px] text-stone-400 italic mt-1">"How is the task going?"</p>
                    {view.map(o => (
                      <div key={o.id} className={`text-[11px] mt-1 flex justify-between ${o.done ? 'text-emerald-300' : 'text-stone-300'}`}>
                        <span>{o.done ? '✓' : '•'} {o.label}</span>
                        <span>{o.cur} / {o.req}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div key={q.id} className="rounded-lg border border-stone-800 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-emerald-100">{q.name}</div>
                  <p className="text-[11px] text-stone-400 mt-1">{q.description}</p>
                  <p className="text-[10px] text-stone-500 italic mt-1">"Would you help me?"</p>
                  <button onClick={() => dispatch({ type: 'ACCEPT_QUEST', questId: q.id })} className="mt-2 text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white">Accept</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}