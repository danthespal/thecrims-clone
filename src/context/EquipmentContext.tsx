'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Item as BaseItem } from '@/lib/itemLoader';

export type ItemWithQuantity = BaseItem & {
  quantity?: number;
};

export type EquipmentSlots = {
  helmet?: BaseItem;
  armor?: BaseItem;
  boots?: BaseItem;
  amulet?: BaseItem;
  ring?: BaseItem;
  left_hand?: BaseItem;
  right_hand?: BaseItem;
};

type EquipmentContextType = {
  equipment: EquipmentSlots;
  inventory: ItemWithQuantity[];
  equipItem: (slot: keyof EquipmentSlots, item: BaseItem) => void;
  unequipItem: (slot: keyof EquipmentSlots) => void;
  saveState: () => Promise<void>;
  refreshState: () => Promise<void>;
};

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const slotRules: Record<keyof EquipmentSlots, BaseItem['type']> = {
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
  const [inventory, setInventory] = useState<ItemWithQuantity[]>([]);

  const refreshState = async () => {
    try {
      const res = await fetch('/api/gear', { method: 'GET' });
      const data = await res.json();
      setEquipment(data.equipment || {});
      setInventory(data.inventory || []);
    } catch (err) {
      console.error('Failed to load gear/inventory:', err);
    }
  };

  const saveState = async () => {
    sendSave(equipment, inventory);
  };

  const sendSave = (
    equipment: EquipmentSlots,
    inventory: ItemWithQuantity[]
  ) => {
    const cleanedEquipment = Object.entries(equipment).reduce((acc, [slot, item]) => {
      if (item?.id != null) acc[slot] = { id: item.id };
      return acc;
    }, {} as Record<string, { id: number }>);

    const cleanedInventory = inventory.map(({ id, quantity }) => ({
      id,
      quantity: quantity ?? 1,
    }));

    console.log('📦 Saving NOW:', { cleanedEquipment, cleanedInventory });

    fetch('/api/gear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment: cleanedEquipment,
        inventory: cleanedInventory,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        console.error('❌ Failed to save:', error);
      } else {
        console.log('✅ Save complete');
      }
    });
  };

  const equipItem = (slot: keyof EquipmentSlots, item: BaseItem) => {
    if (slotRules[slot] !== item.type) return;

    const currentItem = equipment[slot];

    const updatedInventory = inventory
      .filter((i) => i.id !== item.id)
      .concat(currentItem ? [{ ...currentItem }] : []);

    const updatedEquipment = {
      ...equipment,
      [slot]: item,
    };

    setInventory(updatedInventory);
    setEquipment(updatedEquipment);

    setTimeout(() => {
      sendSave(updatedEquipment, updatedInventory);
    }, 10);
  };

  const unequipItem = (slot: keyof EquipmentSlots) => {
    const item = equipment[slot];
    if (!item) return;

    const updatedInventory = [...inventory, { ...item }];

    const updatedEquipment = {
      ...equipment,
      [slot]: undefined,
    };

    setInventory(updatedInventory);
    setEquipment(updatedEquipment);

    setTimeout(() => {
      sendSave(updatedEquipment, updatedInventory);
    }, 10);
  };

  useEffect(() => {
    refreshState();
  }, []);

  return (
    <EquipmentContext.Provider
      value={{
        equipment,
        inventory,
        equipItem,
        unequipItem,
        saveState,
        refreshState,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipmentContext() {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipmentContext must be used inside EquipmentProvider');
  }
  return context;
}
