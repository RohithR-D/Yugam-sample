import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileText,
  Receipt,
  MessageSquare,
  Users,
  UserPlus,
  Wallet,
  Package,
  ShoppingBag,
  Factory,
  Truck,
  FolderKanban,
  ListChecks,
  BookOpen,
  CreditCard,
  FileSignature,
  BarChart3,
  Shield,
  HardDrive,
  Settings,
} from "lucide-react";

interface Module {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Category {
  title: string;
  modules: Module[];
}

const categories: Category[] = [
  {
    title: "Front Office & Sales",
    modules: [
      { label: "Orbit", subtitle: "CRM", icon: CircleDot },
      { label: "Estimo", subtitle: "Quotes", icon: FileText },
      { label: "Billr", subtitle: "Invoicing", icon: Receipt },
      { label: "Sync", subtitle: "Comms", icon: MessageSquare },
    ],
  },
  {
    title: "HR Hub",
    modules: [
      { label: "Crew", subtitle: "Core HR & Attendance", icon: Users },
      { label: "Hire", subtitle: "Recruitment", icon: UserPlus },
      { label: "CrewPay", subtitle: "Payroll", icon: Wallet },
    ],
  },
  {
    title: "Supply & Production",
    modules: [
      { label: "Vault", subtitle: "Inventory", icon: Package },
      { label: "Flex", subtitle: "Procurement", icon: ShoppingBag },
      { label: "Forge", subtitle: "Production", icon: Factory },
      { label: "Fleet", subtitle: "Logistics", icon: Truck },
    ],
  },
  {
    title: "Ops & Finance",
    modules: [
      { label: "Flow", subtitle: "Projects", icon: FolderKanban },
      { label: "Sprint & Solve", subtitle: "Tasks & Tickets", icon: ListChecks },
      { label: "Ledger", subtitle: "Accounts", icon: BookOpen },
      { label: "Trail", subtitle: "Expenses", icon: CreditCard },
    ],
  },
  {
    title: "Command & Control",
    modules: [
      { label: "Contracta", subtitle: "Legal Docs", icon: FileSignature },
      { label: "Vision", subtitle: "Reports", icon: BarChart3 },
      { label: "Gate", subtitle: "Security", icon: Shield },
      { label: "Drive", subtitle: "Files", icon: HardDrive },
      { label: "Settings", subtitle: "System", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [activeModule, setActiveModule] = useState("Orbit");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.title] = true;
    });
    return initial;
  });

  function toggleCategory(title: string) {
    setExpandedCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  return (
    <aside className="w-[250px] min-w-[250px] h-screen bg-yugam-grey border-r border-border flex flex-col">
      <div className="h-[60px] flex items-center px-6 shrink-0">
        <span className="text-2xl font-bold text-yugam-red">Yugam Logo</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {categories.map((category) => {
          const isExpanded = expandedCategories[category.title];
          return (
            <div key={category.title}>
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 group cursor-pointer"
              >
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {category.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {category.modules.map((mod) => {
                    const isActive = activeModule === mod.label;
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.label}
                        onClick={() => setActiveModule(mod.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-r-md ${
                          isActive
                            ? "bg-red-50 text-[#E31E24] border-l-4 border-[#E31E24] font-medium"
                            : "text-gray-700 hover:bg-red-50 hover:text-[#E31E24] hover:border-l-4 hover:border-[#E31E24] border-l-4 border-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {mod.label}
                          <span className={`ml-1 ${isActive ? "text-[#E31E24]/70" : "text-gray-400"}`}>
                            ({mod.subtitle})
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
