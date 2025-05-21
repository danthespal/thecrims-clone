const StreetNews = () => {
  const news = [
    { title: "Massive Hit", desc: "'ShadowBlade' took down rival crew.", time: "2025-05-21" },
    { title: "New Club", desc: "'Don Mendez' opened Eastside club.", time: "2025-05-20" },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold text-teal-400 mb-2">Street News</h3>
      {news.map((n, i) => (
        <div key={i} className="mb-3">
          <p className="text-teal-300 font-semibold">{n.title}</p>
          <p className="text-gray-300 text-sm">{n.desc}</p>
          <p className="text-gray-500 text-xs">{n.time}</p>
        </div>
      ))}
    </div>
  );
};

export default StreetNews;