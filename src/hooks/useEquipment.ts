'use client';

import { useState } from 'react';
import { items as initialItems, type Item } from '@/lib/items';

type EquipmentSlots = {
  helmet?: Item;
  armor?: Item;
  boots?: Item;
  amulet?: Item;
  ring?: Item;
  left_hand?: Item;
  right_hand?: Item;
};

const slotRules: Record<keyof EquipmentSlots, string> = {
  helmet: 'helmet',
  armor: 'armor',
  boots: 'boots',
  amulet: 'amulet',
  ring: 'ring',
  left_hand: 'weapon',
  right_hand: 'gloves',
};

export function useEquipment() {
  const [equipment, setEquipment] = useState<EquipmentSlots>({
    helmet: initialItems.find((i) => i.type === 'helmet'),
    armor: initialItems.find((i) => i.type === 'armor'),
  });

  const [inventory, setInventory] = useState<Item[]>(
    initialItems.filter(
      (item) => !Object.values(equipment).some((eq) => eq?.id === item.id)
    )
  );

  const canEquip = (slot: keyof EquipmentSlots, item: Item): boolean => {
    return slotRules[slot] === item.type;
  };

  const equipItem = (slot: keyof EquipmentSlots, item: Item) => {
    if (!canEquip(slot, item)) return false;

    setEquipment((prev) => ({ ...prev, [slot]: item }));
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    return true;
  };

  return {
    equipment,
    inventory,
    equipItem,
    canEquip,
  };
}
