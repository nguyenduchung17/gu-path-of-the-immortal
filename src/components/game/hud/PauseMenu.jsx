import React from 'react';
import { useGame } from '@/game/state/GameContext';
import { useT } from '@/game/i18n/LangContext';
import LangSwitch from '@/game/i18n/LangSwitch';

function Entry({ onClick, children, primary, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-2.5 rounded-lg text-sm text-left px-3 transition border ${
        primary
          ? 'bg-emerald-600/90 border-emerald-400/50 text-white hover:bg-emerald-500'
          : danger
            ? 'bg-rose-950/60 border-rose-800/60 text-rose-200 hover:bg-rose-900/60'
            : 'bg-white/5 border-white/10 text-stone-200 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  );
}

// System menu overlay (Esc). Time is paused while it is open.
export default function PauseMenu({ open, onClose, onOpenPanel }) {
  const { exitToSlots, reset } = useGame();
  const { t } = useT();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-80 max-w-[92vw] rounded-xl border border-emerald-800/60 bg-[#101812] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-center text-xs font-heading tracking-[0.35em] text-emerald-300/90 mb-4">{t('pause.title')}</h2>
        <div className="space-y-1.5">
          <Entry primary onClick={onClose}>{t('pause.resume')}</Entry>
          <Entry onClick={() => onOpenPanel('cultivation')}>{t('pause.character')}</Entry>
          <Entry onClick={() => onOpenPanel('inventory')}>{t('pause.inventory')}</Entry>
          <Entry onClick={() => onOpenPanel('map')}>{t('pause.map')}</Entry>
          <Entry onClick={() => onOpenPanel('bestiary')}>{t('pause.bestiary')}</Entry>
          <Entry onClick={() => onOpenPanel('help')}>{t('pause.help')}</Entry>
          <div className="flex items-center justify-between px-1 pt-1.5">
            <span className="text-[10px] text-stone-500">{t('ui.language')}</span>
            <LangSwitch />
          </div>
          <div className="h-px bg-stone-700/60 my-2" />
          <Entry onClick={exitToSlots}>{t('pause.saveExit')}</Entry>
          <Entry
            danger
            onClick={() => { if (confirm(t('pause.abandonConfirm'))) reset(); }}
          >
            {t('pause.abandon')}
          </Entry>
        </div>
        <p className="mt-3 text-center text-[10px] text-stone-500">{t('pause.note')}</p>
      </div>
    </div>
  );
}