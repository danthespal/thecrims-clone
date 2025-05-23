'use client';

import EquipmentPanel from './EquipmentPanel';
import CostumeSlot from './CostumeSlot';
import Inventory from './Inventory';

export default function CharacterInventory() {
  return (
    <div className="flex flex-col lg:flex-row items-start gap-8 p-6 bg-gray-900 rounded-xl border border-gray-800 w-full">
      {/* Left: Equipment */}
      <div className="flex flex-col items-center w-full max-w-md">
        <EquipmentPanel />
      </div>

      {/* Center: Costume */}
      <div className="flex flex-col items-center">
        <CostumeSlot />
      </div>

      {/* Right: Inventory Grid */}
      <div className="flex-1">
        <Inventory />
      </div>
    </div>
  );
}
