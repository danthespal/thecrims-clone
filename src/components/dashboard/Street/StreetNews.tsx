'use client';

interface NewsItem {
  title: string;
  desc: string;
  time: string;
}

const StreetNews = () => {
  const news: NewsItem[] = [
    { title: 'Massive Hit', desc: "'ShadowBlade' took down rival crew.", time: '2025-05-21' },
    { title: 'New Club', desc: "'Don Mendez' opened Eastside club.", time: '2025-05-20' },
  ];

  return (
    <section className="bg-gray-800 p-4 rounded-xl shadow border border-gray-700 space-y-4">
      <h3 className="text-xl font-bold text-teal-400">Street News</h3>

      {news.map((item, idx) => (
        <div key={idx} className="border-b border-gray-700 pb-2 last:border-none">
          <p className="text-teal-300 font-semibold">{item.title}</p>
          <p className="text-gray-300 text-sm">{item.desc}</p>
          <p className="text-gray-500 text-xs italic">{item.time}</p>
        </div>
      ))}
    </section>
  );
};

export default StreetNews;
