interface Props {
  active: string;
  setActive: (item: string) => void;
}

const accountMenu = ["Inventory", "Profile Status", "Profile Settings"];
const gameMenu = ["Streets", "Robbery", "Casino", "Hookers"];

export default function SidebarMenu({ active, setActive }: Props) {
  const renderMenu = (title: string, items: string[]) => (
    <nav className="mb-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item}>
            <button
              className={`w-full text-left px-3 py-2 rounded-md font-medium transition ${
                active === item ? "bg-gray-800 text-teal-400" : "text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {renderMenu("Account", accountMenu)}
      {renderMenu("Game", gameMenu)}
    </>
  );
}
