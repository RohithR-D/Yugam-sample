import { useState } from "react";
import { useModule } from "@/context/ModuleContext";
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
  LayoutDashboard,
  ShoppingCart,
  FileCheck,
  ClipboardList,
  FileOutput,
  RotateCcw,
  Phone,
  Calendar,
  Warehouse,
  ArrowLeftRight,
  Store,
  Clock,
} from "lucide-react";

interface Module {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; icon: React.ComponentType<{ className?: string }> }[];
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
      {
        label: "Sales", subtitle: "Sales Hub", icon: ShoppingCart,
        children: [
          { label: "Sales:Quotation", icon: FileText },
          { label: "Sales:Proforma Invoice", icon: FileCheck },
          { label: "Sales:Sales Order", icon: ClipboardList },
          { label: "Sales:Invoices", icon: Receipt },
          { label: "Sales:Delivery Challan", icon: FileOutput },
          { label: "Sales:Sales Return", icon: RotateCcw },
        ],
      },
      {
        label: "Sync", subtitle: "Comms", icon: MessageSquare,
        children: [
          { label: "Sync:Chats", icon: MessageSquare },
          { label: "Sync:Calls", icon: Phone },
          { label: "Sync:Meetings", icon: Calendar },
        ],
      },
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
      {
        label: "Vault", subtitle: "Inventory", icon: Package,
        children: [
          { label: "Vault:Dashboard", icon: LayoutDashboard },
          { label: "Vault:Item & Product Master", icon: Package },
          { label: "Vault:Warehouses & Stores", icon: Warehouse },
          { label: "Vault:Stock Movements", icon: ArrowLeftRight },
          { label: "Vault:Material Issue", icon: ClipboardList },
          { label: "Vault:Store Management", icon: Store },
          { label: "Vault:Asset Management", icon: HardDrive },
        ],
      },
      {
        label: "Flex", subtitle: "Procurement", icon: ShoppingBag,
        children: [
          { label: "Flex:Material Requests", icon: ClipboardList },
          { label: "Flex:Purchase Requests", icon: FileText },
          { label: "Flex:Quotation Requests", icon: FileCheck },
          { label: "Flex:Quotation Validations", icon: BarChart3 },
          { label: "Flex:Purchase Orders", icon: ShoppingCart },
          { label: "Flex:Goods Receipts", icon: Package },
          { label: "Flex:Purchase Invoices", icon: Receipt },
          { label: "Flex:Purchase Returns", icon: RotateCcw },
        ],
      },
      {
        label: "Forge", subtitle: "Production", icon: Factory,
        children: [
          { label: "Forge:Production Dashboard", icon: LayoutDashboard },
          { label: "Forge:Bill of Materials", icon: ClipboardList },
          { label: "Forge:Workstations & Routing", icon: Factory },
          { label: "Forge:Work Orders", icon: ListChecks },
          { label: "Forge:Quality Control", icon: Shield },
          { label: "Forge:Downtime Logs", icon: Calendar },
        ],
      },
      { label: "Fleet", subtitle: "Logistics", icon: Truck },
    ],
  },
  {
    title: "Ops & Finance",
    modules: [
      {
        label: "Flow", subtitle: "Projects", icon: FolderKanban,
        children: [
          { label: "Flow:Dashboard", icon: LayoutDashboard },
          { label: "Flow:Project Portfolio", icon: FolderKanban },
          { label: "Flow:Milestones & Gantt", icon: BarChart3 },
          { label: "Flow:Budgets & Costing", icon: CreditCard },
          { label: "Flow:Document Center", icon: HardDrive },
        ],
      },
      {
        label: "Sprint & Solve", subtitle: "Tasks & Tickets", icon: ListChecks,
        children: [
          { label: "Sprint & Solve:My Workspace", icon: LayoutDashboard },
          { label: "Sprint & Solve:Task Boards", icon: ListChecks },
          { label: "Sprint & Solve:Backlog & Planning", icon: ClipboardList },
          { label: "Sprint & Solve:Issue Desk (Tickets)", icon: FileCheck },
          { label: "Sprint & Solve:Timesheets", icon: Clock },
        ],
      },
      {
        label: "Ledger", subtitle: "Accounts", icon: BookOpen,
        children: [
          { label: "Ledger:Finance Dashboard", icon: LayoutDashboard },
          { label: "Ledger:Chart of Accounts", icon: BookOpen },
          { label: "Ledger:Accounts Payable (AP)", icon: CreditCard },
          { label: "Ledger:Accounts Receivable (AR)", icon: Receipt },
          { label: "Ledger:Journal Entries", icon: FileText },
          { label: "Ledger:Financial Statements", icon: BarChart3 },
        ],
      },
      {
        label: "Trail", subtitle: "Expenses", icon: CreditCard,
        children: [
          { label: "Trail:Expense Dashboard", icon: LayoutDashboard },
          { label: "Trail:My Claims", icon: FileText },
          { label: "Trail:Approval Queue", icon: ClipboardList },
          { label: "Trail:Petty Cash Ledger", icon: Wallet },
        ],
      },
    ],
  },
  {
    title: "Command & Control",
    modules: [
      {
        label: "Contracta", subtitle: "Legal Docs", icon: FileSignature,
        children: [
          { label: "Contracta:Compliance Dashboard", icon: LayoutDashboard },
          { label: "Contracta:Client Agreements", icon: FileText },
          { label: "Contracta:Vendor Contracts", icon: FileCheck },
          { label: "Contracta:Statutory Compliances", icon: Shield },
          { label: "Contracta:Letter & Doc Builder", icon: FileSignature },
        ],
      },
      {
        label: "Vision", subtitle: "Reports", icon: BarChart3,
        children: [
          { label: "Vision:Executive Dashboard", icon: LayoutDashboard },
          { label: "Vision:Financial Health", icon: BookOpen },
          { label: "Vision:Ops & Production", icon: Factory },
          { label: "Vision:Report Center", icon: FileOutput },
        ],
      },
      { label: "Gate", subtitle: "Security", icon: Shield },
      { label: "Drive", subtitle: "Files", icon: HardDrive },
      { label: "Settings", subtitle: "System", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { activeModule, setActiveModule } = useModule();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.title] = true;
    });
    return initial;
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ Sales: false, Sync: false, Vault: false, Flex: false, Forge: false, Flow: false, "Sprint & Solve": false, Ledger: false, Trail: false, Contracta: false, Vision: false });

  function toggleCategory(title: string) {
    setExpandedCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  function toggleModule(label: string) {
    setExpandedModules((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  return (
    <aside className="w-[250px] min-w-[250px] h-screen bg-yugam-grey border-r border-gray-200/80 flex flex-col">
      <button
        onClick={() => setActiveModule("Dashboard")}
        className="h-[60px] flex items-center px-5 shrink-0 border-b border-gray-200/60 w-full cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <img
          src={`${import.meta.env.BASE_URL}ED-ECS-Yugam.png`}
          alt="Yugam ERP"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <span className="text-xl font-bold text-[#E31E24] tracking-tight hidden items-center gap-1.5">
          <span className="w-6 h-6 bg-[#E31E24] rounded-md flex items-center justify-center text-white text-xs font-black">Y</span>
          Yugam
        </span>
      </button>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <button
          onClick={() => setActiveModule("Dashboard")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-all rounded-lg mb-2 ${
            activeModule === "Dashboard"
              ? "bg-gradient-to-r from-[#E31E24] to-[#c91920] text-white font-semibold shadow-sm"
              : "text-gray-600 hover:bg-red-50 hover:text-[#E31E24]"
          }`}
        >
          <LayoutDashboard className="w-[15px] h-[15px] shrink-0" />
          <span>Dashboard</span>
        </button>

        {categories.map((category) => {
          const isExpanded = expandedCategories[category.title];
          return (
            <div key={category.title}>
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between px-3 py-1 group cursor-pointer"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {category.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {category.modules.map((mod) => {
                    const Icon = mod.icon;

                    if (mod.children) {
                      const isModExpanded = expandedModules[mod.label];
                      const isAnySalesChildActive = activeModule.startsWith(mod.label + ":");
                      return (
                        <div key={mod.label}>
                          <button
                            onClick={() => {
                              toggleModule(mod.label);
                              if (!isModExpanded && mod.children && mod.children.length > 0) {
                                setActiveModule(mod.children[0].label);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-all rounded-r-md ${
                              isAnySalesChildActive
                                ? "bg-red-50 text-[#E31E24] border-l-[3px] border-[#E31E24] font-semibold"
                                : "text-gray-600 hover:bg-red-50/60 hover:text-[#E31E24] border-l-[3px] border-transparent"
                            }`}
                          >
                            <Icon className="w-[15px] h-[15px] shrink-0" />
                            <span className="truncate flex-1 text-left">
                              {mod.label}
                              <span className={`ml-1 text-[11px] ${isAnySalesChildActive ? "text-[#E31E24]/60" : "text-gray-400"}`}>
                                ({mod.subtitle})
                              </span>
                            </span>
                            {isModExpanded ? (
                              <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />
                            )}
                          </button>
                          {isModExpanded && (
                            <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-3">
                              {mod.children.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive = activeModule === child.label;
                                const displayLabel = child.label.replace(mod.label + ":", "");
                                return (
                                  <button
                                    key={child.label}
                                    onClick={() => setActiveModule(child.label)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[12px] transition-all rounded-md ${
                                      isChildActive
                                        ? "bg-[#E31E24]/10 text-[#E31E24] font-semibold"
                                        : "text-gray-500 hover:bg-red-50/60 hover:text-[#E31E24]"
                                    }`}
                                  >
                                    <ChildIcon className="w-[13px] h-[13px] shrink-0" />
                                    <span className="truncate">{displayLabel}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = activeModule === mod.label;
                    return (
                      <button
                        key={mod.label}
                        onClick={() => setActiveModule(mod.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-all rounded-r-md ${
                          isActive
                            ? "bg-red-50 text-[#E31E24] border-l-[3px] border-[#E31E24] font-semibold"
                            : "text-gray-600 hover:bg-red-50/60 hover:text-[#E31E24] border-l-[3px] border-transparent"
                        }`}
                      >
                        <Icon className="w-[15px] h-[15px] shrink-0" />
                        <span className="truncate">
                          {mod.label}
                          <span className={`ml-1 text-[11px] ${isActive ? "text-[#E31E24]/60" : "text-gray-400"}`}>
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
