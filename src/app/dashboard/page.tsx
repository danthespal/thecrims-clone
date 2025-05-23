'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JSX } from 'react';

import UserStats from '@/components/dashboard/UserStats';
import SidebarMenu from '@/components/dashboard/SidebarMenu';
import StreetPage from '@/components/dashboard/Street/Page';
import Robbery from '@/components/dashboard/Robbery/Robbery';
import Casino from '@/app/dashboard/Casino/page';
import CharacterInventory from '@/components/dashboard/Inventory/CharacterInventory';

export default function DashboardPage() {
  const [active, setActive] = useState('Streets');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load last selected tab from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('activeTab');
    if (saved) setActive(saved);
  }, []);

  // Save tab selection to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', active);
  }, [active]);

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/user/session');
        const data = await res.json();
        if (!data.authenticated) router.push('/');
        else setLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
      </main>
    );
  }

  // Map of active tab to component
  const tabComponents: Record<string, JSX.Element> = {
    Inventory: <CharacterInventory />,
    Streets: <StreetPage />,
    Robbery: <Robbery />,
    Casino: <Casino />,
  };

  // Final resolved tab component
  let ActiveComponent: JSX.Element;

  if (tabComponents[active]) {
    ActiveComponent = tabComponents[active];
  } else if (
    ['Hookers', 'Profile Status', 'Profile Settings'].includes(active)
  ) {
    ActiveComponent = (
      <p className="text-gray-300">
        This is a placeholder for the <strong>{active}</strong> feature.
      </p>
    );
  } else {
    ActiveComponent = (
      <p className="text-gray-300">Unknown section selected.</p>
    );
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
