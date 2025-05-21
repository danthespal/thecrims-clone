const GameUpdates = () => {
  const updates = [
    { title: "New feature!", desc: "Daily missions coming soon.", time: "2025-05-21" },
    { title: "UI revamp", desc: "Cleaned up Streets section UI.", time: "2025-05-20" },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold text-teal-400 mb-2">Game Development Updates</h3>
      {updates.map((u, i) => (
        <div key={i} className="mb-3">
          <p className="text-teal-300 font-semibold">{u.title}</p>
          <p className="text-gray-300 text-sm">{u.desc}</p>
          <p className="text-gray-500 text-xs">{u.time}</p>
        </div>
      ))}
    </div>
  );
};

export default GameUpdates;