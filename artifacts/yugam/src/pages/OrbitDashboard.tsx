import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  Folder,
  UserCircle,
  Handshake,
  Trophy,
  XCircle,
  X,
  Plus,
} from "lucide-react";

interface ClientRecord {
  id: number;
  companyName: string;
  contactName: string;
  status: string;
  dealValue: string;
  createdAt: string | null;
}

type Stage = "Lead" | "Active" | "Churned";

const avatarGradients = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-red-500 to-rose-600",
  "from-indigo-500 to-violet-600",
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function formatCurrency(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toFixed(0)}`;
}

const pipelineStages = ["Lead", "Active"] as const;

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Lead: "border-blue-200 text-blue-600 bg-blue-50",
    Active: "border-green-200 text-green-600 bg-green-50",
    Churned: "border-red-200 text-red-600 bg-red-50",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "border-gray-200 text-gray-600 bg-gray-50"}`}>
      {status}
    </span>
  );
}

function PipelineTracker({ status }: { status: string }) {
  const activeIdx = status === "Churned" ? -1 : pipelineStages.indexOf(status as any);

  return (
    <div className="flex items-center w-full mt-4 mb-3">
      {pipelineStages.map((stage, i) => {
        const completed = activeIdx >= i;
        const isChurned = status === "Churned";
        const nodeColor = isChurned ? "bg-gray-200 border-gray-300" : completed ? "bg-green-500 border-green-500" : "bg-white border-gray-300";
        const textColor = isChurned ? "text-gray-400" : completed ? "text-green-600" : "text-gray-400";
        const checkColor = completed && !isChurned;

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {checkColor && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${textColor}`}>{stage}</span>
            </div>
            {i < pipelineStages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${activeIdx > i && !isChurned ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrbitDashboard() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: "", contactName: "", status: "Lead", dealValue: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      const res = await authFetch("/api/clients");
      if (res.ok) setClients(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, dealValue: formData.dealValue || "0" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create client");
        return;
      }
      setShowModal(false);
      setFormData({ companyName: "", contactName: "", status: "Lead", dealValue: "" });
      await fetchClients();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const leadCount = clients.filter((c) => c.status === "Lead").length;
  const activeCount = clients.filter((c) => c.status === "Active").length;
  const churnedCount = clients.filter((c) => c.status === "Churned").length;

  const metrics = [
    { label: "Lead", value: leadCount, icon: UserCircle, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Active", value: activeCount, icon: Handshake, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Total Clients", value: clients.length, icon: Trophy, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Churned", value: churnedCount, icon: XCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orbit CRM</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sales pipeline & client directory</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Client
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
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No clients found</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filtered.map((client) => (
            <div key={client.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(client.companyName)} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                    {getInitials(client.companyName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{client.companyName}</p>
                    <p className="text-xs text-gray-400">{client.contactName}</p>
                  </div>
                </div>
                <StatusPill status={client.status} />
              </div>

              <PipelineTracker status={client.status} />

              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deal Value</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{formatCurrency(client.dealValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{client.status}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button className="text-xs font-medium text-[#E31E24] hover:text-[#c9191f] transition-colors">
                  Profile →
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
              <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Company Name</label>
                <input type="text" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="e.g., Acme Corp" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact Name</label>
                <input type="text" required value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="e.g., Priya Sharma" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Churned">Churned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Deal Value (₹)</label>
                <input type="number" value={formData.dealValue} onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })} placeholder="e.g., 500000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
