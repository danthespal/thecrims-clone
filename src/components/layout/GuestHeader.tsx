import Link from 'next/link';

export default function GuestHeader() {
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-gray-950 border-b border-gray-800">
      <nav className="space-x-4 text-sm font-medium">
        {['Login', 'Register', 'Stats', 'Help'].map((label) => (
          <Link
            key={label}
            href={label === 'Login' ? '/' : `/${label.toLowerCase()}`}
            className="hover:text-teal-400"
          >
            {label}
          </Link>
        ))}
      </nav>
      <span className="text-sm text-gray-400">Round: #34</span>
    </header>
  );
}
