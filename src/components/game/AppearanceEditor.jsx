import React from 'react';
import {
  BODY_TYPES, HAIRSTYLES, HAIR_COLORS, SKIN_TONES, EYE_COLORS,
  OUTFITS, OUTFIT_COLORS, ACCESSORIES, PRESETS,
} from '@/game/data/appearance';

// Appearance customization section for character creation:
// presets + swatch/chip pickers. Live preview lives in CharacterCreation.
const Swatch = ({ color, sel, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-6 h-6 rounded-md border-2 transition ${sel ? 'border-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-black/50 hover:border-white/40'}`}
    style={{ background: color }}
    aria-label={color}
  />
);

const Chip = ({ label, sel, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1 rounded-md text-[11px] border transition ${sel ? 'border-emerald-400 bg-emerald-900/40 text-emerald-100' : 'border-stone-700 bg-white/5 text-stone-300 hover:bg-white/10'}`}
  >
    {label}
  </button>
);

const Group = ({ label, children }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1.5">{label}</div>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

export default function AppearanceEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch, preset: null });
  const applyPreset = (p) => onChange({ ...p.app, preset: p.id });

  return (
    <div className="space-y-3">
      {/* presets */}
      <Group label="Presets">
        {PRESETS.map((p) => (
          <Chip key={p.id} label={p.label} sel={value.preset === p.id} onClick={() => applyPreset(p)} />
        ))}
      </Group>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <Group label="Body">
          {BODY_TYPES.map((o) => <Chip key={o.id} label={o.label} sel={value.body === o.id} onClick={() => set({ body: o.id })} />)}
        </Group>
        <Group label="Hair Style">
          {HAIRSTYLES.map((o) => <Chip key={o.id} label={o.label} sel={value.hair === o.id} onClick={() => set({ hair: o.id })} />)}
        </Group>
        <Group label="Hair Color">
          {HAIR_COLORS.map((c) => <Swatch key={c} color={c} sel={value.hairColor === c} onClick={() => set({ hairColor: c })} />)}
        </Group>
        <Group label="Skin Tone">
          {SKIN_TONES.map((c) => <Swatch key={c} color={c} sel={value.skin === c} onClick={() => set({ skin: c })} />)}
        </Group>
        <Group label="Eye Color">
          {EYE_COLORS.map((c) => <Swatch key={c} color={c} sel={value.eyes === c} onClick={() => set({ eyes: c })} />)}
        </Group>
        <Group label="Outfit">
          {OUTFITS.map((o) => <Chip key={o.id} label={o.label} sel={value.outfit === o.id} onClick={() => set({ outfit: o.id })} />)}
        </Group>
        <Group label="Outfit Color">
          {OUTFIT_COLORS.map((c) => <Swatch key={c} color={c} sel={value.outfitPrimary === c} onClick={() => set({ outfitPrimary: c })} />)}
        </Group>
        <Group label="Trim Color">
          {OUTFIT_COLORS.map((c) => <Swatch key={c} color={c} sel={value.outfitSecondary === c} onClick={() => set({ outfitSecondary: c })} />)}
        </Group>
      </div>

      <Group label="Accessory">
        {ACCESSORIES.map((o) => <Chip key={o.id} label={o.label} sel={value.accessory === o.id} onClick={() => set({ accessory: o.id })} />)}
      </Group>
    </div>
  );
}