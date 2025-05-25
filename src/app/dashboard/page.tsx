'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSession from '@/hooks/useSession';
import type { JSX } from 'react';

import UserStats from '@/components/dashboard/UserStats';
import SidebarMenu from '@/components/dashboard/SidebarMenu';
import StreetPage from '@/app/dashboard/street/page';
import Robbery from '@/components/dashboard/Robbery/Robbery';
import Casino from '@/app/dashboard/Casino/page';
import CharacterInventory from '@/components/dashboard/Inventory/CharacterInventory';
import ProfileSettings from '@/components/dashboard/Profile/ProfileSettings';

export default function DashboardPage() {
  const [active, setActive] = useState('Streets');
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    const saved = localStorage.getItem('activeTab');
    if (saved) setActive(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', active);
  }, [active]);

  useEffect(() => {
    if (!loading && !session?.authenticated) {
      router.push('/');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
      </main>
    );
  }

  const tabComponents: Record<string, JSX.Element> = {
    Inventory: <CharacterInventory />,
    Streets: <StreetPage />,
    Robbery: <Robbery />,
    Casino: <Casino />,
    'Profile Settings': <ProfileSettings />, 
  };

  let ActiveComponent: JSX.Element;

  if (tabComponents[active]) {
    ActiveComponent = tabComponents[active];
  } else if (['Hookers', 'Profile Status'].includes(active)) {
    ActiveComponent = (
      <p className="text-gray-300">
        This is a placeholder for the <strong>{active}</strong> feature.
      </p>
    );
  } else {
    ActiveComponent = <p className="text-gray-300">Unknown section selected.</p>;
  }

  return (
    <main className="min-h-screen flex bg-black text-white">
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-800">
        <UserStats />
        <div className="mt-6">
          <SidebarMenu active={active} setActive={setActive} />
        </div>
      </aside>

      <section className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-teal-400 mb-4">{active}</h1>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          {ActiveComponent}
        </div>
      </section>
    </main>
  );
}
