import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LANGUAGES } from './translations';
import { TABLES, browserLang, curLang, setStoredLang } from './trStore';

const LangContext = createContext(null);
const STORAGE_KEY = 'gu_lang';

function initialLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && TABLES[v]) return v;
  } catch {}
  return browserLang();
}

// Global UI language. Lives outside save data — switching languages never
// touches the save slots, persists across sessions, defaults to the browser's
// language, and every consumer re-renders instantly on switch.
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.classList.toggle('lang-vi', lang === 'vi');
  }, [lang]);

  const setLang = useCallback((l) => {
    if (!TABLES[l]) return;
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  }, []);

  const t = useCallback((key, params) => {
    const table = TABLES[lang] || TABLES.en;
    let s = table[key] ?? TABLES.en[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }, [lang]);

  const tl = useCallback((key, fallback, params) => {
    const table = TABLES[lang] || TABLES.en;
    let s = table[key];
    if (s == null) s = fallback != null ? fallback : key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, tl, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within LangProvider');
  return ctx;
}