import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudRecordToSave, newerSave, prepareSavePayload } from './cloudSaves.js';

const save = { version: 19, characterId: 'char_local', status: 'ALIVE', player: { name: 'Local' } };

test('cloud payloads retain slot and character identity', () => {
  const payload = prepareSavePayload(save, 2, 1234);
  assert.equal(payload.slotId, 2);
  assert.equal(payload.characterId, 'char_local');
  assert.equal(payload.savedAt, 1234);
});

test('cloud record identity cannot be overridden by stale payload fields', () => {
  const restored = cloudRecordToSave({
    slot_id: 3, character_id: 'char_server', save_version: 19, status: 'ALIVE', client_updated_at: 20,
    payload: { ...save, slotId: 1, characterId: 'char_wrong', savedAt: 1 },
  });
  assert.equal(restored.slotId, 3);
  assert.equal(restored.characterId, 'char_server');
  assert.equal(restored.savedAt, 20);
});

test('newest save wins initial local/cloud reconciliation', () => {
  const local = { ...save, savedAt: 30 };
  const cloud = { slot_id: 1, character_id: 'char_cloud', save_version: 19, status: 'ALIVE', client_updated_at: 20, payload: save };
  assert.strictEqual(newerSave(local, cloud), local);
  assert.equal(newerSave({ ...local, savedAt: 10 }, cloud).characterId, 'char_cloud');
});

