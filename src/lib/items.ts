export type Item = {
  id: number;
  name: string;
  description: string;
  type: 'helmet' | 'armor' | 'boots' | 'amulet' | 'ring' | 'weapon' | 'gloves';
};

export const items: Item[] = [
  {
    id: 1,
    name: 'Knight Helmet',
    description: 'Heavy iron helmet.',
    type: 'helmet',
  },
  {
    id: 2,
    name: 'Steel Armor',
    description: 'Solid protection for the chest.',
    type: 'armor',
  },
  {
    id: 3,
    name: 'Leather Boots',
    description: 'Flexible and sturdy.',
    type: 'boots',
  },
  {
    id: 4,
    name: 'Golden Amulet',
    description: 'Boosts magic resistance.',
    type: 'amulet',
  },
  {
    id: 5,
    name: 'Silver Ring',
    description: 'A shiny ring.',
    type: 'ring',
  },
  {
    id: 6,
    name: 'Short Sword',
    description: 'A quick, light weapon.',
    type: 'weapon',
  },
  {
    id: 7,
    name: 'Wool Gloves',
    description: 'Warm and comfortable.',
    type: 'gloves',
  },
];
