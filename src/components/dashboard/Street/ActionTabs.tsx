interface Props {
    active: string;
    onChange: (tab: string) => void;
}

const tabs = ['Weapons', 'Clubs', 'Drugs'];

export default function ActionTabs({ active, onChange }: Props) {
    return (
        <div className='flex space-x-4 border-b border-gray-700 pb-2'>
            {tabs.map((tab) => (
                <button 
                    key={tab}
                    className={`px-4 py-2 rounded-t font-medium ${
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