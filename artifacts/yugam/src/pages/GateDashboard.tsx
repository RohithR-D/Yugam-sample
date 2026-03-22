import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldPlus,
  ShieldCheck,
  Users,
  Fingerprint,
  AlertTriangle,
  KeyRound,
  Lock,
  Power,
  X,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
  createdAt: string | null;
}

const roleStyles: Record<string, string> = {
  Admin: "bg-red-50 text-red-600",
  Manager: "bg-blue-50 text-blue-600",
  Employee: "bg-gray-100 text-gray-600",
  Viewer: "bg-purple-50 text-purple-600",
};

const avatarGradients = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-teal-600",
  "from-yellow-500 to-amber-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const logDotColors: Record<string, string> = {
  warning: "bg-yellow-400",
  error: "bg-red-400",
  success: "bg-green-400",
  info: "bg-blue-400",
};

const auditLog = [
  { time: "10:42 AM", event: "Admin changed Fleet module permissions for Manager role", type: "warning" },
  { time: "10:15 AM", event: "Failed login attempt from IP: 192.168.1.47 (blocked)", type: "error" },
  { time: "09:58 AM", event: "MFA enabled for user meera.joshi@edecs.com", type: "success" },
  { time: "09:30 AM", event: "New user divya.rao@edecs.com provisioned by Admin", type: "info" },
];

export default function GateDashboard() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Employee" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create user");
        return;
      }
      setShowModal(false);
      setFormData({ name: "", email: "", role: "Employee" });
      await fetchUsers();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const metrics = [
    { label: "Active Users", value: String(users.length), icon: Users, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Security Score", value: "94%", icon: ShieldCheck, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "MFA Adoption", value: "87%", icon: Fingerprint, iconColor: "text-purple-500", ringColor: "border-purple-200" },
    { label: "Flagged Attempts", value: "12", icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Security</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage user permissions, authentication, and system logs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <ShieldPlus className="w-4 h-4" />
          New User
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
          placeholder="Search users or roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No users found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(u.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {getInitials(u.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                </div>
              </div>

              <div className="min-w-[100px] text-center">
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${roleStyles[u.role] || "bg-gray-100 text-gray-600"}`}>
                  {u.role}
                </span>
              </div>

              <div className="min-w-[120px] text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Last Login</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{timeAgo(u.lastLogin)}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Permissions">
                  <KeyRound className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="Reset Password">
                  <Lock className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Deactivate">
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Recent Activity Log</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {auditLog.map((log, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${logDotColors[log.type]}`} />
              <span className="text-xs font-mono text-gray-400 shrink-0 w-16">{log.time}</span>
              <p className="text-sm text-gray-600">{log.event}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., priya.sharma@edecs.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
