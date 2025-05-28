import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { EquipmentProvider } from '@/context/EquipmentContext';
import { CasinoBalanceProvider } from '@/context/CasinoBalanceContext';
import { Toaster } from 'react-hot-toast';

// Font configuration
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Crime City',
  description: 'The ultimate browser-based crime simulator.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <EquipmentProvider>
          <CasinoBalanceProvider>
            <Toaster position="top-center" />
            {children}
          </CasinoBalanceProvider>
        </EquipmentProvider>
      </body>
    </html>
  );
}
