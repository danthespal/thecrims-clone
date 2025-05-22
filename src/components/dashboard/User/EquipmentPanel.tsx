'use client';

import { useEquipmentContext } from '@/context/EquipmentContext';

type SlotProps = {
  label: string;
  item?: string;
  onClick?: () => void;
};

const Slot = ({ label, item, onClick }: SlotProps) => (
  <div
    onClick={onClick}
    className="bg-gray-900 border border-gray-700 rounded flex items-center justify-center text-[10px] text-gray-300 h-16 w-16 cursor-pointer hover:ring-1 hover:ring-teal-400 text-center px-1"
  >
    {item || label}
  </div>
);

export default function EquipmentPanel() {
  const { equipment, unequipItem } = useEquipmentContext();

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-2 p-2 border border-gray-800 rounded bg-stone-800 shadow-md">
      {/* Row 1 */}
      <Slot label="Ring" item={equipment.ring?.name} onClick={() => unequipItem('ring')} />
      <Slot label="Helmet" item={equipment.helmet?.name} onClick={() => unequipItem('helmet')} />
      <Slot label="Amulet" item={equipment.amulet?.name} onClick={() => unequipItem('amulet')} />

      {/* Row 2 */}
      <Slot label="Left Slot" item={equipment.left_hand?.name} onClick={() => unequipItem('left_hand')} />
      <Slot label="Armor" item={equipment.armor?.name} onClick={() => unequipItem('armor')} />
      <Slot label="Right Slot" item={equipment.right_hand?.name} onClick={() => unequipItem('right_hand')} />

      {/* Row 3 */}
      <Slot label="" />
      <Slot label="Boots" item={equipment.boots?.name} onClick={() => unequipItem('boots')} />
      <Slot label="" />
    </div>
  );
}
