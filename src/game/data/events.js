export const EVENTS = [
  {
    id: 'strangeHerb', title: 'A Strange Herb',
    text: 'A herb grows here, its petals faintly luminous. Something about it feels... off.',
    options: [
      { label: 'Harvest it', effects: { items: { herb: 2 }, hp: -5, message: 'You harvest the herb, but its scent stings your lungs (-5 HP).' } },
      { label: 'Examine it carefully', effects: { exp: 15, message: 'You study its qi patterns. (+15 cultivation insight)' } },
      { label: 'Leave it', effects: { message: 'You decide not to risk it.' } },
    ],
  },
  {
    id: 'injuredCultivator', title: 'An Injured Stranger',
    text: 'A cultivator lies wounded by the path. They eye you with wary hope.',
    options: [
      { label: 'Help them', effects: { essence: -10, reputation: { villagers: 2 }, message: 'You tend their wounds. They bless your name. (-10 essence, +villager rep)' } },
      { label: 'Search them', effects: { items: { spiritStone: 15 }, reputation: { villagers: -3 }, message: 'You take their stones. Word will spread. (+15 stones, -villager rep)' } },
      { label: 'Question them', effects: { exp: 10, message: 'They speak of dangers ahead. (+10 insight)' } },
      { label: 'Leave them', effects: { message: 'You walk on.' } },
    ],
  },
  {
    id: 'hiddenCave', title: 'A Hidden Cave',
    text: 'A narrow crack in the rock leads into darkness. A low growl echoes within.',
    options: [
      { label: 'Enter boldly', effects: { startCombat: 'mutatedBeast', message: 'A Mutated Beast lunges!' } },
      { label: 'Investigate quietly', effects: { items: { ironOre: 2 }, message: 'You find ore near the entrance and slip away unseen.' } },
      { label: 'Leave', effects: { message: 'You decide discretion is the better part of valor.' } },
    ],
  },
  {
    id: 'spiritSpring', title: 'A Spirit Spring',
    text: 'A spring of pure primeval essence bubbles from the stone.',
    options: [
      { label: 'Drink deeply', effects: { essence: 20, hp: -8, message: 'Essence floods you — almost too much. (+20 essence, -8 HP)' } },
      { label: 'Meditate beside it', effects: { exp: 25, message: 'You absorb its qi slowly. (+25 insight)' } },
      { label: 'Leave', effects: { message: 'You leave the spring undisturbed.' } },
    ],
  },
  {
    id: 'wanderingMerchant', title: 'A Wandering Merchant',
    text: 'A cloaked merchant offers a rare Moon Petal for 40 stones.',
    options: [
      { label: 'Buy it (40 stones)', effects: { spiritStones: -40, items: { moonPetal: 1 }, flag: 'hasMoonPetal', message: 'You acquire a Moon Petal.' } },
      { label: 'Rob him', effects: { items: { moonPetal: 1, spiritStone: 20 }, flag: 'hasMoonPetal', reputation: { merchants: -4 }, startCombat: 'bandit', message: 'You snatch his wares — but he has friends! (-merchant rep)' } },
      { label: 'Decline', effects: { message: 'You walk away.' } },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));