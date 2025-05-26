'use client';

import { useEquipmentContext, EquipmentSlots } from '@/context/EquipmentContext';
import InventoryItem from './InventoryItem';

const TOTAL_SLOTS = 36;

export default function Inventory() {
  const { inventory, unequipItem } = useEquipmentContext();

  const filledSlots = inventory.map((item) => (
    <InventoryItem key={item.id} item={item} />
  ));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceSlot = e.dataTransfer.getData('slot');
    if (sourceSlot && isValidSlot(sourceSlot)) {
      unequipItem(sourceSlot);
    }
  };

  const isValidSlot = (slot: string): slot is keyof EquipmentSlots => {
    return [
      'helmet',
      'armor',
      'boots',
      'amulet',
      'ring',
      'left_hand',
      'right_hand',
    ].includes(slot);
  };

  const emptySlots = Array.from({ length: Math.max(0, TOTAL_SLOTS - inventory.length) }).map((_, index) => (
    <div
      key={`empty-${index}`}
      className="border border-gray-700 rounded-lg bg-gray-900 opacity-50 h-20"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    />
  ));

  return (
    <div className="grid grid-cols-6 gap-2 w-full">
      {filledSlots}
      {emptySlots}
    </div>
  );
}
