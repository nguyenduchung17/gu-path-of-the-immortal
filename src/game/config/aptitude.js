// Cultivation Aptitude (Tư Chất) — central configuration.
// Aptitude is stored as a numeric score (0–10) plus an optional Special
// Constitution. It shapes essence capacity, essence recovery speed and
// cultivation efficiency — never raw combat stats.

export const APTITUDE = {
  scoreMin: 2,
  scoreMax: 10,
  // Ordered high → low; a score belongs to the first tier whose `min` it meets.
  tiers: [
    { id: 'perfect', min: 9.5, essenceMul: 1.5, recoveryMul: 1.5, cultivateMul: 1.4 },
    { id: 'a', min: 8, essenceMul: 1.25, recoveryMul: 1.25, cultivateMul: 1.18 },
    { id: 'b', min: 6, essenceMul: 1.1, recoveryMul: 1.1, cultivateMul: 1.06 },
    { id: 'c', min: 4, essenceMul: 0.95, recoveryMul: 0.95, cultivateMul: 0.96 },
    { id: 'd', min: 2, essenceMul: 0.85, recoveryMul: 0.85, cultivateMul: 0.9 },
  ],
  // Weighted base-roll distribution: D/C common, B moderate, A rare,
  // Perfect extremely rare. Values are relative weights.
  rollWeights: { d: 34, c: 30, b: 22, a: 12, perfect: 2 },
  // Free first attempt + this many rerolls, by difficulty.
  rerolls: { easy: 4, standard: 2, hard: 1, trueCultivation: 1 },
  // The aptitude minigame can add up to this much score on top of the base
  // roll (performance 0–100 → +0 … maxBonus). Never guarantees Perfect.
  minigameBonus: 1.5,
};

// Special Constitutions (Căn Thể) — ultra-rare frames above normal aptitude.
// Names are editable placeholders. `chance` is the per-character roll chance.
export const CONSTITUTIONS = [
  { id: 'solarMeridian', name: 'Solar Meridian Body', nameVi: 'Căn Thể Nhật Diệu', chance: 0.003, essenceMul: 1.15, recoveryMul: 1.2, cultivateMul: 1.05 },
  { id: 'lunarAbyss', name: 'Lunar Abyss Body', nameVi: 'Căn Thể Nguyệt Uyên', chance: 0.001, essenceMul: 1.35, recoveryMul: 1.3, cultivateMul: 1.15, ultimate: true },
  { id: 'frostSoul', name: 'Frost Soul Body', nameVi: 'Căn Thể Hàn Băng', chance: 0.002, essenceMul: 1.1, recoveryMul: 1.15 },
  { id: 'verdantCycle', name: 'Verdant Cycle Body', nameVi: 'Căn Thể Thanh Mộc', chance: 0.002, recoveryMul: 1.3, cultivateMul: 1.05 },
  { id: 'thunderflame', name: 'Thunderflame Body', nameVi: 'Căn Thể Lôi Hỏa', chance: 0.0015, essenceMul: 1.2, cultivateMul: 1.1 },
  { id: 'metalBlossom', name: 'Metal Blossom Body', nameVi: 'Căn Thể Kim Hoa', chance: 0.0015, essenceMul: 1.12, cultivateMul: 1.08 },
  { id: 'trueStrength', name: 'True Strength Body', nameVi: 'Căn Thể Chân Lực', chance: 0.0015, essenceMul: 1.08, cultivateMul: 1.12 },
  { id: 'freeMind', name: 'Free Mind Body', nameVi: 'Căn Thể Tự Tâm', chance: 0.0015, recoveryMul: 1.25, cultivateMul: 1.08 },
  { id: 'dreamOrigin', name: 'Dream-Origin Body', nameVi: 'Căn Thể Mộng Nguyên', chance: 0.0015, essenceMul: 1.15, recoveryMul: 1.15 },
];
export const CONSTITUTION_BY_ID = Object.fromEntries(CONSTITUTIONS.map(c => [c.id, c]));

// ---- helpers ----

export function scoreOf(apt) {
  if (typeof apt === 'number') return apt;
  const s = apt?.score;
  return typeof s === 'number' && !isNaN(s) ? s : 5;
}

export function tierOf(apt) {
  const score = scoreOf(apt);
  return APTITUDE.tiers.find(tr => score >= tr.min) || APTITUDE.tiers[APTITUDE.tiers.length - 1];
}

function constitutionOf(apt) {
  return CONSTITUTION_BY_ID[apt?.constitution] || null;
}

// Max Essence = Base Realm Essence × Aptitude Modifier × Constitution Modifier
export function essenceCapFor(stageMaxEssence, apt) {
  const tier = tierOf(apt);
  const con = constitutionOf(apt);
  return Math.max(5, Math.round(stageMaxEssence * tier.essenceMul * (con?.essenceMul ?? 1)));
}

export function recoveryMulOf(apt) {
  const tier = tierOf(apt);
  const con = constitutionOf(apt);
  return tier.recoveryMul * (con?.recoveryMul ?? 1);
}

export function cultivateMulOf(apt) {
  const tier = tierOf(apt);
  const con = constitutionOf(apt);
  return tier.cultivateMul * (con?.cultivateMul ?? 1);
}

export function constitutionName(apt, lang) {
  const con = constitutionOf(apt);
  if (!con) return null;
  return lang === 'vi' ? con.nameVi : con.name;
}

// Coerce any stored/input aptitude into the canonical { score, constitution }.
export function normalizeAptitude(input) {
  const constitution =
    input && typeof input.constitution === 'string' && CONSTITUTION_BY_ID[input.constitution]
      ? input.constitution
      : null;
  return { score: Math.max(APTITUDE.scoreMin, Math.min(APTITUDE.scoreMax, scoreOf(input))), constitution };
}

// Weighted tier roll, then a 0.1-precision score inside the tier's range.
export function rollAptitudeScore() {
  const entries = Object.entries(APTITUDE.rollWeights);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let roll = Math.random() * total;
  let tierId = 'd';
  for (const [id, w] of entries) {
    if (roll < w) { tierId = id; break; }
    roll -= w;
  }
  const idx = APTITUDE.tiers.findIndex(t => t.id === tierId);
  const tier = APTITUDE.tiers[idx];
  const upper = idx > 0 ? APTITUDE.tiers[idx - 1].min : APTITUDE.scoreMax;
  const score = tier.min + Math.random() * (upper - tier.min);
  return Math.round(score * 10) / 10;
}

// Constitution is rolled once, when aptitude is accepted — rerolls of the
// score never re-roll the constitution, so reroll-farming stays pointless.
export function rollConstitution() {
  for (const con of CONSTITUTIONS) {
    if (Math.random() < con.chance) return con.id;
  }
  return null;
}