'use client';

import RobberyButton from '@/components/robbery/RobberyButton';

export default function Robbery() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal-400">Available Robberies</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RobberyButton action="street-thief" label="Street Thief" />
        <RobberyButton action="shop-heist" label="Shop Heist" />
        <RobberyButton action="bank-raid" label="Bank Raid" />
      </div>
    </div>
  );
}
