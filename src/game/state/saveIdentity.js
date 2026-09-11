const safePart = (value) => String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);

function randomId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export const newCharacterId = () => randomId('char');
export const newCreationSessionId = () => randomId('creation');

// Old saves predate character IDs. Their fallback is deterministic so merely
// opening the slot picker never changes identity; all newly-created characters
// receive a random ID and therefore cannot inherit a deleted slot occupant.
export function legacyCharacterId(save, slot) {
  return `char_legacy_${safePart(save?.createdAt)}_${safePart(slot ?? save?.slot ?? 1)}_${safePart(save?.player?.name)}`;
}

export function withSaveIdentity(save, slot = save?.slot ?? 1) {
  if (!save) return save;
  const characterId = save.characterId || legacyCharacterId(save, slot);
  const record = save.deceased;
  const deathMatches = !!record && (!record.characterId || record.characterId === characterId);
  const deceased = deathMatches ? { ...record, characterId } : null;

  return {
    ...save,
    slot,
    slotId: slot,
    characterId,
    status: deceased ? 'DECEASED' : 'ALIVE',
    deceased,
  };
}

export function validDeathRecord(save) {
  return !!(
    save
    && save.status === 'DECEASED'
    && save.characterId
    && save.deceased
    && save.deceased.characterId === save.characterId
  );
}

