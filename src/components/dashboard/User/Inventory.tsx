'use client';

import { useEquipmentContext } from '@/context/EquipmentContext';
import InventoryItem from './InventoryItem';

const TOTAL_SLOTS = 36;

export default function Inventory() {
  const { inventory } = useEquipmentContext();

  // Render filled slots with inventory items
  const filledSlots = inventory.map((item) => (
    <InventoryItem key={item.id} item={item} />
  ));

  // Render empty slots to fill the rest of the grid
  const emptySlots = Array.from({ length: TOTAL_SLOTS - inventory.length }).map((_, index) => (
    <div
      key={`empty-${index}`}
      className="border border-gray-700 rounded-lg bg-gray-900 opacity-50 h-20"
    />
  ));

  return (
    <div className="grid grid-cols-6 gap-2">
      {filledSlots}
      {emptySlots}
    </div>
  );
}
