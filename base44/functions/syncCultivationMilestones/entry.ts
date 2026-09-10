import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// App-user connector "Cultivation Tracker Sheets" (googlesheets).
const CONNECTOR_ID = '6aa275bc0c0dd19bfd382374';
const HEADERS = [
  'Date', 'In-Game Day', 'Character', 'Stage', 'Cultivation %', 'Max Essence',
  'Essence', 'HP', 'Max HP', 'Primordial Stones', 'Total Insight',
  'Highest Mastery', 'Mastery Levels', 'Active Synergies', 'Gu Owned', 'Playtime (min)',
];
const LAST_COL = 'P'; // 16 columns

// Accepts a full Google Sheets URL or a bare spreadsheet id.
function parseSheetId(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{15,})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(s)) return s;
  return null;
}

// bounded snapshot sanitizers — the frontend payload is untrusted input
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1e9, Math.round(n * 100) / 100)) : 0;
}
function str(v) {
  return String(v ?? '').slice(0, 300);
}

async function sheets(path, accessToken, init) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

function friendly(status) {
  if (status === 404) return 'Spreadsheet not found — check the URL.';
  if (status === 403) return 'Access denied — make sure this spreadsheet belongs to the Google account you connected.';
  return 'Google Sheets returned an error. Try again in a moment.';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const mode = body?.mode === 'sync' ? 'sync' : 'check';
    const sheetId = parseSheetId(body?.sheetUrl);
    if (!sheetId) {
      return Response.json({ error: 'Paste a valid Google Sheets URL (https://docs.google.com/spreadsheets/d/...).' }, { status: 400 });
    }

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID));
    } catch {
      return Response.json({ error: 'Google Sheets is not connected yet — press "Connect Google Sheets" first.' }, { status: 400 });
    }

    // first sheet tab — milestone rows live there
    const meta = await sheets(`/${sheetId}?fields=sheets.properties.title`, accessToken);
    if (!meta.ok) return Response.json({ error: friendly(meta.status) }, { status: 400 });
    const title = meta.data?.sheets?.[0]?.properties?.title;
    if (!title) return Response.json({ error: 'No readable sheet tab found in this spreadsheet.' }, { status: 400 });
    const rng = (r) => `'${title.replace(/'/g, "''")}'!${r}`;

    if (mode === 'check') return Response.json({ ok: true, sheetTitle: title });

    // ---- sync: one row per calendar day, upserted as the day's stats grow ----
    const snap = body?.snapshot || {};
    const dateKey = typeof snap.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(snap.dateKey)
      ? snap.dateKey
      : new Date().toISOString().slice(0, 10);
    const row = [
      dateKey,
      num(snap.inGameDay), str(snap.character), str(snap.stageName),
      num(snap.cultivationProgress), num(snap.maxEssence), num(snap.currentEssence),
      num(snap.hp), num(snap.maxHp), num(snap.spiritStones), num(snap.totalInsight),
      num(snap.topMasteryLevel), str(snap.masterySummary), str(snap.synergies),
      num(snap.guOwned), num(snap.playtimeMin),
    ];

    // seed the header row if this is a fresh sheet
    const head = await sheets(`/${sheetId}/values/${encodeURIComponent(rng('A1'))}`, accessToken);
    if (!head.ok) return Response.json({ error: friendly(head.status) }, { status: 400 });
    if (!head.data?.values?.[0]?.length) {
      const put = await sheets(
        `/${sheetId}/values/${encodeURIComponent(rng(`A1:${LAST_COL}1`))}?valueInputOption=USER_ENTERED`,
        accessToken, { method: 'PUT', body: JSON.stringify({ values: [HEADERS] }) }
      );
      if (!put.ok) return Response.json({ error: friendly(put.status) }, { status: 400 });
    }

    // find today's row: update it, or append a new one
    const dates = await sheets(`/${sheetId}/values/${encodeURIComponent(rng('A2:A'))}`, accessToken);
    if (!dates.ok) return Response.json({ error: friendly(dates.status) }, { status: 400 });
    const existing = (dates.data?.values || []).findIndex(r => r && r[0] === dateKey);

    if (existing >= 0) {
      const rowNo = existing + 2;
      const put = await sheets(
        `/${sheetId}/values/${encodeURIComponent(rng(`A${rowNo}:${LAST_COL}${rowNo}`))}?valueInputOption=USER_ENTERED`,
        accessToken, { method: 'PUT', body: JSON.stringify({ values: [row] }) }
      );
      if (!put.ok) return Response.json({ error: friendly(put.status) }, { status: 400 });
      return Response.json({ ok: true, action: 'updated', date: dateKey, sheetTitle: title });
    }

    const append = await sheets(
      `/${sheetId}/values/${encodeURIComponent(rng(`A:${LAST_COL}`))}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      accessToken, { method: 'POST', body: JSON.stringify({ values: [row] }) }
    );
    if (!append.ok) return Response.json({ error: friendly(append.status) }, { status: 400 });
    return Response.json({ ok: true, action: 'appended', date: dateKey, sheetTitle: title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}