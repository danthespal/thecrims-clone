'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { items as allItems, type Item } from '@/lib/items';

type EquipmentSlots = {
  helmet?: Item;
  armor?: Item;
  boots?: Item;
  amulet?: Item;
  ring?: Item;
  left_hand?: Item;
  right_hand?: Item;
};

type EquipmentContextType = {
  equipment: EquipmentSlots;
  inventory: Item[];
  equipItem: (slot: keyof EquipmentSlots, item: Item) => void;
  unequipItem: (slot: keyof EquipmentSlots) => void;
};

const EquipmentContext = createContext<EquipmentContextType | undefined>(
  undefined
);

const slotRules: Record<keyof EquipmentSlots, string> = {
  helmet: 'helmet',
  armor: 'armor',
  boots: 'boots',
  amulet: 'amulet',
  ring: 'ring',
  left_hand: 'weapon',
  right_hand: 'gloves',
};

export function EquipmentProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<EquipmentSlots>({});
  const [inventory, setInventory] = useState<Item[]>([]);

  // Load from localStorage
  useEffect(() => {
    const data = localStorage.getItem('equipment-state');
    if (data) {
      const parsed = JSON.parse(data);
      setEquipment(parsed.equipment || {});
      setInventory(parsed.inventory || []);
    } else {
      // Initial state
      const preEquipped = {
        helmet: allItems.find((i) => i.type === 'helmet'),
      };
      const preInventory = allItems.filter(
        (i) => !Object.values(preEquipped).some((e) => e?.id === i.id)
      );
      setEquipment(preEquipped);
      setInventory(preInventory);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      'equipment-state',
      JSON.stringify({ equipment, inventory })
    );
  }, [equipment, inventory]);

  const equipItem = (slot: keyof EquipmentSlots, item: Item) => {
    if (slotRules[slot] !== item.type) return;

    setInventory((prev) => prev.filter((i) => i.id !== item.id));

    setEquipment((prev) => {
      const currentItem = prev[slot];
      if (currentItem) {
        setInventory((inv) => [...inv, currentItem]);
      }
      return { ...prev, [slot]: item };
    });
  };

  const unequipItem = (slot: keyof EquipmentSlots) => {
    const item = equipment[slot];
    if (!item) return;
    setEquipment((prev) => ({ ...prev, [slot]: undefined }));
    setInventory((prev) => [...prev, item]);
  };

  return (
    <EquipmentContext.Provider
      value={{ equipment, inventory, equipItem, unequipItem }}
    >
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipmentContext() {
  const context = useContext(EquipmentContext);
  if (!context) throw new Error('useEquipmentContext must be used in provider');
  return context;
}
