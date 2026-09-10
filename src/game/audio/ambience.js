// Layered environmental ambience: several soft continuous beds (wind, water,
// crowd, insects) + a randomized one-shot scheduler (bird calls, gusts, doors,
// frogs, crickets…) with jittered timing, volume and pitch, so nothing sounds
// like a short artificial loop. Simple positional mixing: gains follow the
// player's distance to the river, the market, the camp — and nearby beasts
// can be heard growling. Terrain-aware footsteps live here too.
import { audioNodes, isMuted } from './sfx';

let ambCtx = null, ambOut = null;
const beds = new Map();
let schedOn = false;
let cur = { profile: null, night: false };
let pos = { x: -99, y: -99, enemyDist: 99, camp: 0 };
let lastPosT = 0;

function bus() {
  const n = audioNodes();
  if (!n.ok) return null;
  ambCtx = n.ctx;
  if (!ambOut) {
    ambOut = n.ctx.createGain();
    ambOut.gain.value = 0.9;
    ambOut.connect(n.master);
  }
  return ambCtx;
}

function noiseBuf(dur = 2.5) {
  const len = Math.floor(ambCtx.sampleRate * dur);
  const buf = ambCtx.createBuffer(1, len, ambCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ---- continuous beds (very quiet; they breathe via jitterBedGains) ----
function bed(id, { freq, q = 0.8, gain, type = 'lowpass' }) {
  if (beds.has(id)) return beds.get(id);
  const ctx = bus();
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf();
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = freq;
  filt.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(filt).connect(g).connect(ambOut);
  src.start();
  const b = { g, filt, base: gain };
  beds.set(id, b);
  return b;
}

function ramp(id, target, tc = 0.8) {
  const b = beds.get(id);
  if (!b || !ambCtx) return;
  b.g.gain.setTargetAtTime(Math.max(0, target), ambCtx.currentTime, tc);
}

// ---- one-shot synth voices ----
function voice(fn, { vol = 0.1, pan = 0 } = {}) {
  if (!ambCtx || isMuted()) return;
  const t0 = ambCtx.currentTime;
  const p = ambCtx.createStereoPanner ? ambCtx.createStereoPanner() : null;
  const g = ambCtx.createGain();
  g.gain.value = vol;
  if (p) { p.pan.value = pan; g.connect(p).connect(ambOut); } else g.connect(ambOut);
  fn(t0, g);
}

function osc(t0, out, { type = 'sine', f0, f1 = null, dur = 0.15, delay = 0 }) {
  const o = ambCtx.createOscillator();
  const gg = ambCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0 + delay);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + delay + dur);
  gg.gain.setValueAtTime(1, t0 + delay);
  gg.gain.exponentialRampToValueAtTime(0.001, t0 + delay + dur);
  o.connect(gg).connect(out);
  o.start(t0 + delay);
  o.stop(t0 + delay + dur + 0.02);
}

function noiseHit(t0, out, { dur = 0.2, freq = 800, q = 1, vol = 1, delay = 0 }) {
  const src = ambCtx.createBufferSource();
  src.buffer = noiseBuf(Math.max(0.2, dur));
  const filt = ambCtx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  filt.Q.value = q;
  const gg = ambCtx.createGain();
  gg.gain.setValueAtTime(vol, t0 + delay);
  gg.gain.exponentialRampToValueAtTime(0.001, t0 + delay + dur);
  src.connect(filt).connect(gg).connect(out);
  src.start(t0 + delay);
  src.stop(t0 + delay + dur + 0.02);
}

const r = (a, b) => a + Math.random() * (b - a);

