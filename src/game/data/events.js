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
      { label: 'Question them', effects: { exp: 10, randomRumor: true, message: 'They speak of dangers ahead — and of stranger knowledge on far trails. (+10 insight, a new rumor)' } },
      { label: 'Leave them', effects: { message: 'You walk on.' } },
    ],
  },
  {
    id: 'hiddenCave', title: 'A Hidden Cave',
    text: 'A narrow crack in the rock leads into darkness. A low growl echoes within.',
    options: [
      { label: 'Enter boldly', effects: { startCombat: 'mutatedBeast', message: 'A Mutated Beast lunges!' } },
      { label: 'Investigate quietly', effects: { items: { ironOre: 2 }, recipes: ['tideBinding'], message: 'You find ore near the entrance — and a weathered scroll bearing the Tide Binding recipe.' } },
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
      { label: 'Rob him', effects: { items: { moonPetal: 1 }, spiritStones: 20, flag: 'hasMoonPetal', reputation: { merchants: -4 }, startCombat: 'bandit', message: 'You snatch his wares and coin — but he has friends! (-merchant rep)' } },
      { label: 'Ask what he has heard (15 stones)', effects: { spiritStones: -15, randomRumor: true, message: 'The merchant lowers his voice and shares a whisper from the roads. (-15 stones)' } },
      { label: 'Decline', effects: { message: 'You walk away.' } },
    ],
  },
  // ---- Master recognition-trial offers (set only by SEEK RECOGNITION —
  //      accepting starts the mentor's trial quest; see masters.js) ----
  {
    id: 'ev_jian_recognition', title: 'Steps Worthy of the Sword',
    text: 'Master Jian finally looks up. "You have some foundation. Perhaps you are worth testing. Walk the dangerous wilds — far — and let your Gu earn its keep against worthy foes. Return with steadier steps, and I will show you the threshold of the sword."',
    options: [
      { label: 'Accept the Trial', effects: { acceptQuest: 'q_jian_trial', message: 'Master Jian nods once. "The trial begins. The wilds will weigh your steps."' } },
      { label: 'Not Yet', effects: { message: '"Then do not waste my time. Come back when your feet are ready."' } },
    ],
  },
  {
    id: 'ev_mo_recognition', title: 'Hands Worthy of the Furnace',
    text: 'Elder Mo finally meets your eyes. "Words are cheap at a furnace. Show me hands that can refine without waste — one clean refinement. Return, and the Insight Eye is yours to learn."',
    options: [
      { label: 'Accept the Trial', effects: { acceptQuest: 'q_mo_trial', message: '"The furnace remembers every steady hand. Go."' } },
      { label: 'Not Yet', effects: { message: '"Hmph. When your hands stop shaking, return."' } },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));