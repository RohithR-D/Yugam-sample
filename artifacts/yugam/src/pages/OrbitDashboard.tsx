import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Mail,
  Phone,
  UserCircle,
  Handshake,
  Trophy,
  XCircle,
  X,
  Plus,
  Building2,
  Users,
  LayoutGrid,
  List,
  Contact,
  ArrowLeft,
  Clock,
  PhoneCall,
  MessageSquare,
  CalendarCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Send,
} from "lucide-react";

interface ContactRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  contactType: string;
  clientId: number | null;
  createdAt: string | null;
  companyName?: string | null;
}

interface ActivityRecord {
  id: number;
  clientId: number;
  activityType: string;
  notes: string;
  createdAt: string | null;
}

interface ClientRecord {
  id: number;
  companyName: string;
  contactName: string;
  industry: string;
  status: string;
  pipelineStatus: string;
  dealValue: string;
  createdAt: string | null;
  contacts: ContactRecord[];
  activities: ActivityRecord[];
}

type TabType = "pipeline" | "clients" | "contacts";

const PIPELINE_STAGES = ["Lead", "Contacted", "Proposal", "Won", "Lost"] as const;

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Lead: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  Contacted: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  Proposal: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  Won: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" },
  Lost: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

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
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toFixed(0)}`;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const ACTIVITY_ICONS: Record<string, typeof PhoneCall> = {
  Call: PhoneCall,
  Email: MessageSquare,
  Meeting: CalendarCheck,
  Note: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  Call: "bg-green-50 text-green-600",
  Email: "bg-blue-50 text-blue-600",
  Meeting: "bg-purple-50 text-purple-600",
  Note: "bg-orange-50 text-orange-600",
};

function PipelineKanban({ clients, onDragUpdate, onClientClick }: {
  clients: ClientRecord[];
  onDragUpdate: (clientId: number, newStatus: string) => void;
  onClientClick: (client: ClientRecord) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageClients = clients.filter((c) => c.pipelineStatus === stage);
        const colors = STAGE_COLORS[stage];
        const stageTotal = stageClients.reduce((s, c) => s + parseFloat(c.dealValue || "0"), 0);

        return (
          <div
            key={stage}
            className={`flex-1 min-w-[220px] rounded-xl border ${dragOverStage === stage ? "border-[#E31E24] bg-red-50/30" : "border-gray-200 bg-gray-50/50"} transition-colors`}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (draggedId !== null) {
                onDragUpdate(draggedId, stage);
                setDraggedId(null);
              }
            }}
          >
            <div className={`px-4 py-3 border-b ${colors.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className={`text-sm font-semibold ${colors.text}`}>{stage}</span>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 border border-gray-100">{stageClients.length}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">{formatCurrency(stageTotal.toString())}</span>
            </div>

            <div className="p-3 space-y-3 min-h-[200px]">
              {stageClients.map((client) => (
                <div
                  key={client.id}
                  draggable
                  onDragStart={() => setDraggedId(client.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverStage(null); }}
                  className={`bg-white rounded-lg border border-gray-100 p-3.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedId === client.id ? "opacity-50 scale-95" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <div
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${getGradient(client.companyName)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                    >
                      {getInitials(client.companyName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-[#E31E24] transition-colors"
                        onClick={() => onClientClick(client)}
                      >
                        {client.companyName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{client.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(client.dealValue)}</span>
                    <span className="text-[10px] text-gray-400">{client.contacts.length} contacts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClientsDirectory({ clients, onClientClick, page, totalPages, onPageChange }: {
  clients: ClientRecord[];
  onClientClick: (client: ClientRecord) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipeline</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Value</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacts</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-gray-400">No clients found</td></tr>
          ) : (
            clients.map((c) => {
              const colors = STAGE_COLORS[c.pipelineStatus] || STAGE_COLORS["Lead"];
              return (
                <tr
                  key={c.id}
                  className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onClientClick(c)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(c.companyName)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(c.companyName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{c.companyName}</p>
                        <p className="text-xs text-gray-400">{c.contactName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{c.industry}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colors.border} ${colors.text} ${colors.bg}`}>
                      {c.pipelineStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-800">{formatCurrency(c.dealValue)}</td>
                  <td className="px-5 py-4 text-gray-500">{c.contacts.length}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactsDirectory() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<{ id: number; companyName: string }[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", contactType: "Client Employee", clientId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const res = await authFetch(`/api/contacts?page=${page}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.data);
        setTotalPages(data.totalPages);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page]);

  const fetchClientsForDropdown = useCallback(async () => {
    try {
      const res = await authFetch("/api/clients?limit=100");
      if (res.ok) {
        const data = await res.json();
        setClients(data.data.map((c: any) => ({ id: c.id, companyName: c.companyName })));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body: any = { name: formData.name, email: formData.email, phone: formData.phone, contactType: formData.contactType };
      if (formData.clientId) body.clientId = parseInt(formData.clientId);
      const res = await authFetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowModal(false);
      setFormData({ name: "", email: "", phone: "", contactType: "Client Employee", clientId: "" });
      await fetchContacts();
    } catch { setError("Network error"); } finally { setSubmitting(false); }
  };

  const contactTypeStyles: Record<string, string> = {
    "Client Employee": "bg-blue-50 text-blue-600 border-blue-200",
    Vendor: "bg-orange-50 text-orange-600 border-orange-200",
    Agent: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowModal(true); fetchClientsForDropdown(); }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading contacts...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No contacts found</td></tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(c.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {getInitials(c.name)}
                        </div>
                        <span className="font-medium text-gray-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{c.email}</td>
                    <td className="px-5 py-4 text-gray-500">{c.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${contactTypeStyles[c.contactType] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {c.contactType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{c.companyName || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Contact</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Priya Sharma" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="priya@acme.com" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91-9876543210" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact Type</label>
                  <select value={formData.contactType} onChange={(e) => setFormData({ ...formData, contactType: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Client Employee">Client Employee</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Company (optional)</label>
                  <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="">— None —</option>
                    {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.companyName}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ClientProfile({ client: initialClient, onBack, onUpdate }: {
  client: ClientRecord;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [client, setClient] = useState(initialClient);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("Note");
  const [submitting, setSubmitting] = useState(false);

  const refreshClient = useCallback(async () => {
    const res = await authFetch(`/api/clients/${client.id}`);
    if (res.ok) setClient(await res.json());
  }, [client.id]);

  const handleAddActivity = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      const res = await authFetch("/api/client-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, activityType: noteType, notes: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        await refreshClient();
        onUpdate();
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const colors = STAGE_COLORS[client.pipelineStatus] || STAGE_COLORS["Lead"];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E31E24] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to CRM
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getGradient(client.companyName)} flex items-center justify-center text-white text-xl font-bold shadow-md`}>
            {getInitials(client.companyName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{client.companyName}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors.border} ${colors.text} ${colors.bg}`}>
                {client.pipelineStatus}
              </span>
            </div>
            <p className="text-sm text-gray-400">{client.industry} &middot; Primary: {client.contactName}</p>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="text-xs text-gray-400">Deal Value</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(client.dealValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Contacts</p>
                <p className="text-lg font-bold text-gray-800">{client.contacts?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Activities</p>
                <p className="text-lg font-bold text-gray-800">{client.activities?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Added</p>
                <p className="text-sm font-medium text-gray-600">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Contacts ({client.contacts?.length || 0})
            </h3>
            {(!client.contacts || client.contacts.length === 0) ? (
              <p className="text-xs text-gray-400 text-center py-4">No contacts linked</p>
            ) : (
              <div className="space-y-3">
                {client.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(contact.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Activity Timeline
            </h3>

            <div className="flex items-start gap-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-[#E31E24] transition-colors">
                <option value="Note">Note</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
              </select>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddActivity(); } }}
                placeholder="Log an interaction..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] transition-colors bg-white"
              />
              <button
                onClick={handleAddActivity}
                disabled={!newNote.trim() || submitting}
                className="px-3 py-2 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {(!client.activities || client.activities.length === 0) ? (
              <p className="text-xs text-gray-400 text-center py-8">No activities yet. Log your first interaction above.</p>
            ) : (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
                {client.activities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.activityType] || FileText;
                  const colorClass = ACTIVITY_COLORS[activity.activityType] || "bg-gray-50 text-gray-600";
                  return (
                    <div key={activity.id} className="relative pb-4">
                      <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center ${colorClass} border-2 border-white shadow-sm`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="ml-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{activity.activityType}</span>
                          <span className="text-[10px] text-gray-400">{formatDateTime(activity.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.notes}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrbitDashboard() {
  const [tab, setTab] = useState<TabType>("pipeline");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [allClients, setAllClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: "", contactName: "", industry: "Technology", pipelineStatus: "Lead", dealValue: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClients = useCallback(async () => {
    try {
      const res = await authFetch(`/api/clients?page=${page}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.data);
        setAllClients(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, dealValue: formData.dealValue || "0", status: formData.pipelineStatus }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowModal(false);
      setFormData({ companyName: "", contactName: "", industry: "Technology", pipelineStatus: "Lead", dealValue: "" });
      await fetchClients();
    } catch { setError("Network error"); } finally { setSubmitting(false); }
  };

  const handlePipelineDrag = async (clientId: number, newStatus: string) => {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, pipelineStatus: newStatus } : c));
    try {
      await authFetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStatus: newStatus }),
      });
      await fetchClients();
    } catch {
      await fetchClients();
    }
  };

  const handleClientClick = (client: ClientRecord) => {
    setSelectedClient(client);
  };

  const filtered = search
    ? clients.filter((c) => c.companyName.toLowerCase().includes(search.toLowerCase()) || c.contactName.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
    : clients;

  if (selectedClient) {
    return (
      <ClientProfile
        client={selectedClient}
        onBack={() => { setSelectedClient(null); fetchClients(); }}
        onUpdate={() => fetchClients()}
      />
    );
  }

  const leadCount = allClients.filter((c) => c.pipelineStatus === "Lead" || c.pipelineStatus === "Contacted").length;
  const proposalCount = allClients.filter((c) => c.pipelineStatus === "Proposal").length;
  const wonCount = allClients.filter((c) => c.pipelineStatus === "Won").length;
  const lostCount = allClients.filter((c) => c.pipelineStatus === "Lost").length;

  const metrics = [
    { label: "Pipeline Leads", value: leadCount, icon: UserCircle, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "In Proposal", value: proposalCount, icon: Handshake, iconColor: "text-purple-500", ringColor: "border-purple-200" },
    { label: "Won Deals", value: wonCount, icon: Trophy, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Lost", value: lostCount, icon: XCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  const tabs: { key: TabType; label: string; icon: typeof Building2 }[] = [
    { key: "pipeline", label: "Pipeline", icon: LayoutGrid },
    { key: "clients", label: "Clients Directory", icon: Building2 },
    { key: "contacts", label: "Contacts Directory", icon: Contact },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orbit CRM</h1>
          <p className="text-sm text-gray-400 mt-0.5">Relational sales pipeline & client management</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Company
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

      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === t.key ? "bg-[#E31E24] text-white shadow-md" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab !== "contacts" && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">{totalCount} total</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading CRM data...</div>
      ) : (
        <>
          {tab === "pipeline" && (
            <PipelineKanban
              clients={filtered}
              onDragUpdate={handlePipelineDrag}
              onClientClick={handleClientClick}
            />
          )}

          {tab === "clients" && (
            <ClientsDirectory
              clients={filtered}
              onClientClick={handleClientClick}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}

          {tab === "contacts" && <ContactsDirectory />}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Company</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Company Name</label>
                <input type="text" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="e.g., Acme Corp" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Primary Contact</label>
                <input type="text" required value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="e.g., Priya Sharma" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Industry</label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Pipeline Stage</label>
                  <select value={formData.pipelineStatus} onChange={(e) => setFormData({ ...formData, pipelineStatus: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Deal Value (₹)</label>
                <input type="number" value={formData.dealValue} onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })} placeholder="e.g., 500000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Company"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
