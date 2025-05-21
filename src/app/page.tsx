import GuestLayout from '@/components/layout/GuestLayout';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function GuestDashboard() {
  return (
    <GuestLayout>
      <div className="flex flex-col w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 gap-12">
        {/* Main Title */}
        <h1 className="text-5xl font-extrabold text-center text-teal-400 tracking-wide drop-shadow mb-4">
          CRIME CITY
        </h1>

        <div className="flex flex-1 items-start gap-12">
          {/* Live Stats Section */}
          <section className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl p-10 border border-gray-700">
            <h2 className="text-4xl font-extrabold text-white mb-6">City Crime Live Stats</h2>
            <ul className="space-y-4 text-lg text-gray-300">
              <li>
                <span className="text-teal-400 font-medium">👥 Players online:</span>
                <span className="ml-2">128</span>
              </li>
              <li>
                <span className="text-teal-400 font-medium">🗡️ Total crimes today:</span>
                <span className="ml-2">2,312</span>
              </li>
              <li>
                <span className="text-teal-400 font-medium">🏆 Top criminal:</span>
                <span className="ml-2">&quot;BloodyKnife&quot;</span>
              </li>
              <li>
                <span className="text-teal-400 font-medium">🔁 Current round:</span>
                <span className="ml-2">#34</span>
              </li>
            </ul>
          </section>

          {/* Login Form Section */}
          <section className="w-full max-w-md bg-gray-950 rounded-3xl shadow-2xl p-10 border border-gray-800">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-white mb-2">Log in to your account</h2>
              <p className="text-sm text-gray-400">Welcome back, gangster.</p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center border-t border-gray-800 pt-6">
              <span className="text-gray-400">Don&apos;t have an account?</span>{' '}
              <Link
                href="/register"
                className="text-teal-400 hover:underline font-semibold"
              >
                Register here
              </Link>
            </div>
          </section>
        </div>
      </div>
    </GuestLayout>
  );
}
