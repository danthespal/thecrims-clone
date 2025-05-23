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
    className="bg-gray-900 hover:bg-gray-800 transition p-2 rounded-lg border border-teal-500 text-xs flex flex-col items-center justify-center text-center h-20 w-full cursor-pointer"
  >
    <div className="font-semibold text-teal-300 truncate w-full">
      {item || label}
    </div>
    {item && <div className="text-gray-400 text-[10px] mt-1">(Unequip)</div>}
  </div>
);

export default function EquipmentPanel() {
  const { equipment, unequipItem } = useEquipmentContext();

  return (
    <div className="grid grid-cols-3 gap-2 p-2 border border-gray-800 rounded bg-stone-800 shadow-md w-full">
      <Slot label="Ring" item={equipment.ring?.name} onClick={() => unequipItem('ring')} />
      <Slot label="Helmet" item={equipment.helmet?.name} onClick={() => unequipItem('helmet')} />
      <Slot label="Amulet" item={equipment.amulet?.name} onClick={() => unequipItem('amulet')} />

      <Slot label="Left Hand" item={equipment.left_hand?.name} onClick={() => unequipItem('left_hand')} />
      <Slot label="Armor" item={equipment.armor?.name} onClick={() => unequipItem('armor')} />
      <Slot label="Right Hand" item={equipment.right_hand?.name} onClick={() => unequipItem('right_hand')} />

      <div />
      <Slot label="Boots" item={equipment.boots?.name} onClick={() => unequipItem('boots')} />
      <div />
    </div>
  );
}
