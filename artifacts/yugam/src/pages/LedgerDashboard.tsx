import { useState } from "react";
import {
  Search,
  Download,
  Plus,
  Landmark,
  TrendingDown,
  TrendingUp,
  BarChart3,
  CalendarDays,
} from "lucide-react";

const metrics = [
  { label: "Total Assets", value: "₹ 1.24 Cr", icon: Landmark, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Total Liabilities", value: "₹ 48.6L", icon: TrendingDown, iconColor: "text-red-500", ringColor: "border-red-200" },
  { label: "Net Equity", value: "₹ 75.4L", icon: TrendingUp, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Monthly P&L", value: "₹ 8.2L", icon: BarChart3, iconColor: "text-emerald-500", ringColor: "border-emerald-200" },
];

type TxnType = "Debit" | "Credit";
type Category = "Operations" | "Sales" | "Payroll" | "Procurement" | "Utilities" | "Tax";

interface Transaction {
  date: string;
  description: string;
  category: Category;
  type: TxnType;
  amount: string;
}

const transactions: Transaction[] = [
  { date: "22 Mar 2026", description: "Supplier Payment - Steel Matrix", category: "Procurement", type: "Debit", amount: "₹ 4,80,000" },
  { date: "22 Mar 2026", description: "Client Invoice - TechNova Solutions", category: "Sales", type: "Credit", amount: "₹ 2,50,000" },
  { date: "21 Mar 2026", description: "Monthly Payroll - March 2026", category: "Payroll", type: "Debit", amount: "₹ 12,40,000" },
  { date: "20 Mar 2026", description: "GST Refund - Q4 FY26", category: "Tax", type: "Credit", amount: "₹ 1,85,000" },
  { date: "19 Mar 2026", description: "Office Rent - Bangalore HQ", category: "Operations", type: "Debit", amount: "₹ 3,20,000" },
  { date: "18 Mar 2026", description: "Electricity & Water - All Units", category: "Utilities", type: "Debit", amount: "₹ 78,500" },
  { date: "18 Mar 2026", description: "Client Invoice - Apex Dynamics", category: "Sales", type: "Credit", amount: "₹ 4,80,000" },
  { date: "17 Mar 2026", description: "Raw Material Purchase - Kaveri Polymers", category: "Procurement", type: "Debit", amount: "₹ 2,10,000" },
];

function CategoryPill({ category }: { category: Category }) {
  const styles: Record<Category, string> = {
    Operations: "bg-blue-50 text-blue-600",
    Sales: "bg-green-50 text-green-600",
    Payroll: "bg-purple-50 text-purple-600",
    Procurement: "bg-orange-50 text-orange-600",
    Utilities: "bg-gray-100 text-gray-600",
    Tax: "bg-teal-50 text-teal-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[category]}`}>
      {category}
    </span>
  );
}

export default function LedgerDashboard() {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ledger Accounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">General ledger and real-time financial health</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Reports
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ringColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
          <CalendarDays className="w-4 h-4" />
          Date Range
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((txn, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{txn.date}</td>
                <td className="px-5 py-4 font-medium text-gray-800">{txn.description}</td>
                <td className="px-5 py-4"><CategoryPill category={txn.category} /></td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold ${txn.type === "Debit" ? "text-red-500" : "text-green-600"}`}>
                    {txn.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">{txn.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
