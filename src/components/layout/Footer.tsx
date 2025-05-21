export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-4 text-sm text-center text-gray-500 border-t border-gray-800">
      &copy; {year} The Crims Clone Project. All rights reserved.
    </footer>
  );
}
