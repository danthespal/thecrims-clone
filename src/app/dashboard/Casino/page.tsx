'use client';

import { useState } from 'react';
import useSession from '@/hooks/useSession';
import BlackjackGame from '@/components/dashboard/Casino/BlackjackGame';
import CasinoControls from '@/components/dashboard/Casino/CasinoControls';

const TABS = ['Casino Wallet', 'Blackjack'];

export default function Casino() {
  const [activeTab, setActiveTab] = useState('Casino Wallet');
  const { session } = useSession();
  const casinoBalance = session?.user?.casino_balance ?? null;

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-400">
        Casino Wallet Balance:{' '}
        <span className="text-white font-semibold">${casinoBalance ?? '...'}</span>
      </div>

      <div className="flex space-x-4 border-b border-gray-700 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t font-medium transition ${
              activeTab === tab
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-400 hover:text-teal-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-8">
        {activeTab === 'Casino Wallet' && <CasinoControls onSuccess={() => {}} />}
        {activeTab === 'Blackjack' && <BlackjackGame onResult={() => {}} />}
      </div>
    </div>
  );
}
