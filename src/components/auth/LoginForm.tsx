'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoginSchema } from '@/lib/schemas/loginSchema';

export default function LoginForm() {
  const [form, setForm] = useState({ account_name: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.getElementById('account_name')?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = LoginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formatted: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([field, msgs]) => {
        if (msgs && msgs[0]) formatted[field] = msgs[0];
      });
      setErrors(formatted);
      toast.error('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setErrors({ general: data.error || 'Login failed' });
        return;
      }

      toast.success('Logged in!');

      // wait for session cookie propagation
      await new Promise((resolve) => setTimeout(resolve, 100));
          
      // verify session exists before redirect
      const verify = await fetch('/api/user/session');
      if (verify.ok) {
        window.location.href = '/dashboard';
      } else {
        toast.error('Session not ready. Please try again.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setErrors({ general: message });
      toast.error(message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md mx-auto bg-gray-900 p-8 rounded-xl shadow-md border border-gray-800 text-white"
    >
      <h2 className="text-2xl font-bold text-teal-400 mb-4">Log In</h2>

      {errors.general && <p className="text-red-500 text-sm -mt-2 mb-2">{errors.general}</p>}

      <div>
        <label htmlFor="account_name" className="block mb-1 font-medium">
          Account Name
        </label>
        <input
          id="account_name"
          name="account_name"
          type="text"
          value={form.account_name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          required
        />
        {errors.account_name && (
          <p className="text-red-500 text-sm mt-1">{errors.account_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block mb-1 font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 pr-10 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

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
