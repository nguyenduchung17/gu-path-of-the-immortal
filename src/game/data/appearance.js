// Character appearance catalogs + preset templates. Stored on player.appearance
// inside each save slot, so every save keeps its own cultivator look.

export const BODY_TYPES = [
  { id: 'male', label: 'Masculine' },
  { id: 'female', label: 'Feminine' },
  { id: 'slight', label: 'Slight' },
];

export const HAIRSTYLES = [
  { id: 'short', label: 'Short' },
  { id: 'topknot', label: 'Topknot' },
  { id: 'bun', label: 'Bun' },
  { id: 'long', label: 'Long' },
  { id: 'braids', label: 'Braids' },
  { id: 'spiky', label: 'Wild' },
];

export const HAIR_COLORS = ['#141414', '#3a2a18', '#4a3018', '#6e3a1f', '#8a5a2a', '#c9a45a', '#e8e4d8', '#7a3a4a', '#3a5a7a', '#4a7a4a'];
export const SKIN_TONES = ['#f2cfa5', '#e8b88a', '#d9a878', '#c99767', '#a8785a', '#8a5f42', '#6b4a34'];
export const EYE_COLORS = ['#3a2a18', '#2a5a8a', '#3a7a4a', '#7a3a3a', '#6a4a8a', '#8a8a2a'];

export const OUTFITS = [
  { id: 'robe', label: 'Wandering Robe' },
  { id: 'tunic', label: 'Cloth Tunic' },
  { id: 'martial', label: 'Martial Garb' },
  { id: 'armor', label: 'Light Armor' },
];

export const OUTFIT_COLORS = [
  '#2f7a52', '#3a6b8a', '#8a4a4a', '#6b4a8a', '#8a7a3a',
  '#556077', '#2a3a4a', '#7a3a5a', '#c9a45a', '#3f3f46',
];

export const ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'scarf', label: 'Scarf' },
  { id: 'belt', label: 'Sash' },
  { id: 'shoulderCloth', label: 'Shoulder Cloth' },
  { id: 'headband', label: 'Headband' },
  { id: 'ornament', label: 'Hairpin' },
];

export const DEFAULT_APPEARANCE = {
  preset: null,
  body: 'male', hair: 'short', hairColor: '#141414', skin: '#e8b88a', eyes: '#3a2a18',
  outfit: 'robe', outfitPrimary: '#2f7a52', outfitSecondary: '#c9a45a', accessory: 'none',
};

export const PRESETS = [
  {
    id: 'wanderingDisciple', label: 'Wandering Disciple',
    app: { body: 'male', hair: 'topknot', hairColor: '#141414', skin: '#e8b88a', eyes: '#3a2a18', outfit: 'robe', outfitPrimary: '#2f7a52', outfitSecondary: '#c9a45a', accessory: 'scarf' },
  },
  {
    id: 'villageYouth', label: 'Village Youth',
    app: { body: 'slight', hair: 'short', hairColor: '#4a3018', skin: '#f2cfa5', eyes: '#3a2a18', outfit: 'tunic', outfitPrimary: '#8a7a3a', outfitSecondary: '#556077', accessory: 'none' },
  },
  {
    id: 'rogueCultivator', label: 'Rogue Cultivator',
    app: { body: 'male', hair: 'spiky', hairColor: '#141414', skin: '#c99767', eyes: '#7a3a3a', outfit: 'armor', outfitPrimary: '#3f3f46', outfitSecondary: '#8a4a4a', accessory: 'scarf' },
  },
  {
    id: 'sectNovice', label: 'Sect Novice',
    app: { body: 'female', hair: 'braids', hairColor: '#3a2a18', skin: '#e8b88a', eyes: '#2a5a8a', outfit: 'robe', outfitPrimary: '#3a6b8a', outfitSecondary: '#e8e4d8', accessory: 'headband' },
  },
  {
    id: 'merchantHeir', label: 'Merchant Heir',
    app: { body: 'female', hair: 'long', hairColor: '#6e3a1f', skin: '#f2cfa5', eyes: '#6a4a8a', outfit: 'tunic', outfitPrimary: '#c9a45a', outfitSecondary: '#8a4a4a', accessory: 'ornament' },
  },
  {
    id: 'beastHunter', label: 'Beast Hunter',
    app: { body: 'male', hair: 'bun', hairColor: '#3a2a18', skin: '#a8785a', eyes: '#3a2a18', outfit: 'martial', outfitPrimary: '#8a4a4a', outfitSecondary: '#2a3a4a', accessory: 'shoulderCloth' },
  },
];

// Merges defaults so older saves (no appearance) always render a valid sprite.
// Accepts a player object or a raw appearance object.
export function appearanceOf(playerOrApp) {
  const app = playerOrApp?.appearance || playerOrApp || {};
  return { ...DEFAULT_APPEARANCE, ...app };
}
