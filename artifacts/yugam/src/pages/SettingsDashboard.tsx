import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  SlidersHorizontal,
  CreditCard,
  Puzzle,
  Bell,
  UsersRound,
  Upload,
  Trash2,
  Save,
  X,
  Search,
  KeyRound,
  Lock,
  Power,
  ShieldPlus,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
  createdAt: string | null;
}

const menuItems = [
  { label: "Company Profile", icon: Building2 },
  { label: "User Management", icon: UsersRound },
  { label: "Preferences", icon: SlidersHorizontal },
  { label: "Billing & Plans", icon: CreditCard },
  { label: "Integrations", icon: Puzzle },
  { label: "Notifications", icon: Bell },
];

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
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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

function Toggle({ enabled, label }: { enabled: boolean; label: string }) {
  const [on, setOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function CompanyProfileTab() {
  return (
    <>
      <div>
        <h3 className="text-base font-semibold text-gray-800">Company Logo</h3>
        <p className="text-xs text-gray-400 mt-0.5">Upload your organization logo for branding</p>
        <div className="flex items-center gap-5 mt-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E31E24] to-[#c9191f] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/20">
            E
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload New
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-6 pt-6">
        <h3 className="text-base font-semibold text-gray-800">General Information</h3>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Company Name</label>
            <input type="text" defaultValue="Edocs Inc" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Registration / Tax ID</label>
            <input type="text" defaultValue="GSTIN-22ABCD1234E1Z5" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-6 pt-6">
        <h3 className="text-base font-semibold text-gray-800">Localization</h3>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Default Currency</label>
            <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
              <option>INR - Indian Rupee</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
              <option>GBP - British Pound</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Timezone</label>
            <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
              <option>Asia/Kolkata (IST, UTC+5:30)</option>
              <option>America/New_York (EST, UTC-5)</option>
              <option>Europe/London (GMT, UTC+0)</option>
              <option>Asia/Tokyo (JST, UTC+9)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-6 pt-6">
        <h3 className="text-base font-semibold text-gray-800">Global Preferences</h3>
        <p className="text-xs text-gray-400 mt-0.5">Configure system-wide security and display settings</p>
        <div className="mt-3 divide-y divide-gray-50">
          <Toggle enabled={true} label="Force 2FA for all users" />
          <Toggle enabled={false} label="Enable Dark Mode (Beta)" />
          <Toggle enabled={true} label="Auto-lock inactive sessions (15m)" />
        </div>
      </div>
    </>
  );
}

function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Employee" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">User Management</h3>
          <p className="text-xs text-gray-400 mt-0.5">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <ShieldPlus className="w-3.5 h-3.5" />
          New User
        </button>
      </div>

      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mt-4">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="search"
          placeholder="Search users or roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:border-red-100 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(u.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(u.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                  <p className="text-[11px] text-gray-400">{u.email}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${roleStyles[u.role] || "bg-gray-100 text-gray-600"}`}>
                {u.role}
              </span>
              <div className="text-right min-w-[80px]">
                <p className="text-[10px] text-gray-400 uppercase">Last Login</p>
                <p className="text-xs text-gray-600">{timeAgo(u.lastLogin)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Permissions">
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="Reset Password">
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Deactivate">
                  <Power className="w-3.5 h-3.5" />
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
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Priya Sharma" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g., priya.sharma@edecs.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState("Company Profile");

  const renderContent = () => {
    switch (activeTab) {
      case "User Management":
        return <UserManagementTab />;
      case "Company Profile":
      default:
        return <CompanyProfileTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your enterprise workspace preferences</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="w-1/4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-red-50 text-[#E31E24]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="w-3/4 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
