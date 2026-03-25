import { useState, useEffect, useCallback } from "react";
import { useModule } from "@/context/ModuleContext";
import {
  Users,
  ListChecks,
  FolderKanban,
  CircleDot,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileSignature,
  Shield,
  Truck,
  CreditCard,
  ArrowRight,
  Activity,
  BarChart3,
} from "lucide-react";

interface DashboardSummary {
  activeEmployees: number;
  openTasks: number;
  activeProjects: number;
  totalClients: number;
  activeContracts: number;
  onPremisesVisitors: number;
  pendingShipments: number;
  pendingExpenses: number;
  totalCredits: number;
  totalDebits: number;
  monthlyPL: number;
  outstandingInvoiceAmount: number;
  outstandingInvoiceCount: number;
  recentTransactions: Array<{
    id: number;
    date: string;
    description: string;
    category: string;
    type: string;
    amount: string;
  }>;
  recentTasks: Array<{
    id: number;
    title: string;
    assignee: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

function formatCurrency(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Done: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "To Do": "bg-gray-100 text-gray-600",
    "In Review": "bg-amber-100 text-amber-700",
    Blocked: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function getPriorityDot(priority: string): string {
  const map: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-400",
    Low: "bg-green-500",
  };
  return map[priority] || "bg-gray-400";
}

export default function MainDashboard() {
  const { setActiveModule } = useModule();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/dashboard-summary`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard summary fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E31E24]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    );
  }

  const topCards = [
    { label: "Active Employees", value: data.activeEmployees, icon: Users, color: "from-blue-500 to-blue-600", module: "Crew" },
    { label: "Open Tasks", value: data.openTasks, icon: ListChecks, color: "from-amber-500 to-orange-500", module: "Sprint & Solve" },
    { label: "Active Projects", value: data.activeProjects, icon: FolderKanban, color: "from-violet-500 to-purple-600", module: "Flow" },
    { label: "Total Clients", value: data.totalClients, icon: CircleDot, color: "from-emerald-500 to-green-600", module: "Orbit" },
  ];

  const financeCards = [
    { label: "Total Revenue", value: formatCurrency(data.totalCredits), icon: TrendingUp, trend: "credit", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Expenses", value: formatCurrency(data.totalDebits), icon: TrendingDown, trend: "debit", color: "text-red-600", bg: "bg-red-50" },
    { label: "Net P&L", value: formatCurrency(data.monthlyPL), icon: IndianRupee, trend: data.monthlyPL >= 0 ? "credit" : "debit", color: data.monthlyPL >= 0 ? "text-emerald-600" : "text-red-600", bg: data.monthlyPL >= 0 ? "bg-emerald-50" : "bg-red-50" },
    { label: "Outstanding Invoices", value: formatCurrency(data.outstandingInvoiceAmount), icon: CreditCard, subtitle: `${data.outstandingInvoiceCount} unpaid`, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const opsCards = [
    { label: "Active Contracts", value: data.activeContracts, icon: FileSignature, color: "text-violet-600", bg: "bg-violet-50", module: "Contracta" },
    { label: "Visitors On-Site", value: data.onPremisesVisitors, icon: Shield, color: "text-blue-600", bg: "bg-blue-50", module: "Gate" },
    { label: "In-Transit Shipments", value: data.pendingShipments, icon: Truck, color: "text-orange-600", bg: "bg-orange-50", module: "Fleet" },
    { label: "Pending Expenses", value: data.pendingExpenses, icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50", module: "Trail" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live enterprise overview — all 21 modules connected</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Live data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((card) => (
          <button
            key={card.label}
            onClick={() => setActiveModule(card.module)}
            className="relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer text-left"
            style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <card.icon className="w-5 h-5 opacity-80" />
                <ArrowRight className="w-4 h-4 opacity-50" />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm opacity-80 mt-1">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <IndianRupee className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Financial Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financeCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {"subtitle" in card && card.subtitle && (
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Operations</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {opsCards.map((card) => (
            <button
              key={card.label}
              onClick={() => setActiveModule(card.module)}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-gray-200 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Transactions</h3>
            <button
              onClick={() => setActiveModule("Ledger")}
              className="text-xs text-[#E31E24] hover:underline font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === "Credit" ? "bg-emerald-50" : "bg-red-50"}`}>
                    {txn.type === "Credit" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{txn.description}</p>
                    <p className="text-xs text-gray-400">{txn.category} · {new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${txn.type === "Credit" ? "text-emerald-600" : "text-red-500"}`}>
                  {txn.type === "Credit" ? "+" : "−"}{formatCurrency(parseFloat(txn.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Tasks</h3>
            <button
              onClick={() => setActiveModule("Sprint & Solve")}
              className="text-xs text-[#E31E24] hover:underline font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.assignee}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-gray-300">Yugam ERP · 21 Modules · All Systems Operational</p>
      </div>
    </div>
  );
}
