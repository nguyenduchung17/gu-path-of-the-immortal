import { BALANCE } from '../config/balance';

export const ITEMS = [
  // Materials
  { id: 'herb', name: 'Spirit Herb', category: 'materials', description: 'A common herb with mild healing essence.', value: 3 },
  { id: 'fireEssence', name: 'Fire Essence', category: 'materials', description: 'A wisp of pure flame energy.', value: 12 },
  { id: 'beastCore', name: 'Beast Core', category: 'materials', description: 'A monster\'s condensed essence. Used in refinement.', value: 8 },
  { id: 'ore', name: 'Jade Ore', category: 'materials', description: 'A chunk of ore humming with qi.', value: 5 },
  { id: 'ironOre', name: 'Iron Ore', category: 'materials', description: 'Hard iron ore for sturdy refinement.', value: 7 },
  { id: 'shadowSilk', name: 'Shadow Silk', category: 'materials', description: 'Thread spun by shadow beasts.', value: 10 },
  { id: 'moonPetal', name: 'Moon Petal', category: 'materials', description: 'A petal that drinks moonlight.', value: 9 },
  { id: 'spiritGrass', name: 'Spirit Grass', category: 'materials', description: 'Grows where qi gathers.', value: 4 },
  { id: 'windCrystal', name: 'Wind Crystal', category: 'materials', description: 'A shard of solidified wind. Hums when storms near.', value: 14 },
  { id: 'beastBlood', name: 'Beast Blood', category: 'materials', description: 'Vital blood of a wild beast, still warm with qi.', value: 8 },
  { id: 'serpentGland', name: 'Serpent Gland', category: 'materials', description: 'A venom gland prized by Gu refiners.', value: 16 },
  { id: 'mistSilk', name: 'Mist Silk', category: 'materials', description: 'Gossamer silk spun from drifting mist.', value: 12 },
  // Rare spoils of the elite bosses
  { id: 'mistHeart', name: 'Mist Heart', category: 'materials', rarity: 'rare', description: 'The still heart of the Mist Devourer, heavy with centuries of essence.', value: 60 },
  { id: 'wardenCore', name: 'Warden Core', category: 'materials', rarity: 'rare', description: 'A rune-carved core pried from the Ruin Warden\u2019s chest.', value: 70 },
  { id: 'dreadMarrow', name: 'Dread Marrow', category: 'materials', rarity: 'rare', description: 'Marrow drawn from the Dread Matriarch, thrumming with venom and shadow.', value: 65 },
  // Rare wild harvests — invisible to mundane gathering; only a sensing Gu reveals them
  { id: 'moonSilver', name: 'Moon Silver', category: 'materials', rarity: 'rare', description: 'Metal that blooms like a flower under moonlight — found only where a sensing Gu can feel it.', value: 55 },
  { id: 'voidLotus', name: 'Void Lotus', category: 'materials', rarity: 'rare', description: 'A lotus that grows in poison and drinks the miasma dry. Hidden from mundane eyes.', value: 65 },
  // Medicine
  { id: 'medicine', name: 'Healing Salve', category: 'medicine', description: 'Restores 25 HP.', value: 15, combatUsable: true, use: { hp: 25 } },
  { id: 'healingPill', name: 'Greater Healing Pill', category: 'medicine', description: 'Restores 55 HP.', value: 35, combatUsable: true, use: { hp: 55 } },
  { id: 'essencePill', name: 'Essence Pill', category: 'medicine', description: 'Restores 20 primeval essence.', value: 30, combatUsable: true, use: { essence: 20 } },
  // Food roles — value is COMPUTED from BALANCE.foodValue (never hand-set):
  //   MEAL      settlement dining: cheap bulk healing, but sit-down only
  //   TRAVEL    portable expedition fare that never spoils
  //   MEDICINAL drinks that trade raw healing for a real effect
  //   RARE      uncommon cultivation food carrying a premium effect
  // Food restores HP only — essence recovery stays a cultivation mechanic.
  { id: 'simpleMeal', name: 'Simple Rice Meal', category: 'food', role: 'meal', rarity: 'common',
    description: 'Restores 15 HP. Hot bowl, wooden bench — only eaten at inns and settlements.',
    use: { hp: 15 } },
  { id: 'heartyStew', name: 'Hearty Meat Stew', category: 'food', role: 'meal', rarity: 'common',
    description: 'Restores 30 HP. Simmered all day in the innkeeper\u2019s pot — sit-down fare for the badly wounded.',
    use: { hp: 30 } },
  { id: 'ration', name: 'Travel Ration', category: 'food', role: 'travel', portable: true, combatUsable: true,
    description: 'Restores 10 HP. Dried, dense, never spoils — eaten on the trail or mid-battle.',
    use: { hp: 10 } },
  { id: 'riceBun', name: 'Steamed Rice Bun', category: 'food', role: 'travel', portable: true,
    description: 'Restores 6 HP. A cheap warm snack from the market stalls, easy to carry.',
    use: { hp: 6 } },
  { id: 'gingerTea', name: 'Ginger Tea', category: 'food', role: 'medicinal', portable: true,
    description: 'Restores 6 HP and steadies the blood: Poison Resistance +40% for 4 game hours.',
    use: { hp: 6, buff: { type: 'poisonResist', power: 40, minutes: 240 } } },
  { id: 'willowBarkTea', name: 'Willow-Bark Tea', category: 'food', role: 'medicinal', portable: true, combatUsable: true,
    description: 'Restores 4 HP and purges toxins — instantly cures Poison. Bitter, but drinkable mid-battle.',
    use: { hp: 4, cure: ['poison'] } },
  { id: 'qiBerry', name: 'Qi Berry', category: 'food', role: 'rare', rarity: 'rare', portable: true, combatUsable: true,
    description: 'Restores 8 HP. The berry sharpens the senses: +2 Perception for 6 game hours.',
    use: { hp: 8, buff: { type: 'statBonus', stat: 'perception', power: 2, minutes: 360 } } },
  // Gu food — each Dao Path's Gu eats its own fare (fed via the Gu panel)
  { id: 'flameGrass', name: 'Flame Grass', category: 'guFood', description: 'A warm-bladed grass that smolders faintly. Food for Fire-path Gu.', value: 5 },
  { id: 'spiritWater', name: 'Spirit Spring Water', category: 'guFood', description: 'Spring water that glimmers with qi. Food for Water-path Gu.', value: 5 },
  { id: 'mineralEssence', name: 'Mineral Essence', category: 'guFood', description: 'Ground essence-bearing ore. Food for Earth-path Gu.', value: 5 },
  { id: 'venomSac', name: 'Venom Sac', category: 'guFood', description: 'A gland of concentrated venom — a delicacy for venomous Gu.', value: 7 },
  { id: 'beastMeat', name: 'Beast Meat', category: 'guFood', description: 'Qi-rich meat from wild beasts. Feeds beast-natured Gu.', value: 4 },
  // Gu gear — containment for capturing wild Gu, and care for injured ones
  { id: 'sealingJar', name: 'Gu Sealing Jar', category: 'guGear', description: 'A clay jar sealed with a paper charm. Holds one wild Gu during capture.', value: 20 },
  { id: 'bindingVessel', name: 'Spirit Binding Vessel', category: 'guGear', rarity: 'rare', description: 'An inscribed vessel that carries a bound spirit — far stronger than a mere jar.', value: 80 },
  { id: 'restorationPellet', name: 'Spirit Restoration Pellet', category: 'guGear', description: 'A medicinal pellet that mends an injured Gu instantly.', value: 60 },
  // Quest
  { id: 'lostGuFragment', name: 'Lost Gu Fragment', category: 'questItems', description: 'A shard of an ancient Gu. The Gu Master wants it.', value: 0 },
  { id: 'brokenSwordFragment', name: 'Broken Sword Fragment', category: 'questItems', description: 'Half a blade, snapped long ago. A master might want it back.', value: 0 },
  { id: 'stolenGoods', name: 'Stolen Goods', category: 'questItems', description: 'A merchant\'s stolen wares.', value: 0 },
];

// Central consumable pricing — see BALANCE.foodValue. A food's value rises with
// its healing, portability, utility effect and rarity; the role multiplier
// keeps the roles in honest competition (meals cheapest per stone but
// settlement-bound, trail and rare food paying for what they do in the wilds).
export function foodValueOf(it) {
  const v = BALANCE.foodValue;
  const raw = v.base
    + (it.use?.hp || 0) * v.perHp
    + (it.portable ? v.portability : 0)
    + (it.use?.buff ? (v.utility[it.use.buff.type] || 0) : 0)
    + (it.use?.cure ? v.utility.curePoison : 0)
    + (v.rarity[it.rarity] || 0);
  return Math.max(1, Math.round(raw * (v.roleAdj[it.role] || 1)));
}
for (const it of /** @type {any[]} */ (ITEMS)) if (it.category === 'food' && !('value' in it)) it.value = foodValueOf(it);

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const ITEM_CATEGORIES = ['materials', 'medicine', 'food', 'guFood', 'guGear', 'questItems'];
