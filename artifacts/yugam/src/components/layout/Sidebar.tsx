import { useState } from "react";
import { Users, ShoppingCart, Settings } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const navItems: NavItem[] = [
  { label: "HR Management", icon: Users, href: "/hr" },
  { label: "Sales Hub", icon: ShoppingCart, href: "/sales" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("HR Management");

  return (
    <aside className="w-[250px] min-w-[250px] h-screen bg-yugam-grey border-r border-border flex flex-col">
      <div className="h-[60px] flex items-center px-6">
        <span className="text-2xl font-bold text-yugam-red">Yugam Logo</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.label;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-yugam-red bg-white shadow-sm"
                  : "text-muted-foreground hover:text-yugam-red hover:bg-white/60"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-yugam-red" : ""}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
