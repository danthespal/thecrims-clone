'use client';

import Link from 'next/link';
import { LogIn, UserPlus, BarChart2, HelpCircle } from 'lucide-react';

const navItems = [
  { label: 'Login', href: '/', icon: <LogIn size={16} /> },
  { label: 'Register', href: '/register', icon: <UserPlus size={16} /> },
  { label: 'Stats', href: '/stats', icon: <BarChart2 size={16} /> },
  { label: 'Help', href: '/help', icon: <HelpCircle size={16} /> },
];

export default function GuestHeader() {
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-gray-950 border-b border-gray-800 shadow-sm">
      <nav className="flex gap-4 text-sm font-medium text-gray-300">
        {navItems.map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-1 hover:text-teal-400 transition-colors"
          >
            {icon}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <span className="text-sm text-gray-400">Round: #34</span>
    </header>
  );
}
