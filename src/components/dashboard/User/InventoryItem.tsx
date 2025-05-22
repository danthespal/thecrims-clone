'use client';

import { useEquipmentContext } from '@/context/EquipmentContext';
import type { Item } from '@/lib/items';

interface Props {
  item: Item;
}

export default function InventoryItem({ item }: Props) {
  const { equipItem } = useEquipmentContext();

  const tryEquip = () => {
    const slots = [
      'helmet',
      'armor',
      'boots',
      'amulet',
      'ring',
      'left_hand',
      'right_hand',
    ] as const;

    for (const slot of slots) {
      equipItem(slot, item);
    }
  };

  return (
    <div className="bg-gray-900 hover:bg-gray-800 transition p-2 rounded-lg border border-teal-500 text-xs flex flex-col items-center justify-center text-center h-20 w-full">
      <div className="font-semibold text-teal-300 truncate w-full">{item.name}</div>
      <div className="text-gray-400">Type: {item.type}</div>
      <button
        onClick={tryEquip}
        className="mt-1 text-xs text-blue-400 hover:underline"
      >
        Equip
      </button>
    </div>
  );
}
