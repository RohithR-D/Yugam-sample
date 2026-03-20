import { Search, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="h-[60px] min-h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-64 focus-within:ring-1 focus-within:ring-red-200 transition-all">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search anything..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E31E24] rounded-full ring-2 ring-white" />
        </button>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E31E24] to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow">
          R
        </button>
      </div>
    </header>
  );
}
