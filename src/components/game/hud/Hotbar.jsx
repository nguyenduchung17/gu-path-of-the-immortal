import React from 'react';
import { sfx } from '@/game/audio/sfx';
import { useT } from '@/game/i18n/LangContext';

const ITEMS = [
  { id: 'cultivation', icon: '🧘', key: 'C' },
  { id: 'gu', icon: '🐉', key: 'G' },
  { id: 'recipes', icon: '📖', key: 'R' },
  { id: 'dao', icon: '☯️', key: 'M' },
  { id: 'inventory', icon: '🎒', key: 'I' },
  { id: 'quests', icon: '📜', key: 'Q' },
  { id: 'map', icon: '🧭', key: 'P' },
];

// Bottom-center game hotbar — panels open as overlays over the world.
export default function Hotbar({ active, onSelect, onPause }) {
  const { t } = useT();
  return (
    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-end gap-1 rounded-2xl bg-black/50 backdrop-blur border border-stone-700/60 px-2 py-1.5 shadow-xl">
      {ITEMS.map(it => (
        <button
          key={it.id}
          onClick={() => { sfx('ui'); onSelect(it.id); }}
          title={`${t(`ui.${it.id}`)} (${it.key})`}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center transition border ${
            active === it.id
              ? 'bg-emerald-600/80 border-emerald-400/60 shadow-inner'
              : 'bg-white/5 border-white/10 hover:bg-white/15'
          }`}
        >
          <span className="text-base sm:text-lg leading-none">{it.icon}</span>
          <span className="hidden sm:block text-[8px] text-stone-300 mt-0.5 leading-none">{t(`ui.${it.id}`)}</span>
        </button>
      ))}
      <div className="w-px self-stretch bg-stone-600/50 mx-0.5" />
      <button
        onClick={() => { sfx('open'); onPause(); }}
        title={`${t('ui.menu')} (Esc)`}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition"
      >
        <span className="text-base sm:text-lg leading-none">☰</span>
        <span className="hidden sm:block text-[8px] text-stone-300 mt-0.5 leading-none">{t('ui.menu')}</span>
      </button>
    </div>
  );
}