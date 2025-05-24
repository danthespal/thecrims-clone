'use client';

import { useEquipmentContext, ItemWithQuantity } from '@/context/EquipmentContext';

interface Props {
  item: ItemWithQuantity;
}

export default function InventoryItem({ item }: Props) {
  const { equipItem } = useEquipmentContext();

  const slotMap: Record<ItemWithQuantity['type'], keyof ReturnType<typeof useEquipmentContext>['equipment']> = {
    helmet: 'helmet',
    armor: 'armor',
    boots: 'boots',
    amulet: 'amulet',
    ring: 'ring',
    weapon: 'left_hand',
    gloves: 'right_hand',
  };

  const tryEquip = () => {
    const slot = slotMap[item.type as keyof typeof slotMap];
    if (slot) {
      console.log(`🧠 Equipping item ID ${item.id} into slot "${slot}"`);
      equipItem(slot, item);
    } else {
      console.warn(`❌ No slot defined for item type: ${item.type}`);
    }
  };

  return (
    <div className="bg-gray-900 hover:bg-gray-800 transition p-2 rounded-lg border border-teal-500 text-xs flex flex-col items-center justify-center text-center h-20 w-full">
      <div className="font-semibold text-teal-300 truncate w-full">
        {item.name}
        {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}
      </div>
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
