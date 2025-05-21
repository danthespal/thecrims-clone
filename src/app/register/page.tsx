import GuestLayout from '@/components/layout/GuestLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <GuestLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <h1 className="text-4xl font-extrabold text-teal-400 mb-8 drop-shadow">
          CRIME CITY
        </h1>

        <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-xl p-8">
          <RegisterForm />

          <div className="mt-6 text-center">
            <span className="text-gray-400">Already have an account?</span>{' '}
            <Link href="/" className="text-teal-400 hover:underline font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
