import React, { useState } from 'react';
import { useGame, SLOT_COUNT } from '@/game/state/GameContext';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { zoneAt } from '@/game/data/world';
import { DIFFICULTIES } from '@/game/config/balance';
import MemorialPanel from './MemorialPanel';

const TONE = {
  easy: 'text-emerald-300 border-emerald-700/50 bg-emerald-900/20',
  standard: 'text-sky-300 border-sky-700/50 bg-sky-900/20',
  hard: 'text-orange-300 border-orange-700/50 bg-orange-900/20',
  trueCultivation: 'text-rose-300 border-rose-700/50 bg-rose-950/30',
};

const fmtPlay = (sec) => {
  if (!sec) return '0h 0m';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

export default function SlotSelect() {
  const { loadSlotRaw, startSlot, beginCreate, deleteSlot } = useGame();
  const [, setVersion] = useState(0);
  const [confirmDel, setConfirmDel] = useState(null);
  const [record, setRecord] = useState(null); // { slot, rec }
  const refresh = () => setVersion(v => v + 1);

  const doDelete = (i) => { deleteSlot(i); setConfirmDel(null); refresh(); };

  return (
    <div className="min-h-screen bg-[#0d1410] text-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐉</div>
          <h1 className="text-xl font-semibold text-emerald-200 tracking-wide">GU: PATH OF THE IMMORTAL</h1>
          <p className="text-[11px] text-stone-400 mt-1">Each save slot is its own life. Choose a cultivator — or begin a new one.</p>
        </div>

        <div className="space-y-3">
          {Array.from({ length: SLOT_COUNT }, (_, idx) => idx + 1).map(i => {
            const s = loadSlotRaw(i);
            const diff = s ? (DIFFICULTIES[s.difficulty] || DIFFICULTIES.standard) : null;
            const stage = s ? CULTIVATION_STAGES[Math.min(19, (s.player?.rank || 0) * 4 + (s.player?.stage || 0))] : null;
            const zone = s ? (zoneAt(s.player?.x, s.player?.y) || {}).name : null;
            const day = (s?.time || {}).day;
            const deceased = !!s?.deceased;

            return (
              <div key={i} className={`rounded-xl border p-4 ${s ? (deceased ? 'border-rose-900/60 bg-black/30' : 'border-stone-800 bg-black/20') : 'border-dashed border-stone-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stone-500 tracking-widest">SAVE SLOT {i}</span>
                  {diff && <span className={`text-[9px] px-2 py-0.5 rounded-full border ${TONE[s.difficulty] || TONE.standard}`}>{diff.label}</span>}
                </div>

                {!s ? (
                  <>
                    <div className="text-sm text-stone-500 mb-3">Empty</div>
                    <button onClick={() => beginCreate(i)} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">Create Character</button>
                  </>
                ) : deceased ? (
                  <>
                    <div className="text-sm font-semibold text-rose-200 mb-1">☠ {s.player.name} — DECEASED</div>
                    <div className="text-[11px] text-stone-500 mb-3">
                      Survived {s.deceased.at?.day ?? day} days · {s.deceased.at?.realm || stage.name}
                      <div>{fmtPlay(s.playtimeSec)} walked the path</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setRecord({ slot: i, rec: s.deceased })} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-stone-200">View Record</button>
                      {confirmDel === i
                        ? <button onClick={() => doDelete(i)} className="py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm text-white">Confirm Delete</button>
                        : <button onClick={() => setConfirmDel(i)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">Delete</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-stone-100 mb-1">{s.player.name}</div>
                    <div className="text-[11px] text-stone-400 mb-3">
                      {stage.name} · Day {day} · {fmtPlay(s.playtimeSec)}
                      <div className="text-stone-500">{zone || 'Green Valley Region'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => startSlot(i)} className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">Continue</button>
                      {confirmDel === i
                        ? <button onClick={() => doDelete(i)} className="py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm text-white">Confirm Delete</button>
                        : <button onClick={() => setConfirmDel(i)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">Delete</button>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {record && (
        <MemorialPanel
          record={record.rec}
          onCloseLabel="Close"
          onClose={() => setRecord(null)}
          onDeleteLabel="Delete Save"
          onDelete={() => { doDelete(record.slot); setRecord(null); }}
        />
      )}
    </div>
  );
}