'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import toast from 'react-hot-toast';
import { RegisterSchema } from '@/lib/schemas/registerSchema';

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    account_name: '',
    email: '',
    password: '',
    confirm_password: '',
    profile_name: '',
    profile_suffix: '',
    date_of_birth: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileSuffix, setProfileSuffix] = useState('');

  const [availability, setAvailability] = useState<Record<'account_name' | 'email' | 'profile_name', boolean | null>>({
    account_name: null,
    email: null,
    profile_name: null,
  });

  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (form.password) {
      setPasswordStrength(zxcvbn(form.password).score);
    }
  }, [form.password]);

  useEffect(() => {
    document.getElementById('account_name')?.focus();
  }, []);

  const generateSuffix = (profile: string, dob: string) => {
    if (!profile || !dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    return `#${String(d.getFullYear() % 100)}${d.getMonth() + 1}${d.getDate()}`;
  };

  const checkAvailability = (field: string, value: string) => {
    const routeMap: Record<string, string> = {
      account_name: 'check-account',
      email: 'check-email',
      profile_name: 'check-profile',
    };
    const route = routeMap[field];
    if (!route || !value) return;

    clearTimeout(debounceTimers.current[field]);

    debounceTimers.current[field] = setTimeout(async () => {
      try {
        let url = `/api/validation/${route}?${field}=${encodeURIComponent(value)}`;

        if (field === 'profile_name') {
          const { date_of_birth } = form;
          if (!date_of_birth) return;
          const query = new URLSearchParams({ profile_name: value, date_of_birth });
          url = `/api/validation/check-profile?${query.toString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setAvailability((prev) => ({ ...prev, [field]: data.available }));
      } catch (err) {
        console.error(`Availability check failed for ${field}`, err);
      }
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (['account_name', 'email', 'profile_name'].includes(name)) {
      checkAvailability(name, value);
    }

    if (name === 'profile_name' || name === 'date_of_birth') {
      const suffix = generateSuffix(
        name === 'profile_name' ? value : form.profile_name,
        name === 'date_of_birth' ? value : form.date_of_birth
      );
      setProfileSuffix(suffix);
      setForm((prev) => ({ ...prev, profile_suffix: suffix.replace('#', '') }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Check for taken fields
    if (Object.values(availability).includes(false)) {
      toast.error('Some fields are already taken');
      setLoading(false);
      return;
    }

    // ✅ Zod validation
    const result = RegisterSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formatted: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([field, msgs]) => {
        if (msgs && msgs[0]) formatted[field] = msgs[0];
      });
      setErrors(formatted);
      toast.error('Please fix validation errors.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && typeof data.error === 'object') {
          setErrors(data.error);
          toast.error('Registration failed.');
          return;
        }
        throw new Error(data.error || 'Unknown registration error');
      }

      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setErrors({ general: message });
      toast.error(message);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md mx-auto bg-gray-900 p-8 rounded-xl shadow-md border border-gray-800 text-white"
    >
      <h2 className="text-2xl font-bold text-teal-400 text-center">Create Your Account</h2>

      {errors.general && (
        <p className="text-red-500 text-sm text-center -mt-4">{errors.general}</p>
      )}

      {[
        { name: 'account_name', label: 'Account Name' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      ].map(({ name, label, type = 'text' }) => (
        <div key={name}>
          <label className="block mb-1 font-medium">{label}</label>
          <input
            name={name}
            type={type}
            value={form[name as keyof typeof form]}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {touched[name] && errors[name] && (
            <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
          )}
          {availability[name as keyof typeof availability] === false && (
            <p className="text-yellow-500 text-sm mt-1">{label} is already taken</p>
          )}
        </div>
      ))}

      {/* Password */}
      <div>
        <label className="block mb-1 font-medium">Password</label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full p-2 pr-10 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-sm mt-1">Strength: {passwordStrength}/4</p>
        {touched.password && errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block mb-1 font-medium">Verify Password</label>
        <div className="relative">
          <input
            name="confirm_password"
            type={showConfirm ? 'text' : 'password'}
            value={form.confirm_password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full p-2 pr-10 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {touched.confirm_password && errors.confirm_password && (
          <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
        )}
      </div>

      {/* Profile Name */}
      <div>
        <label className="block mb-1 font-medium">Profile Name</label>
        <input
          name="profile_name"
          type="text"
          value={form.profile_name}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
        />
        {profileSuffix && (
          <p className="text-sm text-teal-300 mt-1">
            Final profile name: <strong>{form.profile_name}{profileSuffix}</strong>
          </p>
        )}
        {availability.profile_name === false && (
          <p className="text-yellow-500 text-sm mt-1">Profile name is already taken</p>
        )}
        {touched.profile_name && errors.profile_name && (
          <p className="text-red-500 text-sm mt-1">{errors.profile_name}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-bold py-2 px-4 rounded transition duration-200 ${
          loading ? 'bg-teal-700 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500'
        }`}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
