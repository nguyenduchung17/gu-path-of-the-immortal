// In-game clock helpers. Game time runs faster than real time — the baseline
// (1 real second = 1 game minute) and every per-action cost live in
// BALANCE.time, so the whole game's pace can be tuned from one place.
import { BALANCE } from '../config/balance';

export const MIN_PER_DAY = 24 * 60;
const norm = (min) => ((min % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;

export function phaseOf(min) {
  const m = norm(min ?? BALANCE.time.startMinutes);
  if (m >= 4 * 60 && m < 7 * 60) return 'dawn';
  if (m >= 7 * 60 && m < 18 * 60) return 'day';
  if (m >= 18 * 60 && m < 21 * 60) return 'dusk';
  return 'night';
}

export const PHASE_ICON = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };
export const PHASE_LABEL = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' };

export function timeLabel(min) {
  const m = norm(min ?? BALANCE.time.startMinutes);
  const h24 = Math.floor(m / 60);
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} ${ampm}`;
}

export function isNight(time) {
  return !!time && phaseOf(time.min) === 'night';
}

// 0 (broad daylight) → 1 (deep night), ramping smoothly through dusk and dawn.
export function darknessOf(min) {
  const m = norm(min ?? BALANCE.time.startMinutes);
  if (m >= 7 * 60 && m < 18 * 60) return 0;
  if (m >= 18 * 60 && m < 21 * 60) return (m - 18 * 60) / (3 * 60);
  if (m >= 21 * 60 || m < 4 * 60) return 1;
  return 1 - (m - 4 * 60) / (3 * 60);
}

// Warm glow around dawn and dusk, 0..~0.4
export function warmthOf(min) {
  const m = norm(min ?? BALANCE.time.startMinutes);
  const bell = (c, w) => Math.max(0, 1 - Math.abs(m - c) / w);
  return Math.max(bell(5.5 * 60, 100), bell(19 * 60, 100)) * 0.4;
}

export function advanceTime(state, mins) {
  if (!mins) return state;
  const t = state.time || { day: BALANCE.time.startDay, min: BALANCE.time.startMinutes };
  const total = t.min + Math.round(mins);
  return { ...state, time: { day: t.day + Math.floor(total / MIN_PER_DAY), min: total % MIN_PER_DAY } };
}

// Market-style shops keep daytime hours; inns and the black market never close.
export function shopOpen(npc, time) {
  const h = npc?.shop?.hours;
  if (!h) return true;
  const m = norm(time?.min ?? BALANCE.time.startMinutes);
  if (h.open <= h.close) return m >= h.open && m < h.close;
  return m >= h.open || m < h.close;
}