// Each voice self-randomizes pitch, volume and repeat count (organic timing).
const VOICES = {
  bird(t0, out, v) {
    const n = 2 + (Math.random() * 3 | 0);
    const f = r(2200, 3800);
    for (let i = 0; i < n; i++) osc(t0, out, { type: 'sine', f0: f * r(0.9, 1.15), f1: f * r(0.7, 0.9), dur: r(0.05, 0.1), delay: i * r(0.09, 0.16) });
  },
  birdFar(t0, out, v) { VOICES.bird(t0, out, v * 0.4); },
  howl(t0, out) { osc(t0, out, { type: 'sine', f0: r(320, 420), f1: r(240, 300), dur: r(0.7, 1.2) }); osc(t0, out, { type: 'sine', f0: 480, f1: 300, dur: 0.5, delay: 0.3 }); },
  gust(t0, out, v) {
    const dur = r(1.4, 2.6);
    const src = ambCtx.createBufferSource(); src.buffer = noiseBuf(dur);
    const filt = ambCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 0.5;
    filt.frequency.setValueAtTime(r(280, 420), t0);
    filt.frequency.linearRampToValueAtTime(r(600, 900), t0 + dur * 0.5);
    filt.frequency.linearRampToValueAtTime(r(250, 380), t0 + dur);
    const gg = ambCtx.createGain();
    gg.gain.setValueAtTime(0.001, t0);
    gg.gain.linearRampToValueAtTime(v, t0 + dur * 0.4);
    gg.gain.linearRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt).connect(gg).connect(out);
    src.start(t0); src.stop(t0 + dur);
  },
  rustle(t0, out) { for (let i = 0; i < 3; i++) noiseHit(t0, out, { dur: r(0.05, 0.12), freq: r(4000, 6500), q: 0.7, vol: r(0.4, 0.9), delay: i * r(0.06, 0.14) }); },
  branch(t0, out) { osc(t0, out, { type: 'sawtooth', f0: r(90, 140), f1: r(50, 70), dur: r(0.25, 0.45), }); noiseHit(t0, out, { dur: 0.1, freq: 500, q: 1 }); },
  cricket(t0, out) { const f = r(4000, 4600); for (let i = 0; i < 6; i++) osc(t0, out, { type: 'triangle', f0: f, dur: 0.03, delay: i * 0.07 }); },
  owl(t0, out) { osc(t0, out, { type: 'sine', f0: r(340, 400), f1: r(280, 320), dur: 0.35 }); osc(t0, out, { type: 'sine', f0: 320, f1: 270, dur: 0.5, delay: 0.5 }); },
  frog(t0, out) { for (let i = 0; i < 2; i++) osc(t0, out, { type: 'sine', f0: r(260, 340), f1: r(140, 180), dur: r(0.12, 0.2), delay: i * r(0.15, 0.25) }); },
  waterLap(t0, out) { noiseHit(t0, out, { dur: r(0.15, 0.3), freq: r(700, 1300), q: 1.4, vol: r(0.5, 1) }); noiseHit(t0, out, { dur: 0.15, freq: 2200, q: 2, vol: 0.4, delay: r(0.1, 0.2) }); },
  slosh(t0, out) { noiseHit(t0, out, { dur: r(0.3, 0.5), freq: 500, q: 0.8, vol: 0.7 }); osc(t0, out, { type: 'sine', f0: 180, f1: 90, dur: 0.2 }); },
  stoneFall(t0, out) { osc(t0, out, { type: 'triangle', f0: r(160, 240), f1: r(60, 90), dur: r(0.12, 0.2) }); noiseHit(t0, out, { dur: 0.15, freq: 900, q: 1 }); },
  rumble(t0, out) { osc(t0, out, { type: 'sine', f0: r(45, 65), f1: 30, dur: r(0.8, 1.5) }); },
  eerie(t0, out) { osc(t0, out, { type: 'sine', f0: r(180, 240), f1: r(160, 210), dur: r(1.2, 2.2) }); },
  murmur(t0, out, v) {
    const dur = r(1.2, 2.4);
    const src = ambCtx.createBufferSource(); src.buffer = noiseBuf(dur);
    const filt = ambCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = r(260, 420); filt.Q.value = 2;
    const gg = ambCtx.createGain();
    gg.gain.setValueAtTime(0.001, t0);
    gg.gain.linearRampToValueAtTime(v, t0 + dur * 0.3);
    gg.gain.linearRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt).connect(gg).connect(out);
    src.start(t0); src.stop(t0 + dur);
  },
  door(t0, out) { osc(t0, out, { type: 'sawtooth', f0: r(130, 180), f1: r(70, 95), dur: r(0.2, 0.35) }); noiseHit(t0, out, { dur: 0.06, freq: 300, q: 2, vol: 0.5, delay: 0.25 }); },
  cart(t0, out) {
    const dur = r(1.5, 2.5);
    for (let i = 0; i < 6; i++) noiseHit(t0, out, { dur: 0.05, freq: 140, q: 2, vol: 0.5, delay: i * (dur / 6) });
    osc(t0, out, { type: 'sine', f0: 70, f1: 55, dur });
  },
  hammer(t0, out) { osc(t0, out, { type: 'square', f0: r(750, 950), f1: 400, dur: 0.06 }); noiseHit(t0, out, { dur: 0.1, freq: 2400, q: 2, vol: 0.6, delay: 0.02 }); },
  bell(t0, out) { osc(t0, out, { type: 'sine', f0: r(880, 1100), dur: 0.5 }); osc(t0, out, { type: 'sine', f0: 660, dur: 0.4, delay: 0.05 }); },
  growl(t0, out, v) { const f = r(60, 85); for (let i = 0; i < 5; i++) osc(t0, out, { type: 'sawtooth', f0: f * r(0.9, 1.15), f1: f * 0.8, dur: 0.09, delay: i * 0.1 }); },
  campfire(t0, out) { for (let i = 0; i < 4; i++) noiseHit(t0, out, { dur: 0.06, freq: r(900, 1800), q: 1.2, vol: r(0.3, 0.8), delay: i * r(0.08, 0.2) }); },
  insectBurst(t0, out) { for (let i = 0; i < 3; i++) osc(t0, out, { type: 'triangle', f0: r(5000, 6200), dur: 0.04, delay: i * 0.11 }); },
};

