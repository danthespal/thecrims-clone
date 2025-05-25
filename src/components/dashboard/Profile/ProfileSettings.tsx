import { useState, useEffect } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';

const ProfileSchema = z.object({
  email: z.string().email('Invalid email'),
  profile_name: z.string().min(3, 'Profile name must be at least 3 characters'),
  date_of_birth: z.string().refine((val) => {
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, {
    message: 'You must be at least 18 years old',
  }),
});

const PasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export default function ProfileSettings() {
  const [form, setForm] = useState({ email: '', profile_name: '', date_of_birth: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch('/api/user?action=profile', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          email: data.user.email || '',
          profile_name: data.user.profile_name || '',
          date_of_birth: data.user.date_of_birth?.split('T')[0] || '',
        });
      } else {
        toast.error('Failed to load profile');
      }
    };
    loadProfile();
  }, []);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('You must type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/user?action=delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account deletion failed');
      toast.success('Account deleted.');
      window.location.href = '/';
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = ProfileSchema.safeParse(form);
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
      const res = await fetch('/api/user?action=profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordLoading(true);

    const result = PasswordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formatted: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([field, msgs]) => {
        if (msgs && msgs[0]) formatted[field] = msgs[0];
      });
      setPasswordErrors(formatted);
      toast.error('Please fix validation errors.');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: result.data.new_password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      toast.success('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-md mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800 text-white">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold text-teal-400">Profile Settings</h2>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Profile Name</label>
          <input
            name="profile_name"
            value={form.profile_name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {errors.profile_name && <p className="text-red-500 text-sm mt-1">{errors.profile_name}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Date of Birth</label>
          <input
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 font-bold rounded transition duration-200 text-white ${loading ? 'bg-teal-700 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500'}`}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <h2 className="text-xl font-bold text-teal-400">Change Password</h2>

        <div>
          <label className="block mb-1 font-medium">Current Password</label>
          <input
            name="current_password"
            type="password"
            value={passwordForm.current_password}
            onChange={handlePasswordChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {passwordErrors.current_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.current_password}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            name="new_password"
            type="password"
            value={passwordForm.new_password}
            onChange={handlePasswordChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {passwordErrors.new_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.new_password}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">Confirm Password</label>
          <input
            name="confirm_password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={handlePasswordChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          {passwordErrors.confirm_password && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirm_password}</p>}
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className={`w-full py-2 px-4 font-bold rounded transition duration-200 text-white ${passwordLoading ? 'bg-teal-700 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500'}`}
        >
          {passwordLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="pt-8 border-t border-gray-700">
        <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-2">
          Type <strong>DELETE</strong> in the box below to confirm account deletion.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-red-500"
          placeholder="Type DELETE to confirm"
        />
        <button
          onClick={handleDelete}
          disabled={deleting || confirmText !== 'DELETE'}
          className={`w-full py-2 px-4 font-bold rounded transition duration-200 text-white ${deleting || confirmText !== 'DELETE' ? 'bg-red-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
