'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSession from '@/hooks/useSession';
import { calculateTimeToFull } from '@/lib/utils/stats';

export default function UserStats() {
  const [timeToFull, setTimeToFull] = useState('');
  const [levelProgress, setLevelProgress] = useState<number | null>(null);
  const [nextLevelRespect, setNextLevelRespect] = useState<number | null>(null);
  const { session } = useSession();
  const router = useRouter();

  const user = session?.user;
  const settings = session?.settings;

  // ⏱️ Live timer for will regen
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user && settings) {
      const updateTime = () => {
        const time = calculateTimeToFull(user.will, settings.max_will, settings.regen_rate_per_minute);
        setTimeToFull(time);
      };

      updateTime();
      interval = setInterval(updateTime, 1000);

      return () => clearInterval(interval);
    }
  }, [user, settings]);

  // 📊 Level progress
  useEffect(() => {
    if (user && settings) {
      const nextLevel = user.level + 1;
      fetch(`/api/level/requirement?level=${nextLevel}`)
        .then((res) => res.json())
        .then((levelData) => {
          if (levelData.respect_required) {
            const progress = Math.min(100, (user.respect / levelData.respect_required) * 100);
            setLevelProgress(progress);
            setNextLevelRespect(levelData.respect_required);
          } else {
            setLevelProgress(100);
            setNextLevelRespect(null);
          }
        });
    }
  }, [user, settings]);

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
          await fetch('/api/auth?action=logout', { method: 'POST' });
          router.push('/');
        }}
        className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-4 text-sm rounded"
      >
        Logout
      </button>
    </div>
  );
}