// ---- profiles: which beds run, which one-shots may fire (weight) ----
const PROFILES = {
  town:    { beds: { crowd: { freq: 320, gain: 0.018 }, breeze: { freq: 700, gain: 0.006 } },
             events: { murmur: 0.55, door: 0.45, cart: 0.3, bell: 0.25, hammer: 0.15 } },
  forest:  { beds: { leaves: { freq: 5200, gain: 0.007, type: 'bandpass' }, breeze: { freq: 600, gain: 0.011 } },
             events: { bird: 0.7, rustle: 0.55, branch: 0.3, gust: 0.35, howl: 0.12 } },
  deepForest: { beds: { leaves: { freq: 5000, gain: 0.005, type: 'bandpass' }, breeze: { freq: 480, gain: 0.014 } },
             events: { bird: 0.3, rustle: 0.6, branch: 0.35, gust: 0.4, howl: 0.3, growl: 0.15 } },
  mountain:{ beds: { breeze: { freq: 420, gain: 0.02 } },
             events: { gust: 0.65, stoneFall: 0.3, birdFar: 0.35, rumble: 0.1 } },
  plains:  { beds: { breeze: { freq: 520, gain: 0.013 }, insects: { freq: 6200, gain: 0.003, type: 'bandpass' } },
             events: { bird: 0.4, insectBurst: 0.4, gust: 0.5, howl: 0.08 } },
  farm:    { beds: { breeze: { freq: 560, gain: 0.011 } },
             events: { bird: 0.55, rustle: 0.35, insectBurst: 0.3, gust: 0.3 } },
  marsh:   { beds: { water: { freq: 800, gain: 0.012, type: 'bandpass' }, insects: { freq: 5800, gain: 0.004, type: 'bandpass' } },
             events: { frog: 0.65, slosh: 0.35, cricket: 0.4, waterLap: 0.3 } },
  ruins:   { beds: { breeze: { freq: 380, gain: 0.015 } },
             events: { gust: 0.5, stoneFall: 0.3, eerie: 0.22, rumble: 0.15 } },
  camp:    { beds: { breeze: { freq: 500, gain: 0.009 } },
             events: { murmur: 0.3, door: 0.15, cart: 0.1 } },
};

const ZONE_PROFILE = {
  greenValleyTown: 'town', willowHamlet: 'town', forestOutskirts: 'forest', wildForest: 'forest',
  deepForest: 'deepForest', farmland: 'farm', southernWilds: 'plains', eastHills: 'mountain',
  eastPlains: 'plains', marsh: 'marsh', ruins: 'ruins', banditCamp: 'camp',
  ironfangTerritory: 'deepForest', region: 'plains',
};

function eventsFor(profileId, night) {
  const p = PROFILES[profileId] || PROFILES.plains;
  const ev = { ...p.events };
  if (night) {
    if (ev.bird) ev.bird *= 0.2;
    if (ev.birdFar) ev.birdFar = 0;
    ev.cricket = (ev.cricket || 0) + 1.1;
    ev.owl = (ev.owl || 0) + 0.45;
    ev.frog = (ev.frog || 0) * 1.4;
    if (ev.murmur) ev.murmur *= 0.25;
    if (ev.cart) ev.cart *= 0.3;
    if (ev.bell) ev.bell = 0;
  }
  return Object.entries(ev).filter(([, w]) => w > 0);
}

function weightedPick(evs) {
  const total = evs.reduce((a, [, w]) => a + w, 0);
  let x = Math.random() * total;
  for (const [name, w] of evs) { x -= w; if (x <= 0) return name; }
  return evs[evs.length - 1][0];
}

