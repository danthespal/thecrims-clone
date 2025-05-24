'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Item as BaseItem } from '@/lib/itemLoader';
import useSession from '@/hooks/useSession';

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
  const { session } = useSession();

  const refreshState = async () => {
    try {
      const res = await fetch('/api/gear');
      const data = await res.json();

      console.log('📥 Gear loaded:', data);

      if (!Array.isArray(data.inventory)) {
        console.warn('⚠️ Inventory is not an array:', data.inventory);
      }

      setEquipment(data.equipment || {});
      setInventory(data.inventory || []);
    } catch (err) {
      console.error('❌ Failed to load gear/inventory:', err);
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
      .map(i => i.id === item.id
        ? { ...i, quantity: (i.quantity ?? 1) - 1}
        : i
      )
      .filter(i => (i.quantity ?? 1) > 0);

    if (currentItem) {
      const existing = updatedInventory.find(i => i.id === currentItem.id);
      if (existing) {
        existing.quantity = (existing.quantity ?? 1) + 1;
      } else {
        updatedInventory.push({ ...currentItem, quantity: 1 });
      }
    }

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
    if  (!item) return;

    const updatedInventory = [...inventory];
    const existing = updatedInventory.find(i => i.id === item.id);

    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + 1;
    } else {
      updatedInventory.push({ ...item, quantity: 1 });
    }

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
    if (session?.user?.id) {
      refreshState();
    }
  }, [session]);

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
