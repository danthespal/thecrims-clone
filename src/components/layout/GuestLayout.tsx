import GuestHeader from '@/components/layout/GuestHeader';
import Footer from '@/components/layout/Footer';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white">
      <GuestHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
