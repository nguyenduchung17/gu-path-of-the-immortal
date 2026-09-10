// Lightweight synthesized game audio (no external assets) + ambience bed.
// Sounds are deliberately subtle; everything is muted via the HUD toggle.

let ctxA = null, master = null;
let muted = (() => { try { return localStorage.getItem('gu_sound_off') === '1'; } catch { return false; } })();

function ensure() {
  if (!ctxA) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctxA = new AC();
    master = ctxA.createGain();
    master.gain.value = 0.4;
    master.connect(ctxA.destination);
  }
  if (ctxA.state === 'suspended') ctxA.resume();
  return ctxA;
}
function running() {
  return ensure() && ctxA.state === 'running' ? ctxA : null;
}

function noiseBuffer(dur = 0.3) {
  const len = Math.floor(ctxA.sampleRate * dur);
  const buf = ctxA.createBuffer(1, len, ctxA.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function blip({ type = 'square', f0 = 660, f1 = null, dur = 0.08, vol = 0.12, delay = 0 }) {
  const t0 = ctxA.currentTime + delay;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  if (f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.08, vol = 0.1, freq = 800, q = 1, delay = 0 }) {
  const t0 = ctxA.currentTime + delay;
  const src = ctxA.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const filt = ctxA.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  filt.Q.value = q;
  const gain = ctxA.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filt).connect(gain).connect(master);
  src.start(t0);
}

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  try { localStorage.setItem('gu_sound_off', muted ? '1' : '0'); } catch { /* private mode */ }
  if (master) master.gain.value = muted ? 0 : 0.4;
  return muted;
}

export function sfx(name) {
  if (muted) return;
  if (!running()) return;
  try {
    switch (name) {
      case 'step': noise({ dur: 0.05, vol: 0.07, freq: 380 + Math.random() * 220, q: 0.8 }); break;
      case 'ui': blip({ type: 'square', f0: 620, f1: 760, dur: 0.05, vol: 0.07 }); break;
      case 'open': blip({ type: 'triangle', f0: 440, f1: 660, dur: 0.09, vol: 0.08 }); break;
      case 'hit': blip({ type: 'triangle', f0: 150, f1: 55, dur: 0.12, vol: 0.16 }); noise({ dur: 0.07, vol: 0.09, freq: 900 }); break;
      case 'cast': blip({ type: 'sine', f0: 320, f1: 920, dur: 0.22, vol: 0.1 }); break;
      case 'hurt': blip({ type: 'sawtooth', f0: 220, f1: 70, dur: 0.16, vol: 0.12 }); break;
      case 'dodge': noise({ dur: 0.09, vol: 0.07, freq: 1600, q: 2 }); break;
      case 'encounter': blip({ type: 'square', f0: 190, f1: 150, dur: 0.14, vol: 0.12 }); blip({ type: 'square', f0: 240, f1: 190, dur: 0.14, vol: 0.1, delay: 0.13 }); break;
      case 'chime': blip({ type: 'sine', f0: 660, dur: 0.2, vol: 0.1 }); blip({ type: 'sine', f0: 990, dur: 0.3, vol: 0.08, delay: 0.12 }); break;
      case 'confirm': blip({ type: 'triangle', f0: 520, f1: 700, dur: 0.09, vol: 0.08 }); break;
      case 'cancel': blip({ type: 'triangle', f0: 420, f1: 280, dur: 0.09, vol: 0.07 }); break;
      case 'fire': noise({ dur: 0.25, vol: 0.12, freq: 600, q: 0.6 }); blip({ type: 'sawtooth', f0: 300, f1: 120, dur: 0.2, vol: 0.08 }); break;
      case 'wind': noise({ dur: 0.3, vol: 0.1, freq: 1500, q: 0.4 }); break;
      case 'stone': blip({ type: 'triangle', f0: 110, f1: 60, dur: 0.15, vol: 0.14 }); noise({ dur: 0.1, vol: 0.08, freq: 300 }); break;
      case 'water': blip({ type: 'sine', f0: 500, f1: 800, dur: 0.12, vol: 0.08 }); blip({ type: 'sine', f0: 650, f1: 950, dur: 0.12, vol: 0.06, delay: 0.08 }); break;
      case 'heal': blip({ type: 'sine', f0: 520, f1: 780, dur: 0.25, vol: 0.09 }); break;
      case 'sense': blip({ type: 'sine', f0: 1200, f1: 1600, dur: 0.15, vol: 0.07 }); break;
      case 'summon': blip({ type: 'sawtooth', f0: 160, f1: 90, dur: 0.3, vol: 0.1 }); noise({ dur: 0.2, vol: 0.06, freq: 250 }); break;
      case 'killer': blip({ type: 'square', f0: 160, f1: 320, dur: 0.3, vol: 0.12 }); noise({ dur: 0.35, vol: 0.12, freq: 700 }); blip({ type: 'sine', f0: 880, dur: 0.4, vol: 0.08, delay: 0.2 }); break;
      case 'fail': blip({ type: 'sawtooth', f0: 200, f1: 120, dur: 0.2, vol: 0.09 }); blip({ type: 'sawtooth', f0: 150, f1: 90, dur: 0.2, vol: 0.07, delay: 0.1 }); break;
      case 'block': noise({ dur: 0.08, vol: 0.12, freq: 500, q: 3 }); blip({ type: 'triangle', f0: 220, f1: 180, dur: 0.08, vol: 0.09 }); break;
      case 'crit': blip({ type: 'square', f0: 880, f1: 1320, dur: 0.15, vol: 0.09 }); break;
      case 'die': blip({ type: 'sawtooth', f0: 140, f1: 40, dur: 0.5, vol: 0.14 }); noise({ dur: 0.4, vol: 0.08, freq: 300 }); break;
      default: break;
    }
  } catch { /* audio unavailable */ }
}

// Layered ambience lives in ambience.js (multiple soft beds + randomized
// one-shot events); it routes through this same mute-controlled master gain.
export function audioNodes() {
  return { ok: !!running(), ctx: ctxA, master };
}

// first user gesture resumes the audio context (autoplay policies)
export function primeAudio() {
  ensure();
}