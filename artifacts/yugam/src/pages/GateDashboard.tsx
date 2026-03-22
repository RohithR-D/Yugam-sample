import { useState } from "react";
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
} from "lucide-react";

const metrics = [
  { label: "Active Users", value: "142", icon: Users, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Security Score", value: "94%", icon: ShieldCheck, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "MFA Adoption", value: "87%", icon: Fingerprint, iconColor: "text-purple-500", ringColor: "border-purple-200" },
  { label: "Flagged Attempts", value: "12", icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
];

type Role = "Admin" | "Manager" | "Employee" | "Viewer";

interface UserEntry {
  name: string;
  email: string;
  initials: string;
  gradient: string;
  role: Role;
  lastActive: string;
}

const users: UserEntry[] = [
  { name: "Arjun Nair", email: "arjun.nair@edecs.com", initials: "AN", gradient: "from-red-500 to-rose-600", role: "Admin", lastActive: "2 mins ago" },
  { name: "Meera Joshi", email: "meera.joshi@edecs.com", initials: "MJ", gradient: "from-blue-500 to-indigo-600", role: "Manager", lastActive: "18 mins ago" },
  { name: "Suresh Patel", email: "suresh.patel@edecs.com", initials: "SP", gradient: "from-emerald-500 to-green-600", role: "Employee", lastActive: "1 hour ago" },
  { name: "Divya Rao", email: "divya.rao@edecs.com", initials: "DR", gradient: "from-amber-500 to-orange-600", role: "Viewer", lastActive: "3 hours ago" },
];

const auditLog = [
  { time: "10:42 AM", event: "Admin changed Fleet module permissions for Manager role", type: "warning" },
  { time: "10:15 AM", event: "Failed login attempt from IP: 192.168.1.47 (blocked)", type: "error" },
  { time: "09:58 AM", event: "MFA enabled for user meera.joshi@edecs.com", type: "success" },
  { time: "09:30 AM", event: "New user divya.rao@edecs.com provisioned by Admin", type: "info" },
];

const roleStyles: Record<Role, string> = {
  Admin: "bg-red-50 text-red-600",
  Manager: "bg-blue-50 text-blue-600",
  Employee: "bg-gray-100 text-gray-600",
  Viewer: "bg-purple-50 text-purple-600",
};

const logDotColors: Record<string, string> = {
  warning: "bg-yellow-400",
  error: "bg-red-400",
  success: "bg-green-400",
  info: "bg-blue-400",
};

export default function GateDashboard() {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Security</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage user permissions, authentication, and system logs</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
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

      <div className="flex flex-col gap-4">
        {filtered.map((u) => (
          <div
            key={u.email}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${u.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {u.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
              </div>
            </div>

            <div className="min-w-[100px] text-center">
              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${roleStyles[u.role]}`}>
                {u.role}
              </span>
            </div>

            <div className="min-w-[120px] text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Last Login</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{u.lastActive}</p>
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
    </div>
  );
}
