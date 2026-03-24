import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  Users,
  UserCheck,
  Award,
  XCircle,
  Briefcase,
} from "lucide-react";

interface CandidateRecord {
  id: number;
  name: string;
  roleApplied: string;
  status: string;
  appliedDate: string | null;
  createdAt: string | null;
}

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-red-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-600",
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Applied: "bg-gray-100 text-gray-600",
    Interviewing: "bg-blue-50 text-blue-600",
    Offered: "bg-green-50 text-green-600",
    Rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HirePipeline() {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", roleApplied: "", status: "Applied", appliedDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("/api/candidates");
      if (res.ok) setCandidates(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: formData.name,
        roleApplied: formData.roleApplied,
        status: formData.status,
      };
      if (formData.appliedDate) payload.appliedDate = new Date(formData.appliedDate).toISOString();

      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add candidate");
        return;
      }
      setShowModal(false);
      setFormData({ name: "", roleApplied: "", status: "Applied", appliedDate: "" });
      await fetchCandidates();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.roleApplied.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = candidates.length;
  const appliedCount = candidates.filter((c) => c.status === "Applied").length;
  const interviewingCount = candidates.filter((c) => c.status === "Interviewing").length;
  const offeredCount = candidates.filter((c) => c.status === "Offered").length;

  const metrics = [
    { label: "Total Applicants", value: totalCount, icon: Users, iconColor: "text-gray-500", ringColor: "border-gray-200" },
    { label: "Applied", value: appliedCount, icon: Briefcase, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Interviewing", value: interviewingCount, icon: UserCheck, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Offered", value: offeredCount, icon: Award, iconColor: "text-green-500", ringColor: "border-green-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track applicants & manage hiring</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
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
          placeholder="Search candidates or roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading candidates...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No candidates found</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-red-100 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.roleApplied}</p>
                  <p className="text-[11px] text-gray-400 mt-2">Applied {formatDate(c.appliedDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Candidate</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Candidate Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Priya Sharma" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role Applied</label>
                <input type="text" required value={formData.roleApplied} onChange={(e) => setFormData({ ...formData, roleApplied: e.target.value })} placeholder="e.g., Senior Developer" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Applied Date</label>
                  <input type="date" value={formData.appliedDate} onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Candidate"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
