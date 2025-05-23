'use client';

import { useEquipmentContext } from '@/context/EquipmentContext';
import InventoryItem from './InventoryItem';

const TOTAL_SLOTS = 36;

export default function Inventory() {
  const { inventory } = useEquipmentContext();

  const filledSlots = inventory.map((item) => (
    <InventoryItem key={item.id} item={item} />
  ));

  const emptySlots = Array.from({ length: Math.max(0, TOTAL_SLOTS - inventory.length) }).map((_, index) => (
    <div
      key={`empty-${index}`}
      className="border border-gray-700 rounded-lg bg-gray-900 opacity-50 h-20"
    />
  ));

  return (
    <div className="grid grid-cols-6 gap-2 w-full">
      {filledSlots}
      {emptySlots}
    </div>
  );
}
