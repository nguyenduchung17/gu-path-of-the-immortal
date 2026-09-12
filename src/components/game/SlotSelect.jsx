import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame, SLOT_COUNT } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import LangSwitch from '@/game/i18n/LangSwitch';
import { CULTIVATION_STAGES } from '@/game/data/cultivation';
import { zoneAt } from '@/game/data/world';
import MemorialPanel from './MemorialPanel';
import { validDeathRecord } from '@/game/state/saveIdentity';
import { useAuth } from '@/lib/AuthContext';

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
  const { loadSlotRaw, startSlot, beginCreate, deleteSlot, cloudStatus, cloudError } = useGame();
  const { user, logout } = useAuth();
  const { t } = useT();
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
          <h1 className="text-xl font-semibold text-emerald-200 tracking-wide">{t('title.game')}</h1>
          <p className="text-[11px] text-stone-400 mt-1">{t('title.subtitle')}</p>
          <div className="mt-3 flex justify-center"><LangSwitch /></div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              to="/prototype/zone-exploration"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-300/20"
              title={t('zone.prototype.subtitle')}
            >
              {t('zone.prototype.badge')}: {t('zone.prototype.title')}
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-stone-400">
            <span>{user?.email || 'Signed in'}</span>
            <span className={cloudStatus === 'synced' ? 'text-emerald-400' : cloudStatus === 'saving' ? 'text-amber-300' : 'text-rose-300'}>
              {cloudStatus === 'synced' ? '☁ Cloud saved' : cloudStatus === 'saving' ? '☁ Saving…' : '☁ Local backup active'}
            </span>
            <button onClick={() => logout(true)} className="text-stone-300 hover:text-white underline">Log out</button>
          </div>
          {cloudError && <p className="mt-2 text-[10px] text-rose-300">Cloud sync problem: {cloudError}</p>}
        </div>

        <div className="space-y-3">
          {Array.from({ length: SLOT_COUNT }, (_, idx) => idx + 1).map(i => {
            const s = loadSlotRaw(i);
            const diffKey = s?.difficulty === 'trueCultivation' ? 'true' : s?.difficulty;
            const diff = s ? t(`diff.${diffKey || 'standard'}.title`) : null;
            const stage = s ? CULTIVATION_STAGES[Math.min(19, (s.player?.rank || 0) * 4 + (s.player?.stage || 0))] : null;
            const zone = s ? (zoneAt(s.player?.x, s.player?.y) || {}).name : null;
            const day = (s?.time || {}).day;
            const deceased = validDeathRecord(s);

            return (
              <div key={i} className={`rounded-xl border p-4 ${s ? (deceased ? 'border-rose-900/60 bg-black/30' : 'border-stone-800 bg-black/20') : 'border-dashed border-stone-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stone-500 tracking-widest">{t('title.slot', { n: i })}</span>
                  {s && <span className={`text-[9px] px-2 py-0.5 rounded-full border ${TONE[s.difficulty] || TONE.standard}`}>{diff}</span>}
                </div>

                {!s ? (
                  <>
                    <div className="text-sm text-stone-500 mb-3">{t('title.empty')}</div>
                    <button onClick={() => beginCreate(i)} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">{t('title.create')}</button>
                  </>
                ) : deceased ? (
                  <>
                    <div className="text-sm font-semibold text-rose-200 mb-1">☠ {s.player.name} — {t('title.deceased')}</div>
                    <div className="text-[11px] text-stone-500 mb-3">
                      {t('title.survived', { n: s.deceased.at?.day ?? day })} · {s.deceased.at?.realm || stage.name}
                      <div>{t('title.walked', { t: fmtPlay(s.playtimeSec) })}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setRecord({ slot: i, rec: s.deceased })} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-stone-200">{t('title.viewRecord')}</button>
                      {confirmDel === i
                        ? <button onClick={() => doDelete(i)} className="py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm text-white">{t('title.confirmDelete')}</button>
                        : <button onClick={() => setConfirmDel(i)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">{t('title.delete')}</button>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-stone-100 mb-1">{s.player.name}</div>
                    <div className="text-[11px] text-stone-400 mb-3">
                      {stage.name} · {t('ui.day')} {day} · {fmtPlay(s.playtimeSec)}
                      <div className="text-stone-500">{zone || 'Green Valley Region'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => startSlot(i)} className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">{t('title.continue')}</button>
                      {confirmDel === i
                        ? <button onClick={() => doDelete(i)} className="py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm text-white">{t('title.confirmDelete')}</button>
                        : <button onClick={() => setConfirmDel(i)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-stone-400">{t('title.delete')}</button>}
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
          onCloseLabel={t('ui.close')}
          onClose={() => setRecord(null)}
          onDeleteLabel={t('title.delete')}
          onDelete={() => { doDelete(record.slot); setRecord(null); }}
        />
      )}
    </div>
  );
}
