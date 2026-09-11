import { base44 } from '../../api/base44Client.js';

const entity = () => base44.entities.GameSave;

export function prepareSavePayload(save, slotId, savedAt = Date.now()) {
  return {
    ...save,
    slot: slotId,
    slotId,
    savedAt,
    toasts: [],
    breakthrough: null,
    dialogue: null,
    pendingEvent: null,
  };
}

export function cloudRecordToSave(record) {
  if (!record?.payload || !record.character_id) return null;
  return {
    ...record.payload,
    slot: record.slot_id,
    slotId: record.slot_id,
    characterId: record.character_id,
    version: record.save_version,
    status: record.status,
    savedAt: record.client_updated_at || record.payload.savedAt || 0,
  };
}

export function newerSave(localSave, cloudRecord) {
  const cloudSave = cloudRecordToSave(cloudRecord);
  if (!localSave) return cloudSave;
  if (!cloudSave) return localSave;
  return (cloudSave.savedAt || 0) > (localSave.savedAt || 0) ? cloudSave : localSave;
}

export async function listCloudSaveRecords() {
  const records = await entity().list('-updated_date', 50);
  const bySlot = new Map();
  for (const record of records) {
    const current = bySlot.get(record.slot_id);
    if (!current || (record.client_updated_at || 0) > (current.client_updated_at || 0)) bySlot.set(record.slot_id, record);
  }
  return bySlot;
}

export async function upsertCloudSave(save, existingRecord) {
  const data = {
    slot_id: save.slotId,
    character_id: save.characterId,
    save_version: save.version || 1,
    status: save.status || 'ALIVE',
    client_updated_at: save.savedAt || Date.now(),
    payload: save,
  };
  if (existingRecord?.id) return entity().update(existingRecord.id, data);

  const matches = await entity().filter({ slot_id: save.slotId }, '-updated_date', 10);
  if (matches[0]?.id) return entity().update(matches[0].id, data);
  return entity().create(data);
}

export async function deleteCloudSlot(slotId, knownRecord) {
  const records = knownRecord?.id
    ? [knownRecord]
    : await entity().filter({ slot_id: slotId }, '-updated_date', 10);
  await Promise.all(records.map(record => entity().delete(record.id)));
}

