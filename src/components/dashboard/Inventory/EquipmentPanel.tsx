'use client';

import { useEquipmentContext } from '@/context/EquipmentContext';
import type { ItemWithQuantity } from '@/context/EquipmentContext';
import { slotRules } from '@/context/EquipmentContext';

type SlotProps = {
  label: string;
  slot: keyof ReturnType<typeof useEquipmentContext>['equipment'];
  itemData?: ItemWithQuantity;
};

const Slot = ({ label, slot, itemData }: SlotProps) => {
  const { equipItem, unequipItem } = useEquipmentContext();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    try {
      const draggedItem: ItemWithQuantity = JSON.parse(data);
      if (slotRules[slot] === draggedItem.type) {
        equipItem(slot, draggedItem);
      }
    } catch {
      console.error('Invalid item drag data');
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (itemData) {
      e.dataTransfer.setData('application/json', JSON.stringify(itemData));
      e.dataTransfer.setData('slot', slot);
    }
  };

  return (
    <div
      onClick={() => unequipItem(slot)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      draggable={!!itemData}
      onDragStart={handleDragStart}
      className="bg-gray-900 hover:bg-gray-800 transition p-2 rounded-lg border border-teal-500 text-xs flex flex-col items-center justify-center text-center h-20 w-full cursor-pointer"
    >
      <div className="font-semibold text-teal-300 truncate w-full">
        {itemData?.name || label}
      </div>
      {itemData && <div className="text-gray-400 text-[10px] mt-1">(Unequip)</div>}
    </div>
  );
};

export default function EquipmentPanel() {
  const { equipment } = useEquipmentContext();

  return (
    <div className="grid grid-cols-3 gap-2 p-2 border border-gray-800 rounded bg-stone-800 shadow-md w-full">
      <Slot label="Ring" slot="ring" itemData={equipment.ring} />
      <Slot label="Helmet" slot="helmet" itemData={equipment.helmet} />
      <Slot label="Amulet" slot="amulet" itemData={equipment.amulet} />

      <Slot label="Left Hand" slot="left_hand" itemData={equipment.left_hand} />
      <Slot label="Armor" slot="armor" itemData={equipment.armor} />
      <Slot label="Right Hand" slot="right_hand" itemData={equipment.right_hand} />

      <div />
      <Slot label="Boots" slot="boots" itemData={equipment.boots} />
      <div />
    </div>
  );
}
