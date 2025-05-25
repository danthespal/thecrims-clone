'use client';

import { useEffect, useState } from 'react';

interface RobberyButtonProps {
  action: string;
  label: string;
}

export default function RobberyButton({ action, label }: RobberyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRobbery = async () => {
    setLoading(true);
    setMessage('');

    const res = await fetch(`/api/robbery?action=${action}`, {
      method: 'POST',
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok && data.result) {
      const { earnedMoney, earnedRespect } = data.result;
      setMessage(`✅ You gained $${earnedMoney} and ${earnedRespect} respect.`);
      setCooldown(data.cooldown ?? 0);
      window.dispatchEvent(new Event('user:update'));
    } else {
      if (data.error?.toLowerCase().includes('will')) {
        setMessage('❌ You don’t have enough willpower.');
      } else {
        setMessage(`❌ ${data.error ?? 'Robbery failed.'}`);
      }

      if (res.status === 429 && data.error?.includes('Wait')) {
        const match = data.error.match(/Wait (\d+)s/);
        if (match) setCooldown(parseInt(match[1], 10));
      }
    }
  };

  return (
    <div className="space-y-2 bg-gray-800 border border-gray-700 p-4 rounded-lg">
      <button
        disabled={loading || cooldown > 0}
        onClick={handleRobbery}
        className={`w-full py-2 px-4 font-bold rounded text-white transition ${
          loading || cooldown > 0
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-500'
        }`}
      >
        {cooldown > 0 ? `Cooldown: ${cooldown}s` : loading ? 'Robbing...' : label}
      </button>

      {message && (
        <p className="text-sm text-center text-gray-300">{message}</p>
      )}
    </div>
  );
}
