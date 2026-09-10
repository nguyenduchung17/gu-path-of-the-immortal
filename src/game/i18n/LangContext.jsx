import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DICT, LANGUAGES, DEFAULT_LANG } from './translations';

const LangContext = createContext(null);
const STORAGE_KEY = 'gu_lang';

function initialLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && DICT[v]) return v;
  } catch {}
  // no saved preference — follow the browser language
  if (typeof navigator !== 'undefined' && /^vi\b/i.test(navigator.language || '')) return 'vi';
  return DEFAULT_LANG;
}

// Global UI language. Lives outside save data — switching languages never
// touches the save slots.
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((l) => {
    if (!DICT[l]) return;
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  }, []);

  const t = useCallback((key, params) => {
    const table = DICT[lang] || DICT.en;
    let s;
    if (Object.prototype.hasOwnProperty.call(table, key)) s = table[key];
    else if (Object.prototype.hasOwnProperty.call(DICT.en, key)) {
      // fallback to English — but log the gap so it gets translated
      s = DICT.en[key];
      if (lang !== 'en') console.warn(`[i18n] missing ${lang} translation: ${key}`);
    } else {
      s = key;
      console.warn(`[i18n] missing localization key: ${key}`);
    }
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  }, [lang]);

  // Vietnamese headings use the VT323 pixel font — Pixelify Sans has no
  // Vietnamese glyphs (see the .lang-vi rule in index.css).
  useEffect(() => {
    document.documentElement.classList.toggle('lang-vi', lang === 'vi');
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within LangProvider');
  return ctx;
}