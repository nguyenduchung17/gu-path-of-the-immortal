// Weather turns with the game clock: one pattern per 4-hour block, chosen
// deterministically from (day, block) so it survives reloads and time skips.
// In battle, weather slightly boosts or weakens Gu paths.
import { PATH_BY_ID } from '../data/paths';
import { BALANCE } from '../config/balance';
import { T, locPathName } from '../i18n/tr';

export const WEATHERS = {
  clear:    { icon: '☀️', mods: {} },
  rain:     { icon: '🌧️', mods: { water: 20, fire: -25 } },
  heatwave: { icon: '🔥', mods: { fire: 20, water: -25 } },
  gale:     { icon: '🌬️', mods: { wind: 25, earth: -15 } },
  mist:     { icon: '🌫️', mods: { enslavement: 15, fire: -10 } },
};

export function weatherOf(time) {
  const day = time?.day ?? BALANCE.time.startDay;
  const min = time?.min ?? BALANCE.time.startMinutes;
  const slot = Math.floor(min / 240); // one weather block per 4 game-hours
  const h = (day * 37 + slot * 61) % 100;
  let id = h < 45 ? 'clear' : h < 65 ? 'rain' : h < 80 ? 'heatwave' : h < 92 ? 'gale' : 'mist';
  // heat waves only rise under the midday and afternoon sun
  if (id === 'heatwave' && (min < 10 * 60 || min >= 17 * 60)) id = 'clear';
  return { id, ...WEATHERS[id] };
}

// Combat modifier for a Gu path, in percent (0 = unaffected).
export function weatherModOf(weather, path) {
  return weather?.mods?.[path] || 0;
}

// Battle-log line describing the current weather's effect on Gu.
export function weatherEffectLine(weather) {
  if (!weather || weather.id === 'clear') return null;
  const parts = Object.entries(weather.mods).map(([p, m]) =>
    `${PATH_BY_ID[p] ? locPathName(PATH_BY_ID[p]) : p} ${m > 0 ? '+' : ''}${m}%`).join(', ');
  return T(`weather.line.${weather.id}`, { mods: parts });
}