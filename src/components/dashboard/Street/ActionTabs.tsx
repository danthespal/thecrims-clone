interface Props {
  active: string;
  onChange: (tab: string) => void;
  tabs?: string[];
}

const defaultTabs = ['Weapons', 'Clubs', 'Drugs'];

export default function ActionTabs({ active, onChange, tabs = defaultTabs }: Props) {
  return (
    <div className="flex space-x-4 border-b border-gray-700 pb-2" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className={`px-4 py-2 rounded-t font-medium transition ${
            active === tab
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-gray-400 hover:text-teal-300'
          }`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
