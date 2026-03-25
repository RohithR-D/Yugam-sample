import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldCheck,
  Users,
  DoorOpen,
  AlertTriangle,
  UserPlus,
  Clock,
  X,
  Plus,
  Briefcase,
  Package,
  UserCheck,
} from "lucide-react";

interface VisitorRecord {
  id: number;
  visitorName: string;
  purpose: string;
  hostName: string;
  status: string;
  checkInTime: string;
  checkOutTime: string | null;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "On Premises": "bg-green-50 text-green-600",
    "Checked Out": "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function PurposeIcon({ purpose }: { purpose: string }) {
  if (purpose === "Delivery") return <Package className="w-5 h-5 text-orange-500" />;
  if (purpose === "Interview") return <UserCheck className="w-5 h-5 text-purple-500" />;
  return <Briefcase className="w-5 h-5 text-blue-500" />;
}

function PurposePill({ purpose }: { purpose: string }) {
  const styles: Record<string, string> = {
    "Client Meeting": "bg-blue-50 text-blue-600",
    Delivery: "bg-orange-50 text-orange-600",
    Interview: "bg-purple-50 text-purple-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[purpose] || "bg-gray-100 text-gray-600"}`}>
      {purpose}
    </span>
  );
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function GateDashboard() {
  const [search, setSearch] = useState("");
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ visitorName: "", purpose: "Client Meeting", hostName: "", status: "On Premises" as string, checkInTime: new Date().toISOString().slice(0, 16) });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch("/api/visitors");
      if (res.ok) setVisitors(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, checkOutTime: formData.status === "Checked Out" ? new Date().toISOString() : null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to log visitor");
        return;
      }
      setShowModal(false);
      setFormData({ visitorName: "", purpose: "Client Meeting", hostName: "", status: "On Premises", checkInTime: new Date().toISOString().slice(0, 16) });
      await fetchVisitors();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = visitors.filter(
    (v) =>
      v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      v.purpose.toLowerCase().includes(search.toLowerCase()) ||
      v.hostName.toLowerCase().includes(search.toLowerCase())
  );

  const onPremises = visitors.filter((v) => v.status === "On Premises").length;
  const checkedOut = visitors.filter((v) => v.status === "Checked Out").length;
  const today = new Date().toDateString();
  const todayCount = visitors.filter((v) => new Date(v.checkInTime).toDateString() === today).length;
  const totalVisitors = visitors.length;

  const metrics = [
    { label: "On Premises", value: onPremises.toString(), icon: Users, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Checked Out", value: checkedOut.toString(), icon: DoorOpen, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Visitors Today", value: todayCount.toString(), icon: ShieldCheck, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Total Logged", value: totalVisitors.toString(), icon: AlertTriangle, iconColor: "text-purple-500", ringColor: "border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Security</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage visitor logs, vehicle entry, and physical access</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Visitor
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
          placeholder="Search by visitor, purpose, or host..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading visitor log...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visitor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Host</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No visitors found</td></tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${v.purpose === "Delivery" ? "bg-orange-50" : v.purpose === "Interview" ? "bg-purple-50" : "bg-blue-50"}`}>
                          <PurposeIcon purpose={v.purpose} />
                        </div>
                        <span className="font-medium text-gray-800">{v.visitorName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><PurposePill purpose={v.purpose} /></td>
                    <td className="px-5 py-4 text-sm text-gray-600">{v.hostName}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(v.checkInTime)} {formatTime(v.checkInTime)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {v.checkOutTime ? `${formatDate(v.checkOutTime)} ${formatTime(v.checkOutTime)}` : "—"}
                    </td>
                    <td className="px-5 py-4"><StatusPill status={v.status} /></td>
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
              <h2 className="text-lg font-bold text-gray-900">Log Visitor</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Visitor Name</label>
                <input type="text" required value={formData.visitorName} onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })} placeholder="e.g., Rahul Kapoor" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Host Name</label>
                <input type="text" required value={formData.hostName} onChange={(e) => setFormData({ ...formData, hostName: e.target.value })} placeholder="e.g., Arjun Nair" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Purpose</label>
                  <select value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="On Premises">On Premises</option>
                    <option value="Checked Out">Checked Out</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Check-In Time</label>
                <input type="datetime-local" required value={formData.checkInTime} onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Logging..." : "Log Visitor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
