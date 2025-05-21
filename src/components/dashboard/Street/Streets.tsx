'use client';

import { useState } from 'react';
import GameUpdates from '@/components/dashboard/Street/GameUpdates';
import StreetNews from '@/components/dashboard/Street/StreetNews';
import ActionTabs from '@/components/dashboard/Street/ActionTabs';

const Streets = () => {
  const [activeTab, setActiveTab] = useState('Weapons');

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
          <p>Browse and buy weapons to dominate the streets.</p>
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

export default Streets;