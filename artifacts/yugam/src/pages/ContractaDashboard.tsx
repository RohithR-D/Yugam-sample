import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Eye,
  Download,
  Scale,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  X,
  Plus,
} from "lucide-react";

interface ContractRecord {
  id: number;
  title: string;
  partyName: string;
  type: string;
  status: string;
  expiryDate: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-50 text-green-600",
    "Expiring Soon": "bg-orange-50 text-orange-600",
    Expired: "bg-gray-100 text-gray-500",
    Terminated: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const styles: Record<string, string> = {
    NDA: "bg-purple-50 text-purple-600",
    "Vendor Agreement": "bg-blue-50 text-blue-600",
    "Client Contract": "bg-teal-50 text-teal-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ContractaDashboard() {
  const [search, setSearch] = useState("");
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", partyName: "", type: "NDA", status: "Active", expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) setContracts(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create contract");
        return;
      }
      setShowModal(false);
      setFormData({ title: "", partyName: "", type: "NDA", status: "Active", expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] });
      await fetchContracts();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.partyName.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = contracts.filter((c) => c.status === "Active").length;
  const expiringSoonCount = contracts.filter((c) => c.status === "Expiring Soon").length;
  const expiredCount = contracts.filter((c) => c.status === "Expired" || c.status === "Terminated").length;
  const totalCount = contracts.length;

  const metrics = [
    { label: "Active Contracts", value: activeCount.toString(), icon: Scale, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Expiring Soon", value: expiringSoonCount.toString(), icon: CalendarClock, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Expired / Terminated", value: expiredCount.toString(), icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
    { label: "Total Managed", value: totalCount.toString(), icon: ShieldCheck, iconColor: "text-green-500", ringColor: "border-green-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracta Legal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage corporate agreements, NDAs, and compliance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Contract
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
          placeholder="Search by title, party, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading contracts...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No contracts found</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-800">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.partyName}</td>
                    <td className="px-5 py-4"><TypePill type={c.type} /></td>
                    <td className="px-5 py-4"><StatusPill status={c.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(c.expiryDate)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
              <h2 className="text-lg font-bold text-gray-900">New Contract</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Document Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Master Service Agreement" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Party Name</label>
                <input type="text" required value={formData.partyName} onChange={(e) => setFormData({ ...formData, partyName: e.target.value })} placeholder="e.g., TechNova Solutions" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="NDA">NDA</option>
                    <option value="Vendor Agreement">Vendor Agreement</option>
                    <option value="Client Contract">Client Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiry Date</label>
                <input type="date" required value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create Contract"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
