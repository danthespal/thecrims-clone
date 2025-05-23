import items from '@/data/items.json';

export type Item = {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
};

export function getAllItems(): Item[] {
  return items;
}

export function getItemById(id: number): Item | undefined {
  return items.find(item => item.id === id);
}
