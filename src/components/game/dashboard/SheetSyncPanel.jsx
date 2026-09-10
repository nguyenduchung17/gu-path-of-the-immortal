import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CONNECTOR_ID = '6aa275bc0c0dd19bfd382374'; // Cultivation Tracker Sheets (app-user)
const URL_KEY = 'gu_sheets_url';

// Google Sheets milestone sync — app-user connector, so each player's rows go
// to their own spreadsheet. One row per calendar day, updated as stats grow.
export default function SheetSyncPanel({ snapshot }) {
  const [authed, setAuthed] = useState(null);
  const [sheetUrl, setSheetUrl] = useState(() => {
    try { return localStorage.getItem(URL_KEY) || ''; } catch { return ''; }
  });
  const [connected, setConnected] = useState(false);
  const [sheetTitle, setSheetTitle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const invoke = (payload) => base44.functions.invoke('syncCultivationMilestones', payload);
  const saveUrl = (v) => {
    setSheetUrl(v);
    try {
      if (v) localStorage.setItem(URL_KEY, v);
      else localStorage.removeItem(URL_KEY);
    } catch {}
  };

  // doubles as connection check AND sheet validation
  const runCheck = async (url) => {
    if (!url || !url.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await invoke({ mode: 'check', sheetUrl: url });
      setConnected(true);
      setSheetTitle(res.data?.sheetTitle || 'Sheet');
    } catch (e) {
      setConnected(false); setSheetTitle(null);
      setError(e.response?.data?.error || e.message || 'Could not reach the spreadsheet.');
    } finally { setBusy(false); }
  };

  // check auth + saved URL on mount
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      setAuthed(ok);
      if (ok) {
        const saved = localStorage.getItem(URL_KEY);
        if (saved) await runCheck(saved);
      }
    });
  }, []);

  // OAuth popup — poll for close, then re-check
  const handleConnect = async () => {
    setBusy(true); setError(null);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnected(true);
          const saved = localStorage.getItem(URL_KEY);
          if (saved) runCheck(saved);
        }
      }, 500);
    } catch (e) {
      setError(e.message || 'Could not start Google sign-in.');
    } finally { setBusy(false); }
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false); setSheetTitle(null); setResult(null);
  };

  const handleSync = async () => {
    saveUrl(sheetUrl);
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await invoke({ mode: 'sync', sheetUrl, snapshot });
      setResult(res.data);
      setConnected(true);
      setSheetTitle(res.data?.sheetTitle || sheetTitle);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Sync failed.';
      setError(msg);
      if (/connect/i.test(msg)) setConnected(false);
    } finally { setBusy(false); }
  };

  return (
    <section className="mt-3 rounded-2xl border border-sky-800/40 bg-[#10181a] p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm text-sky-200">📊 Cultivation Milestones → Google Sheets</h2>
        {connected && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 whitespace-nowrap">
            Google connected{sheetTitle ? ` · ${sheetTitle}` : ''}
          </span>
        )}
      </div>
      <p className="text-[11px] text-stone-400 mt-1">
        Each sync writes one row per day — cultivation, essence, mastery and synergy snapshot — so you can watch your growth session by session in your own spreadsheet.
      </p>

      {authed === false ? (
        <button onClick={() => base44.auth.redirectToLogin()}
          className="mt-3 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-sm">
          Sign in to sync milestones
        </button>
      ) : !connected ? (
        <button onClick={handleConnect} disabled={busy}
          className="mt-3 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:opacity-60 text-white text-sm">
          {busy ? 'Connecting…' : 'Connect Google Sheets'}
        </button>
      ) : (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={sheetUrl}
            onChange={(e) => saveUrl(e.target.value)}
            placeholder="Paste your Google Sheets URL (https://docs.google.com/spreadsheets/d/…)"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-black/40 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-sky-600"
          />
          <button onClick={() => runCheck(sheetUrl)} disabled={busy || !sheetUrl.trim()}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs text-stone-200">
            Verify
          </button>
          <button onClick={handleSync} disabled={busy || !sheetUrl.trim()}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium whitespace-nowrap">
            {busy ? 'Syncing…' : "Sync today's milestone"}
          </button>
        </div>
      )}

      {error && <div className="mt-2 text-[11px] text-rose-300">{error}</div>}
      {result && (
        <div className="mt-2 text-[11px] text-emerald-300">
          Milestone row for {result.date} {result.action} in “{result.sheetTitle}”.
        </div>
      )}
      {connected && (
        <button onClick={handleDisconnect} className="mt-2 text-[10px] text-stone-500 hover:text-stone-300">
          Disconnect Google account
        </button>
      )}
    </section>
  );
}