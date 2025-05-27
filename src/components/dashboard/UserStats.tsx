'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSession from '@/hooks/useSession';
import { calculateTimeToFull } from '@/lib/utils/stats';

function simulateWill(last: number, updatedAt: string | undefined, max: number, regenRate: number): number {
  if (!updatedAt) return last;

  const updated = new Date(updatedAt).getTime();
  if (isNaN(updated)) {
    console.warn('Invalid updatedAt timestamp:', updatedAt);
    return last;
  }

  const secondsPassed = (Date.now() - updated) / 1000;
  const regenPerSecond = regenRate / 60;
  return Math.min(max, last + secondsPassed * regenPerSecond);
}

export default function UserStats() {
  const [timeToFull, setTimeToFull] = useState('');
  const [levelProgress, setLevelProgress] = useState<number | null>(null);
  const [nextLevelRespect, setNextLevelRespect] = useState<number | null>(null);
  const { session } = useSession();
  const router = useRouter();

  const user = session?.user;
  const settings = session?.settings;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user && settings) {
      const updateTime = () => {
        const simulated = simulateWill(user.will, user.updated_at, settings.max_will, settings.regen_rate_per_minute);
        const time = calculateTimeToFull(simulated, settings.max_will, settings.regen_rate_per_minute);
        setTimeToFull(time);
      };

      updateTime();
      interval = setInterval(updateTime, 1000);

      return () => clearInterval(interval);
    }
  }, [user, settings]);

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

  const simulatedWill = simulateWill(user.will, user.updated_at, settings.max_will, settings.regen_rate_per_minute);
  const displayedWill = isNaN(simulatedWill) ? user.will : Math.floor(simulatedWill);
  const willPercentage = isNaN(simulatedWill)
    ? (user.will / settings.max_will) * 100
    : (simulatedWill / settings.max_will) * 100;

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
        <p><span className="text-teal-300">Will:</span> {displayedWill} / {settings.max_will}</p>

        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
          <div
            className="bg-teal-500 h-2.5 rounded-full transition-all"
            style={{ width: `${willPercentage}%` }}
          />
        </div>

        {simulatedWill < settings.max_will && (
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
