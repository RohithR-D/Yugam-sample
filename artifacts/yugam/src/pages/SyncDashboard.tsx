import { useState, useEffect, useCallback } from "react";
import {
  Search,
  PenSquare,
  Phone,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  MessagesSquare,
} from "lucide-react";

interface CommRecord {
  id: number;
  recipientName: string;
  subject: string;
  type: string;
  status: string;
  sentAt: string | null;
  createdAt: string | null;
}

function TypeIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Mail; color: string; bg: string }> = {
    Email: { icon: Mail, color: "text-blue-500", bg: "bg-blue-50" },
    SMS: { icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    Call: { icon: Phone, color: "text-violet-500", bg: "bg-violet-50" },
  };
  const c = config[type] || config.Email;
  const Icon = c.icon;
  return (
    <div className={`p-2.5 rounded-lg ${c.bg}`}>
      <Icon className={`w-5 h-5 ${c.color}`} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Sent: "bg-blue-50 text-blue-600",
    Delivered: "bg-green-50 text-green-600",
    Failed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function SyncDashboard() {
  const [search, setSearch] = useState("");
  const [comms, setComms] = useState<CommRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ recipientName: "", subject: "", type: "Email", status: "Sent" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchComms = useCallback(async () => {
    try {
      const res = await fetch("/api/communications");
      if (res.ok) setComms(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComms(); }, [fetchComms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to log communication");
        return;
      }
      setShowModal(false);
      setFormData({ recipientName: "", subject: "", type: "Email", status: "Sent" });
      await fetchComms();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = comms.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = comms.length;
  const emailCount = comms.filter((c) => c.type === "Email").length;
  const smsCount = comms.filter((c) => c.type === "SMS").length;
  const callCount = comms.filter((c) => c.type === "Call").length;

  const metrics = [
    { label: "Total Messages", value: totalCount, icon: MessagesSquare, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Emails Sent", value: emailCount, icon: Mail, iconColor: "text-indigo-500", ringColor: "border-indigo-200" },
    { label: "SMS Sent", value: smsCount, icon: MessageSquare, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Calls Logged", value: callCount, icon: Phone, iconColor: "text-violet-500", ringColor: "border-violet-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Communications</h1>
          <p className="text-sm text-gray-400 mt-0.5">Unified inbox & team chat</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Communication
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
          placeholder="Search communications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading communications...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No communications found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <TypeIcon type={c.type} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.recipientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{c.subject}</p>
                </div>
              </div>

              <div className="text-center min-w-[80px]">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  c.type === "Email" ? "bg-blue-50 text-blue-600" :
                  c.type === "SMS" ? "bg-green-50 text-green-600" :
                  "bg-violet-50 text-violet-600"
                }`}>
                  {c.type}
                </span>
              </div>

              <div className="text-center min-w-[110px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sent At</p>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{formatDateTime(c.sentAt)}</p>
              </div>

              <div className="min-w-[90px] flex justify-center">
                <StatusPill status={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Communication</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient Name</label>
                <input type="text" required value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} placeholder="e.g., Nisha Agarwal" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                <input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Follow-up on proposal" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Call">Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Sent">Sent</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Saving..." : "Log Communication"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
