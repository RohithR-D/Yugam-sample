import { Search, Bell, LogOut, ChevronDown, Users, FolderKanban, CircleDot, ListChecks, Receipt, FileSignature, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModule } from "@/context/ModuleContext";
import { authFetch } from "@/lib/authFetch";
import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  type: string;
  text: string;
  subtitle: string;
  module: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Client: CircleDot,
  Employee: Users,
  Project: FolderKanban,
  Task: ListChecks,
  Invoice: Receipt,
  Contract: FileSignature,
  Transaction: BookOpen,
};

const typeColors: Record<string, string> = {
  Client: "bg-emerald-50 text-emerald-600",
  Employee: "bg-blue-50 text-blue-600",
  Project: "bg-violet-50 text-violet-600",
  Task: "bg-amber-50 text-amber-600",
  Invoice: "bg-rose-50 text-rose-600",
  Contract: "bg-purple-50 text-purple-600",
  Transaction: "bg-teal-50 text-teal-600",
};

export default function Header() {
  const { user, logout } = useAuth();
  const { setActiveModule } = useModule();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await authFetch(`${import.meta.env.BASE_URL}api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch {}
    setSearching(false);
  }, []);

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    setSearchOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  function handleResultClick(result: SearchResult) {
    setActiveModule(result.module);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  }

  const initials = user ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "U";
  const roleColors: Record<string, string> = {
    Admin: "bg-red-100 text-red-700",
    Manager: "bg-blue-100 text-blue-700",
    Employee: "bg-green-100 text-green-700",
  };

  const grouped = searchResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <header className="h-[60px] min-h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div className="relative" ref={searchRef}>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-72 focus-within:ring-2 focus-within:ring-[#E31E24]/20 focus-within:border-[#E31E24]/40 transition-all">
          {searching ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
          <input
            type="search"
            placeholder="Search anything... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setSearchOpen(true); }}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
        </div>

        {searchOpen && searchQuery.length >= 2 && (
          <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[420px] overflow-y-auto">
            {searching && searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No results for "{searchQuery}"
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const Icon = typeIcons[type] || Search;
                const color = typeColors[type] || "bg-gray-50 text-gray-600";
                return (
                  <div key={type}>
                    <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type}s</span>
                    </div>
                    {items.map((r, i) => (
                      <button
                        key={`${type}-${i}`}
                        onClick={() => handleResultClick(r)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{r.text}</p>
                          <p className="text-xs text-gray-400 truncate">{r.subtitle} · {r.module}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E31E24] rounded-full ring-2 ring-white" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 hover:bg-gray-50 rounded-full pl-1 pr-3 py-1 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E31E24] to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name || "User"}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.role || "Employee"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${roleColors[user?.role || "Employee"] || roleColors.Employee}`}>
                    {user?.role}
                  </span>
                  {user?.department && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
