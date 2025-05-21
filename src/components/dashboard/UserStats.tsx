'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  profile_name: string;
  profile_suffix: string;
  level: number;
  money: number;
  respect: number;
  will: number;
}

interface Settings {
  max_will: number;
  regen_rate_per_minute: number;
}

export default function UserStats() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timeToFull, setTimeToFull] = useState('');
  const [levelProgress, setLevelProgress] = useState<number | null>(null);
  const [nextLevelRespect, setNextLevelRespect] = useState<number | null>(null);
  const router = useRouter();

  const calculateTimeToFull = (current: number, max: number, rate: number): string => {
    const missing = max - current;
    if (missing <= 0 || rate <= 0) return '';
    const totalMinutes = missing / rate;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);
    return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/user/session');
        const data = await res.json();
        if (!data.authenticated) return router.push('/');
        setUser(data.user);
        setSettings(data.settings);

        const time = calculateTimeToFull(
          data.user.will,
          data.settings.max_will,
          data.settings.regen_rate_per_minute
        );
        setTimeToFull(time);

        const nextLevel = data.user.level + 1;
        const levelRes = await fetch(`/api/level/requirement?level=${nextLevel}`);
        const levelData = await levelRes.json();
        if (levelData.respect_required) {
          const progress = Math.min(
            100,
            (data.user.respect / levelData.respect_required) * 100
          );
          setLevelProgress(progress);
          setNextLevelRespect(levelData.respect_required);
        } else {
          setLevelProgress(100);
          setNextLevelRespect(null);
        }
      } catch (err) {
        console.error('Failed to fetch session or level data:', err);
      }
    };

    const startInterval = () => {
      clearInterval(interval);
      interval = setInterval(fetchData, 30000);
    };

    fetchData();
    startInterval();

    const onUpdate = () => {
      fetchData();
      startInterval(); // Reset interval after user:update
    };

    window.addEventListener('user:update', onUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('user:update', onUpdate);
    };
  }, [router]);

  if (!user || !settings) return null;

  const willPercentage = (user.will / settings.max_will) * 100;

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg text-sm text-gray-400 space-y-2">
      <div>
        <h2 className="text-lg text-white font-semibold">Welcome</h2>
        <p className="text-teal-400 text-xl font-bold leading-tight">{user.profile_name}</p>
      </div>

      <hr className="border-gray-700 my-2" />

      <div className="space-y-1">
        <p><span className="text-teal-300">Level:</span> {user.level}</p>
        <p><span className="text-teal-300">Money:</span> ${user.money}</p>
        <p><span className="text-teal-300">Respect:</span> {user.respect}</p>
        <p><span className="text-teal-300">Will:</span> {user.will} / {settings.max_will}</p>

        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
          <div
            className="bg-teal-500 h-2.5 rounded-full transition-all"
            style={{ width: `${willPercentage}%` }}
          />
        </div>

        {user.will < settings.max_will && (
          <p className="text-xs text-gray-500 mt-1">
            🕒 Full in: <strong>{timeToFull}</strong>
          </p>
        )}
      </div>

      {levelProgress !== null && nextLevelRespect && (
        <div className="mt-4 space-y-1">
          <p className="text-teal-300">Level Progress:</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-yellow-400 h-2.5 rounded-full transition-all"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {user.respect} / {nextLevelRespect} Respect
          </p>
        </div>
      )}

      <button
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/');
        }}
        className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-4 text-sm rounded"
      >
        Logout
      </button>
    </div>
  );
}
