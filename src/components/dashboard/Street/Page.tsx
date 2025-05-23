'use client';

import { useEffect, useState } from 'react';
import GameUpdates from '@/components/dashboard/Street/GameUpdates';
import StreetNews from '@/components/dashboard/Street/StreetNews';
import ActionTabs from '@/components/dashboard/Street/ActionTabs';
import { useEquipmentContext } from '@/context/EquipmentContext';

interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
}

const itemTypes = [
  'weapon',
  'armor',
  'helmet',
  'boots',
  'amulet',
  'ring',
  'gloves',
];

const StreetPage = () => {
  const [activeTab, setActiveTab] = useState('Weapons');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedType, setSelectedType] = useState<string>('weapon');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [money, setMoney] = useState<number>(0);
  const { refreshState } = useEquipmentContext();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/items');
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error('Failed to load items:', error);
      }
    };

    const fetchMoney = async () => {
      try {
        const res = await fetch('/api/user/session');
        const data = await res.json();
        if (data?.user?.money !== undefined) {
          setMoney(data.user.money);
        }
      } catch (error) {
        console.error('Failed to fetch money:', error);
      }
    };

    if (activeTab === 'Weapons') {
      fetchItems();
      fetchMoney();
    }
  }, [activeTab]);

  const handleBuy = async (itemId: number) => {
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();

      if (res.ok) {
        setFeedback(result.message || 'Item purchased!');
        await refreshState();

        // Re-fetch money after purchase
        const moneyRes = await fetch('/api/user/session');
        const moneyData = await moneyRes.json();
        if (moneyData?.user?.money !== undefined) {
          setMoney(moneyData.user.money);
        }
      } else {
        setFeedback(result.error || 'Purchase failed.');
      }
    } catch (err) {
      console.error(err);
      setFeedback('Purchase failed.');
    }

    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top: Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GameUpdates />
        <StreetNews />
      </div>

      {/* Horizontal menu */}
      <ActionTabs active={activeTab} onChange={setActiveTab} />

      {/* Selected Tab Content */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        {activeTab === 'Weapons' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-teal-400">Item Shop</h2>

            <p className="text-sm text-teal-300 mb-4">
              Your money: <span className="font-bold text-white">${money}</span>
            </p>

            {/* Type Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {itemTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-1 rounded-md text-sm font-medium transition ${
                    selectedType === type
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {feedback && (
              <p className="mb-4 text-sm text-green-400 bg-gray-900 px-4 py-2 rounded">
                {feedback}
              </p>
            )}

            {/* Items List */}
            <ul className="space-y-3">
              {items
                .filter((item) => item.type === selectedType)
                .map((item) => {
                  const canAfford = money >= item.price;
                  return (
                    <li
                      key={item.id}
                      className="p-4 bg-gray-900 rounded-lg border border-gray-700"
                    >
                      <h3 className="text-lg font-bold text-white">{item.name}</h3>
                      <p className="text-gray-400">{item.description}</p>
                      <p className="text-yellow-400 font-medium">Price: ${item.price}</p>
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
          </div>
        )}

        {activeTab === 'Clubs' && (
          <p>Visit underground clubs and increase your influence.</p>
        )}

        {activeTab === 'Drugs' && (
          <p>Buy and trade drugs to grow your empire.</p>
        )}
      </div>
    </div>
  );
};

export default StreetPage;
