'use client';

import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { Item as BaseItem } from '@/lib/game/itemLoader';
import useGear from '@/hooks/useGear';

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
  const {
    equipment,
    inventory,
    refresh: refreshState,
  } = useGear();

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

    const cleanedInventory = inventory.map((item: ItemWithQuantity) => ({
      id: item.id,
      quantity: item.quantity ?? 1,
    }));

    console.log('📦 Saving NOW:', { cleanedEquipment, cleanedInventory });

    fetch('/api/gear?action=save', {
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
        refreshState();
      }
    });
  };

  const equipItem = (slot: keyof EquipmentSlots, item: BaseItem) => {
    if (slotRules[slot] !== item.type) return;

    const currentItem = equipment[slot];

    const updatedInventory: ItemWithQuantity[] = inventory
      .map((i: ItemWithQuantity) =>
        i.id === item.id
          ? { ...i, quantity: (i.quantity ?? 1) - 1 }
          : i
      )
      .filter((i: ItemWithQuantity) => (i.quantity ?? 1) > 0);

    if (currentItem) {
      const existing = updatedInventory.find((i: ItemWithQuantity) => i.id === currentItem.id);
      if (existing) {
        existing.quantity = (existing.quantity ?? 1) + 1;
      } else {
        updatedInventory.push({ ...currentItem, quantity: 1 });
      }
    }

    const updatedEquipment: EquipmentSlots = {
      ...equipment,
      [slot]: item,
    };

    sendSave(updatedEquipment, updatedInventory);
  };

  const unequipItem = (slot: keyof EquipmentSlots) => {
    const item = equipment[slot];
    if (!item) return;

    const updatedInventory = [...inventory];
    const existing = updatedInventory.find((i: ItemWithQuantity) => i.id === item.id);

    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + 1;
    } else {
      updatedInventory.push({ ...item, quantity: 1 });
    }

    const updatedEquipment: EquipmentSlots = {
      ...equipment,
      [slot]: undefined,
    };

    sendSave(updatedEquipment, updatedInventory);
  };

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
