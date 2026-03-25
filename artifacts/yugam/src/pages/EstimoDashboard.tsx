import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Download,
  Mail,
  FileText,
  FileClock,
  Send,
  FileCheck2,
  FileX2,
  Plus,
  X,
} from "lucide-react";

interface QuoteRecord {
  id: number;
  clientName: string;
  quoteNumber: string;
  totalAmount: string;
  status: string;
  issueDate: string | null;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Sent: "bg-blue-50 text-blue-600",
    Accepted: "bg-green-50 text-green-600",
    Rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatCurrency(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toFixed(0)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EstimoDashboard() {
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", quoteNumber: "", totalAmount: "", status: "Draft", issueDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await authFetch("/api/quotes");
      if (res.ok) setQuotes(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        clientName: formData.clientName,
        quoteNumber: formData.quoteNumber,
        totalAmount: formData.totalAmount || "0",
        status: formData.status,
      };
      if (formData.issueDate) payload.issueDate = new Date(formData.issueDate).toISOString();

      const res = await authFetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create quote");
        return;
      }
      setShowModal(false);
      setFormData({ clientName: "", quoteNumber: "", totalAmount: "", status: "Draft", issueDate: "" });
      await fetchQuotes();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = quotes.filter(
    (q) =>
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase())
  );

  const draftCount = quotes.filter((q) => q.status === "Draft").length;
  const sentCount = quotes.filter((q) => q.status === "Sent").length;
  const acceptedCount = quotes.filter((q) => q.status === "Accepted").length;
  const rejectedCount = quotes.filter((q) => q.status === "Rejected").length;

  const metrics = [
    { label: "Drafts", value: draftCount, icon: FileClock, iconColor: "text-gray-500", ringColor: "border-gray-200" },
    { label: "Sent", value: sentCount, icon: Send, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Accepted", value: acceptedCount, icon: FileCheck2, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Rejected", value: rejectedCount, icon: FileX2, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimo Quotes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create & manage client proposals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Quote
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
          placeholder="Search quotes or clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading quotes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No quotes found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono">{q.quoteNumber}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{q.clientName}</p>
                </div>
              </div>

              <div className="text-center min-w-[100px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Value</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{formatCurrency(q.totalAmount)}</p>
              </div>

              <div className="text-center min-w-[110px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Issue Date</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatDate(q.issueDate)}</p>
              </div>

              <div className="min-w-[90px] flex justify-center">
                <StatusPill status={q.status} />
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create New Quote</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label>
                <input type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="e.g., Acme Corp" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Quote Number</label>
                <input type="text" required value={formData.quoteNumber} onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })} placeholder="e.g., EST-1007" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Amount (₹)</label>
                  <input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="e.g., 500000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Issue Date</label>
                <input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create Quote"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
