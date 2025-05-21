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

    const res = await fetch(`/api/robbery/${action}`, {
      method: 'POST',
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
        setMessage(`✅ You gained $${data.rewards.money} and ${data.rewards.respect} respect.`);
        setCooldown(data.cooldown);

        // Trigger stats refresh
        window.dispatchEvent(new Event('user:update'));
    } else {
      setMessage(`❌ ${data.error || 'Failed to rob.'}`);
      if (res.status === 429 && data.error.includes('Wait')) {
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
