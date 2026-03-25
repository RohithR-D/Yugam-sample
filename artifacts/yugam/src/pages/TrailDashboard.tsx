import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  X,
  Plus,
} from "lucide-react";

interface ExpenseRecord {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: string;
  status: string;
  submittedBy: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-orange-50 text-orange-600",
    Approved: "bg-blue-50 text-blue-600",
    Reimbursed: "bg-green-50 text-green-600",
    Rejected: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function CategoryPill({ category }: { category: string }) {
  const styles: Record<string, string> = {
    Travel: "bg-indigo-50 text-indigo-600",
    Meals: "bg-amber-50 text-amber-600",
    "Office Supplies": "bg-cyan-50 text-cyan-600",
    Software: "bg-purple-50 text-purple-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[category] || "bg-gray-100 text-gray-600"}`}>
      {category}
    </span>
  );
}

function formatAmount(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹ ${(val / 1000).toFixed(1)}K`;
  return `₹ ${val.toFixed(0)}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TrailDashboard() {
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split("T")[0], merchant: "", category: "Travel", amount: "", status: "Pending", submittedBy: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to log expense");
        return;
      }
      setShowModal(false);
      setFormData({ date: new Date().toISOString().split("T")[0], merchant: "", category: "Travel", amount: "", status: "Pending", submittedBy: "" });
      await fetchExpenses();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = expenses.filter(
    (e) =>
      e.merchant.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.submittedBy.toLowerCase().includes(search.toLowerCase())
  );

  const pendingAmount = expenses.filter((e) => e.status === "Pending").reduce((s, e) => s + parseFloat(e.amount), 0);
  const reimbursedAmount = expenses.filter((e) => e.status === "Reimbursed").reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalSpend = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const rejectedCount = expenses.filter((e) => e.status === "Rejected").length;

  const metrics = [
    { label: "Pending Approval", value: formatCurrency(pendingAmount), icon: Clock, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Total Spend (MTD)", value: formatCurrency(totalSpend), icon: CircleDollarSign, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Total Reimbursed", value: formatCurrency(reimbursedAmount), icon: CheckCircle2, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Rejected Claims", value: rejectedCount.toString(), icon: AlertOctagon, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trail Expenses</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track reimbursements and corporate spending</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
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

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by merchant, category, or submitter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading expenses...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted By</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No expenses found</td></tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{exp.merchant}</td>
                    <td className="px-5 py-4"><CategoryPill category={exp.category} /></td>
                    <td className="px-5 py-4 text-sm text-gray-600">{exp.submittedBy}</td>
                    <td className="px-5 py-4"><StatusPill status={exp.status} /></td>
                    <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">{formatAmount(exp.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Merchant</label>
                <input type="text" required value={formData.merchant} onChange={(e) => setFormData({ ...formData, merchant: e.target.value })} placeholder="e.g., Taj Hotels - Bangalore" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Submitted By</label>
                <input type="text" required value={formData.submittedBy} onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })} placeholder="e.g., Aarav Mehta" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Software">Software</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Reimbursed">Reimbursed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g., 12500" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Logging..." : "Log Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
