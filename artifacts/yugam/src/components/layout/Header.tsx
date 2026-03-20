import { Search, Bell, UserCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="h-[60px] min-h-[60px] bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2 bg-yugam-grey rounded-lg px-3 py-2 w-72">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-muted-foreground hover:text-yugam-red hover:bg-yugam-grey transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-yugam-red hover:bg-yugam-grey transition-colors">
          <UserCircle className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
