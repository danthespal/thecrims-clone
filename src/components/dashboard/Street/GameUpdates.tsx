'use client';

interface Update {
  title: string;
  desc: string;
  time: string;
}

const GameUpdates = () => {
  const updates: Update[] = [
    { title: 'New feature!', desc: 'Daily missions coming soon.', time: '2025-05-21' },
    { title: 'UI revamp', desc: 'Cleaned up Streets section UI.', time: '2025-05-20' },
  ];

  return (
    <section className="bg-gray-800 p-4 rounded-xl shadow border border-gray-700 space-y-4">
      <h3 className="text-xl font-bold text-teal-400">Game Development Updates</h3>

      {updates.map((update, idx) => (
        <div key={idx} className="border-b border-gray-700 pb-2 last:border-none">
          <p className="text-teal-300 font-semibold">{update.title}</p>
          <p className="text-gray-300 text-sm">{update.desc}</p>
          <p className="text-gray-500 text-xs italic">{update.time}</p>
        </div>
      ))}
    </section>
  );
};

export default GameUpdates;
