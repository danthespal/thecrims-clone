'use client';

import { useEquipmentContext, ItemWithQuantity } from '@/context/EquipmentContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  item: ItemWithQuantity;
}

export default function InventoryItem({ item }: Props) {
  const { equipItem, refreshState } = useEquipmentContext();
  const [loading, setLoading] = useState(false);

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
      equipItem(slot, item);
    }
  };

  const handleConsume = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gear?action=consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to consume drug');

      toast.success(data.message);

      if (item.will_restore) {
        window.dispatchEvent(new CustomEvent('will:gain', { detail: { gain: item.will_restore } }));
      }
      window.dispatchEvent(new Event('user:update'));
      await refreshState();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isDrug = item.type === 'drug';

  return (
    <div className="bg-gray-900 hover:bg-gray-800 transition p-2 rounded-lg border border-teal-500 text-xs flex flex-col items-center justify-center text-center h-20 w-full">
      <div className="font-semibold text-teal-300 truncate w-full">
        {item.name}
        {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}
      </div>
      <div className="text-gray-400">Type: {item.type}</div>
      <button
        onClick={isDrug ? handleConsume : tryEquip}
        disabled={loading}
        className="mt-1 text-xs text-blue-400 hover:underline"
      >
        {isDrug ? (loading ? 'Consuming...' : 'Consume') : 'Equip'}
      </button>
    </div>
  );
}
