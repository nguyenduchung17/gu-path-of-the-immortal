import React, { createContext, useContext, useState, useCallback } from 'react';
import { DICT, LANGUAGES, DEFAULT_LANG } from './translations';

const LangContext = createContext(null);
const STORAGE_KEY = 'gu_lang';

function initialLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && DICT[v]) return v;
  } catch {}
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
    let s = table[key] ?? DICT.en[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
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