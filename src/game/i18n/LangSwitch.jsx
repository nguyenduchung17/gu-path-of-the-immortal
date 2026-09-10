import React from 'react';
import { useT } from './LangContext';

// Compact EN / VI switcher used on the title screen, in character creation
// and in the system menu. Switching is instant and never touches save data.
export default function LangSwitch({ className = '' }) {
  const { lang, setLang, languages } = useT();
  return (
    <div className={`inline-flex items-center rounded-full bg-black/40 border border-stone-700/70 p-0.5 ${className}`}>
      {languages.map((l) => (
        <button key={l.id} onClick={() => setLang(l.id)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide transition ${
            lang === l.id ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
          }`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}