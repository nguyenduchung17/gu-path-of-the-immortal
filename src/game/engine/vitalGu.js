// Vital Gu (Cổ Bản Mệnh) stability — an explicit, cause-driven record.
// Instability is NEVER inferred from cultivation, hunger, sleep or any other
// system: it exists only while a record says it does, and only these events
// may write one — re-binding an existing Vital Gu ('switched'), a failed
// Vital-Gu refinement ('refinement'), or a special story event ('story').

const DAY_MIN = 24 * 60;

export function totalGameMin(time = {}) {
  return ((time.day || 1) * DAY_MIN) + (time.min || 0);
}

// Write an explicit instability record (cause + window + recovery penalty).
export function startInstability(state, cause, recoveryPct, durationMin) {
  const now = totalGameMin(state.time);
  return {
    ...state,
    player: {
      ...state.player,
      vitalInstability: { cause, recoveryPct, startMin: now, endMin: now + durationMin },
    },
  };
}

// The record only counts while its window is open — an expired record is inert.
export function activeInstability(state, nowMin = totalGameMin(state.time)) {
  const inst = state.player?.vitalInstability;
  return inst && nowMin < inst.endMin ? inst : null;
}

// The single source of truth for the UI: is the Vital Gu bond stable,
// unstable (explicit cause) or injured (refinement wounds)? Derived only
// from stored records — never from hunger or unrelated cultivation actions.
export function vitalStatusOf(state) {
  const inst = state.vitalGu ? state.ownedGu?.find(g => g.instanceId === state.vitalGu) : null;
  if (!inst) return null;
  const instability = activeInstability(state);
  const day = state.time?.day || 1;
  const injured = (inst.injuredUntilDay || 0) > day;
  const nowMin = totalGameMin(state.time);
  return {
    inst,
    status: instability ? 'unstable' : injured ? 'injured' : 'stable',
    instability,
    causeKey: instability?.cause || null,
    recoveryPct: instability?.recoveryPct || 0,
    remainingMin: instability ? Math.max(0, instability.endMin - nowMin) : 0,
    injured,
    severity: inst.injurySeverity || null,
    injuredUntilDay: inst.injuredUntilDay || 0,
  };
}

// "1d 6h" / "18h 42m" / "5m" — in-game time remaining.
export function fmtRemaining(min) {
  if (min >= DAY_MIN) return `${Math.floor(min / DAY_MIN)}d ${Math.floor((min % DAY_MIN) / 60)}h`;
  if (min >= 60) return `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;
  return `${Math.max(0, Math.round(min))}m`;
}