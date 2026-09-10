// Dao / Path definitions. Add a new Path by appending one object here.
export const PATHS = [
  {
    id: 'fire', name: 'Fire Path', icon: '🔥', color: 'text-rose-300', border: 'border-rose-800/40',
    description: 'Direct damage, burning effects and explosive attacks. Fire cultivators burn hot and bright.',
    levels: [
      { text: '+3% Fire Gu damage', fx: { damagePct: 3 } },
      { text: '+6% Fire Gu damage', fx: { damagePct: 3 } },
      { text: '+9% Fire Gu damage · burn lasts +1 turn', fx: { damagePct: 3, burnTurns: 1 } },
      { text: '+12% Fire Gu damage', fx: { damagePct: 3 } },
      { text: '+15% Fire Gu damage · Fire Gu essence cost −10%', fx: { damagePct: 3, costPct: 10 } },
    ],
  },
  {
    id: 'wind', name: 'Wind Path', icon: '🌪️', color: 'text-cyan-300', border: 'border-cyan-800/40',
    description: 'Speed, movement, evasion and multi-hit attacks. The wind is never caught.',
    levels: [
      { text: '+2% evasion', fx: { evasionPct: 2 } },
      { text: '+4% evasion · +2% Wind Gu damage', fx: { evasionPct: 2, damagePct: 2 } },
      { text: '+6% evasion · +4% damage · flee chance +10%', fx: { evasionPct: 2, damagePct: 2, fleePct: 10 } },
      { text: '+8% evasion · +6% damage', fx: { evasionPct: 2, damagePct: 2 } },
      { text: '+10% evasion · +8% damage · Wind Gu essence cost −10%', fx: { evasionPct: 2, damagePct: 2, costPct: 10 } },
    ],
  },
  {
    id: 'earth', name: 'Earth Path', icon: '🪨', color: 'text-amber-300', border: 'border-amber-800/40',
    description: 'Defense, shields, durability and battlefield control. The mountain does not move.',
    levels: [
      { text: '+3% defense & barrier strength', fx: { defensePct: 3, barrierPct: 3 } },
      { text: '+6% defense & barrier strength', fx: { defensePct: 3, barrierPct: 3 } },
      { text: '+9% defense & barrier strength', fx: { defensePct: 3, barrierPct: 3 } },
      { text: '+12% strength · thorns reflect 2 damage', fx: { defensePct: 3, barrierPct: 3, thorns: 2 } },
      { text: '+15% strength · Earth Gu essence cost −10%', fx: { defensePct: 3, barrierPct: 3, costPct: 10 } },
    ],
  },
  {
    id: 'water', name: 'Water Path', icon: '💧', color: 'text-sky-300', border: 'border-sky-800/40',
    description: 'Recovery, status effects, control and utility. Water flows around every stone.',
    levels: [
      { text: '+4% healing from Water Gu', fx: { healPct: 4 } },
      { text: '+8% healing · +5% control potency', fx: { healPct: 4, controlPct: 5 } },
      { text: '+12% healing · +10% control', fx: { healPct: 4, controlPct: 5 } },
      { text: '+16% healing · +15% control', fx: { healPct: 4, controlPct: 5 } },
      { text: '+20% healing · Water Gu essence cost −10%', fx: { healPct: 4, costPct: 10 } },
    ],
  },
  {
    id: 'lightning', name: 'Lightning Path', icon: '⚡', color: 'text-yellow-300', border: 'border-yellow-700/40',
    description: 'Burst damage with a chance of paralysis. Lightning strikes first — and sometimes the foe never answers.',
    levels: [
      { text: '+3% Lightning Gu damage', fx: { damagePct: 3 } },
      { text: '+6% Lightning Gu damage', fx: { damagePct: 3 } },
      { text: '+9% Lightning Gu damage', fx: { damagePct: 3 } },
      { text: '+12% Lightning Gu damage', fx: { damagePct: 3 } },
      { text: '+15% Lightning Gu damage · Lightning Gu essence cost −10%', fx: { damagePct: 3, costPct: 10 } },
    ],
  },
  {
    id: 'ice', name: 'Ice Path', icon: '❄️', color: 'text-cyan-200', border: 'border-cyan-700/40',
    description: 'Control through dead-still cold. A frozen foe loses its moment — and with it, the fight.',
    levels: [
      { text: '+3% Ice Gu damage', fx: { damagePct: 3 } },
      { text: '+6% Ice Gu damage', fx: { damagePct: 3 } },
      { text: '+9% Ice Gu damage', fx: { damagePct: 3 } },
      { text: '+12% Ice Gu damage', fx: { damagePct: 3 } },
      { text: '+15% Ice Gu damage · Ice Gu essence cost −10%', fx: { damagePct: 3, costPct: 10 } },
    ],
  },
  {
    id: 'poison', name: 'Poison Path', icon: '☠️', color: 'text-lime-300', border: 'border-lime-700/40',
    description: 'Stacking venom that wins the long fights. Weak at the first strike; inevitable by the last.',
    levels: [
      { text: '+3% Poison Gu damage', fx: { damagePct: 3 } },
      { text: '+6% Poison Gu damage', fx: { damagePct: 3 } },
      { text: '+9% Poison Gu damage', fx: { damagePct: 3 } },
      { text: '+12% Poison Gu damage', fx: { damagePct: 3 } },
      { text: '+15% Poison Gu damage · Poison Gu essence cost −10%', fx: { damagePct: 3, costPct: 10 } },
    ],
  },
  {
    id: 'enslavement', name: 'Enslavement Path', icon: '🐉', color: 'text-violet-300', border: 'border-violet-800/40',
    description: 'Command over creatures and summons. Why fight alone when beasts obey your will?',
    levels: [
      { text: '+6% summon strength', fx: { summonPct: 6 } },
      { text: '+12% summon strength', fx: { summonPct: 6 } },
      { text: '+18% strength · summons last +1 turn', fx: { summonPct: 6, summonTurns: 1 } },
      { text: '+24% summon strength', fx: { summonPct: 6 } },
      { text: '+30% strength · Enslavement Gu essence cost −10%', fx: { summonPct: 6, costPct: 10 } },
    ],
  },
  {
    id: 'refinement', name: 'Refinement Path', icon: '⚗️', color: 'text-emerald-300', border: 'border-emerald-800/40',
    description: 'The craft of refining Gu itself — knowledge of materials, recipes and essence flow. Grows by refining, not fighting.',
    levels: [
      { text: '+2% refinement success · 2% chance to save a material', fx: { successPct: 2, saveChancePct: 2 } },
      { text: '+4% success · 4% material save · −2% refinement essence cost', fx: { successPct: 2, saveChancePct: 2, refineEssencePct: 2 } },
      { text: '+6% success · 6% material save · −4% essence cost', fx: { successPct: 2, saveChancePct: 2, refineEssencePct: 2 } },
      { text: '+8% success · 8% material save · −6% essence cost', fx: { successPct: 2, saveChancePct: 2, refineEssencePct: 2 } },
      { text: '+10% success · 10% material save · −8% essence cost', fx: { successPct: 2, saveChancePct: 2, refineEssencePct: 2 } },
    ],
  },
  {
    id: 'sword', name: 'Sword Path', icon: '⚔️', color: 'text-zinc-200', border: 'border-zinc-500/40',
    description: 'The way of the flying sword — precision, piercing strikes and bladework. A rare few are born with a sword heart; the rest find Master Jian by the waterfall.',
    levels: [
      { text: '+3% Sword Gu damage', fx: { damagePct: 3 } },
      { text: '+6% Sword Gu damage', fx: { damagePct: 3 } },
      { text: '+9% Sword Gu damage · Sword Gu essence cost −5%', fx: { damagePct: 3, costPct: 5 } },
      { text: '+12% Sword Gu damage', fx: { damagePct: 3 } },
      { text: '+15% Sword Gu damage · Sword Gu essence cost −10%', fx: { damagePct: 3, costPct: 5 } },
    ],
  },
];

export const PATH_BY_ID = Object.fromEntries(PATHS.map(p => [p.id, p]));

// Handcrafted synergies — active when Gu of all listed paths are equipped together.
export const SYNERGIES = [
  { id: 'windFan', name: 'Riding the Wind', paths: ['fire', 'wind'], desc: 'Fire Gu damage +10% while a Wind Gu is also equipped.' },
  { id: 'mountainSpring', name: 'Mountain Springs', paths: ['earth', 'water'], desc: 'Barriers +15% and you regenerate 2 HP per round.' },
  { id: 'tamedTides', name: 'Tamed Tides', paths: ['enslavement', 'water'], desc: 'Summon strength +15%.' },
];