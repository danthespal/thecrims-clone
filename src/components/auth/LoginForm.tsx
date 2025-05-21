'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();

  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.getElementById('account_name')?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: accountName, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-6 max-w-md mx-auto bg-gray-900 p-8 rounded-xl shadow-md border border-gray-800 text-white"
    >
      <h2 className="text-2xl font-bold text-teal-400 mb-4">Log In</h2>

      {error && <p className="text-red-500 text-sm -mt-2 mb-2">{error}</p>}

      {/* Account Name */}
      <div>
        <label htmlFor="account_name" className="block mb-1 font-medium">Account Name</label>
        <input
          id="account_name"
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block mb-1 font-medium">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 pr-10 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-bold py-2 px-4 rounded transition duration-200 ${
          loading ? 'bg-teal-700 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500'
        }`}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
