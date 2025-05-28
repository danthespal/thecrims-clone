'use client';

import GuestLayout from '@/components/layout/GuestLayout';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import { Users, Sword, Crown, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuestDashboard() {
  return (
    <GuestLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 gap-10"
      >
        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-center text-teal-400 tracking-wide drop-shadow mb-4">
            CRIME CITY
          </h1>
          <p className="text-gray-400 text-center text-xl italic">
            Climb the ranks. Own the streets.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10">
          {/* Live Stats Section */}
          <section className="flex-1 rounded-3xl backdrop-blur bg-gray-900/70 shadow-2xl p-6 md:p-10 border border-gray-700">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Live City Stats</h2>
            <ul className="space-y-5 text-base md:text-lg text-gray-300">
              <li className="flex items-center gap-3">
                <Users className="text-teal-400" />
                <span className="font-medium">Players online:</span>
                <span className="ml-auto font-bold">123</span>
              </li>
              <li className="flex items-center gap-3">
                <Sword className="text-teal-400" />
                <span className="font-medium">Total crimes today:</span>
                <span className="ml-auto font-bold">2,312</span>
              </li>
              <li className="flex items-center gap-3">
                <Crown className="text-teal-400" />
                <span className="font-medium">Top criminal:</span>
                <span className="ml-auto font-bold">BloodyKnife</span>
              </li>
              <li className="flex items-center gap-3">
                <Repeat className="text-teal-400" />
                <span className="font-medium">Current round:</span>
                <span className="ml-auto font-bold">#34</span>
              </li>
            </ul>
          </section>

          {/* Login Form Section */}
          <section className="w-full max-w-md rounded-3xl backdrop-blur bg-gray-900/70 shadow-2xl p-6 md:p-10 border border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                Log in to your account
              </h2>
              <p className="text-base md:text-lg text-gray-400">Welcome back, gangster.</p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center border-t border-gray-800 pt-6">
              <button className="w-full py-2 rounded bg-gradient-to-r from-teal-500 to-teal-400 text-white font-bold hover:brightness-110 transition mb-3">
                Join Now
              </button>
              <span className="text-gray-400">Don&#39;t have an account?</span>{' '}
              <Link href="/register" className="text-teal-400 hover:underline font-semibold">
                Register here
              </Link>
            </div>
          </section>
        </div>
      </motion.div>
    </GuestLayout>
  );
}
