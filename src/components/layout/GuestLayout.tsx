'use client';

import GuestHeader from '@/components/layout/GuestHeader';
import Footer from '@/components/layout/Footer';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url("/bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Foreground content */}
      <GuestHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
