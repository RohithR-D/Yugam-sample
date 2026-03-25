import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Plus,
  BarChart3,
  CalendarDays,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TransactionRecord {
  id: number;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: string;
  createdAt: string | null;
}

function CategoryPill({ category }: { category: string }) {
  const styles: Record<string, string> = {
    Sales: "bg-green-50 text-green-600",
    Procurement: "bg-orange-50 text-orange-600",
    Payroll: "bg-purple-50 text-purple-600",
    Taxes: "bg-teal-50 text-teal-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[category] || "bg-gray-100 text-gray-600"}`}>
      {category}
    </span>
  );
}

function formatCurrency(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹ 0";
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toFixed(0)}`;
}

function formatAmount(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LedgerDashboard() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split("T")[0], description: "", category: "Sales", type: "Credit", amount: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchTransactions = useCallback(async (p: number = page) => {
    try {
      const res = await authFetch(`${import.meta.env.BASE_URL}api/transactions?page=${p}&limit=${pageSize}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data);
        setTotalCount(json.totalCount);
        setTotalPages(json.totalPages);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTransactions(page); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch(`${import.meta.env.BASE_URL}api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create transaction");
        return;
      }
      setShowModal(false);
      setFormData({ date: new Date().toISOString().split("T")[0], description: "", category: "Sales", type: "Credit", amount: "" });
      setPage(1);
      await fetchTransactions(1);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredits = transactions.filter((t) => t.type === "Credit").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalDebits = transactions.filter((t) => t.type === "Debit").reduce((s, t) => s + parseFloat(t.amount), 0);
  const netPL = totalCredits - totalDebits;

  const metrics = [
    { label: "Total Credits", value: formatCurrency(totalCredits), icon: ArrowUpCircle, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Total Debits", value: formatCurrency(totalDebits), icon: ArrowDownCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
    { label: "Monthly P&L", value: `${netPL >= 0 ? "" : "-"}${formatCurrency(Math.abs(netPL))}`, icon: BarChart3, iconColor: netPL >= 0 ? "text-emerald-500" : "text-red-500", ringColor: netPL >= 0 ? "border-emerald-200" : "border-red-200" },
    { label: "Total Records", value: totalCount.toString(), icon: CalendarDays, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  ];

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

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
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
          >
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

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search transactions or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading transactions...</div>
      ) : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No transactions found</td></tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{txn.description}</td>
                    <td className="px-5 py-4"><CategoryPill category={txn.category} /></td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${txn.type === "Debit" ? "text-red-500" : "text-green-600"}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-800 whitespace-nowrap">{formatAmount(txn.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{startRecord}</span> to <span className="font-medium text-gray-600">{endRecord}</span> of <span className="font-medium text-gray-600">{totalCount}</span> transactions
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? "bg-[#E31E24] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Transaction</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Client Invoice - Acme Corp" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Sales">Sales</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Taxes">Taxes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g., 250000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Transaction"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
