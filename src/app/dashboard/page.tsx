'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserStats from '@/components/dashboard/UserStats';
import SidebarMenu from '@/components/dashboard/SidebarMenu';
import Streets from '@/components/dashboard/Street/Streets';
import Robbery from '@/components/dashboard/Robbery/Robbery';
import Casino from '@/app/dashboard/Casino/page';

export default function DashboardPage() {
  const [active, setActive] = useState('Streets');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/user/session');
        const data = await res.json();
        if (!data.authenticated) router.push('/');
      } catch (error) {
        console.error('Session check failed:', error);
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

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
          {active === 'Streets' && <Streets />}
          {active === 'Robbery' && <Robbery />}
          {active === 'Casino' && <Casino />}
          {/* Placeholder for other tabs */}
          {['Hookers', 'Profile Status', 'Profile Settings'].includes(active) && (
            <p className="text-gray-300">
              This is a placeholder for the <strong>{active}</strong> feature.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}