// ---- scheduler: irregular gaps, quiet random volumes, random stereo pan ----
function tick() {
  if (!schedOn) return;
  if (bus() && !isMuted() && cur.profile) {
    const evs = eventsFor(cur.profile, cur.night);
    const name = weightedPick(evs);
    if (name) voice((t0, out) => VOICES[name](t0, out, r(0.03, 0.07)), { vol: 1, pan: r(-0.7, 0.7) });
    // beasts nearby growl sometimes — louder the closer they are
    if (pos.enemyDist < 8 && Math.random() < 0.3) {
      const near = 1 - pos.enemyDist / 8;
      voice((t0, out) => VOICES.growl(t0, out, r(0.03, 0.075)), { pan: r(-0.5, 0.5) });
      void near;
    }
    if (pos.camp > 0.4 && Math.random() < 0.5) voice((t0, out) => VOICES.campfire(t0, out), { vol: 0.05 * pos.camp });
    // beds breathe: slow small drift on every bed so nothing is a flat loop
    for (const [id, b] of beds) {
      if (b.target > 0) b.g.gain.setTargetAtTime(b.target * r(0.75, 1.25), ambCtx.currentTime, 1.5);
    }
  }
  setTimeout(tick, r(1400, 5200));
}

// ---- public API ----
export function setEnvironment({ zoneId, night }) {
  if (!bus()) return;
  cur = { profile: ZONE_PROFILE[zoneId] || 'plains', night };
  const p = PROFILES[cur.profile];
  // crossfade beds: profile beds to their target, everything else to 0
  const targets = { ...p.beds };
  if (cur.profile === 'town' && !night) targets.crowd = { ...targets.crowd, gain: targets.crowd.gain };
  for (const [id, cfg] of Object.entries(targets)) {
    const b = bed(id, cfg);
    b.target = cfg.gain * (night && (id === 'crowd') ? 0.4 : 1);
    b.g.gain.setTargetAtTime(b.target, ambCtx.currentTime, 1.2);
  }
  for (const [id, b] of beds) {
    if (!targets[id]) { b.target = 0; b.g.gain.setTargetAtTime(0, ambCtx.currentTime, 1.2); }
  }
  // water bed is global (positional river mixing keeps it audible anywhere)
  const w = bed('water', { freq: 800, gain: 0, type: 'bandpass' });
  if (!targets.water) { w.target = 0.003; }
  if (!schedOn) { schedOn = true; tick(); }
}

// Positional mixing — call with the player's tile; internally throttled.
export function updateAudioPosition({ x, y, enemies }) {
  const now = performance.now();
  if (now - lastPosT < 400) { pos.x = x; pos.y = y; return; }
  lastPosT = now;
  pos.x = x; pos.y = y;
  if (!bus()) return;
  // river column (x 26–27): water louder as you approach
  const dxr = Math.max(0, Math.abs(x - 26.5) - 1.5);
  const riverProx = Math.max(0, 1 - dxr / 12);
  const w = bed('water', { freq: 800, gain: 0, type: 'bandpass' });
  w.g.gain.setTargetAtTime(0.002 + 0.03 * riverProx, ambCtx.currentTime, 0.8);
  // market crowd is louder at the stalls
  const mkt = Math.max(0, 1 - Math.hypot(x - 39.5, y - 42.5) / 7);
  const c = beds.get('crowd');
  if (c) c.g.gain.setTargetAtTime(c.target * (0.35 + 0.65 * mkt), ambCtx.currentTime, 0.9);
  // campsite crackle near the fire
  pos.camp = Math.max(0, 1 - Math.hypot(x - 23.5, y - 45) / 5);
  // nearest living beast
  let d = 99;
  for (const e of enemies || []) if (!e.dead) d = Math.min(d, Math.max(Math.abs(e.x - x), Math.abs(e.y - y)));
  pos.enemyDist = d;
}

// ---- footsteps: matched to terrain, pitch/volume randomized, never loud ----
const STEP_TERRAIN = {
  grass: { freq: 620, q: 0.8, vol: 0.045, thump: 0 },
  dirt:  { freq: 380, q: 0.9, vol: 0.05, thump: 55 },
  road:  { freq: 300, q: 1.1, vol: 0.055, thump: 70 },
  wood:  { freq: 220, q: 1.6, vol: 0.06, thump: 90 },
  stone: { freq: 500, q: 1.4, vol: 0.05, thump: 110 },
};
const CHAR_TERRAIN = {
  '.': 'grass', ',': 'grass', 'f': 'dirt', 'c': 'dirt', 'r': 'road',
  'b': 'wood', 's': 'wood', '*': 'stone', 'F': 'stone', 'W': 'stone', '#': 'stone',
};

export function footstep(char) {
  if (!bus() || isMuted()) return;
  const t = STEP_TERRAIN[CHAR_TERRAIN[char] || 'grass'];
  const f = t.freq * r(0.8, 1.25);
  const v = t.vol * r(0.65, 1.35);
  voice((t0, out) => {
    noiseHit(t0, out, { dur: 0.05, freq: f, q: t.q, vol: v * 8 });
    if (t.thump) osc(t0, out, { type: 'sine', f0: t.thump, f1: t.thump * 0.6, dur: 0.05 });
  });
}