'use client';

import { useState } from 'react';
import { useEquipmentContext } from '@/context/EquipmentContext';
import useSession from '@/hooks/useSession';
import useShop from '@/hooks/useShop';

interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  will_restore: number;
}

const DrugSection = () => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const { refreshState } = useEquipmentContext();
  const { session, refresh } = useSession();
  const { items, loading, buyItem } = useShop();

  const money = session?.user?.money ?? 0;

  const handleBuy = async (itemId: number) => {
    try {
      const result = await buyItem(itemId);
      if (!result.success) throw new Error(result.error || 'Purchase failed');
      setFeedback(result.message || 'Item purchased!');
      await refreshState();
      await refresh();
    } catch (err) {
      console.error(err);
      setFeedback((err as Error).message || 'Purchase failed.');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-teal-400">Drug Market</h2>
      <p className="text-sm text-teal-300 mb-4">
        Your money: <span className="font-bold text-white">${money}</span>
      </p>

      {feedback && (
        <p className="mb-4 text-sm text-green-400 bg-gray-900 px-4 py-2 rounded">
          {feedback}
        </p>
      )}

      {loading ? (
        <p className="text-gray-300">Loading items...</p>
      ) : (
        <ul className="space-y-3">
          {items
            .filter((item: Item) => item.type === 'drug')
            .map((item: Item) => {
              const canAfford = money >= item.price;
              return (
                <li key={item.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <p className="text-gray-400">{item.description}</p>
                  <p className="text-yellow-400 font-medium">Price: ${item.price}</p>
                  <p className="text-green-400 text-sm">Restores {item.will_restore} will</p>
                  <button
                    onClick={() => handleBuy(item.id)}
                    disabled={!canAfford}
                    className={`mt-2 px-4 py-1 text-sm rounded transition ${
                      canAfford
                        ? 'bg-teal-600 text-white hover:bg-teal-500'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Buy' : 'Not enough money'}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default DrugSection;
