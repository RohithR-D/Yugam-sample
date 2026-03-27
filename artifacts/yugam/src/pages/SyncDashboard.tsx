import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  Send,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  X,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Users,
  Building,
  Truck,
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
} from "lucide-react";

type SyncSub = "Chats" | "Calls" | "Meetings";

interface ChatMsg {
  id: number;
  threadType: string;
  employeeId: number | null;
  senderName: string;
  messageBody: string;
  timestamp: string | null;
}

interface CallLog {
  id: number;
  loggedByEmployee: string;
  clientName: string;
  callType: string;
  durationMinutes: number;
  callDate: string | null;
  callOutcome: string;
  detailedNotes: string;
  createdAt: string | null;
}

interface Meeting {
  id: number;
  loggedByEmployee: string;
  clientName: string;
  meetingTitle: string;
  meetingDate: string | null;
  startTime: string;
  endTime: string;
  attendees: string;
  agendaAndMinutes: string;
  status: string;
  createdAt: string | null;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status, type }: { status: string; type?: "call" | "meeting" }) {
  const styles: Record<string, string> = {
    Interested: "bg-green-50 text-green-600 border-green-200",
    "Follow-up": "bg-amber-50 text-amber-600 border-amber-200",
    "Not Interested": "bg-red-50 text-red-500 border-red-200",
    "Issue Resolved": "bg-blue-50 text-blue-600 border-blue-200",
    Scheduled: "bg-blue-50 text-blue-600 border-blue-200",
    Completed: "bg-green-50 text-green-600 border-green-200",
    Canceled: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

export default function SyncDashboard() {
  const { activeModule } = useModule();
  const sub: SyncSub = (activeModule.replace("Sync:", "") || "Chats") as SyncSub;

  return (
    <div className="h-full">
      {sub === "Chats" && <ChatsView />}
      {sub === "Calls" && <CallsView />}
      {sub === "Meetings" && <MeetingsView />}
    </div>
  );
}

function ChatsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Internal" | "Client" | "Supplier">("Internal");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await authFetch(`/api/chat-messages?threadType=${activeTab}`);
      if (res.ok) setMessages(await res.json());
    } catch {} finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetchMessages(); }, [fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    await authFetch("/api/chat-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadType: activeTab,
        senderName: user?.name || user?.email || "Admin",
        messageBody: newMsg.trim(),
      }),
    });
    setNewMsg("");
    await fetchMessages();
  };

  const tabs = [
    { key: "Internal" as const, label: "Internal", icon: Users, color: "text-blue-600 bg-blue-50" },
    { key: "Client" as const, label: "Client", icon: Building, color: "text-green-600 bg-green-50" },
    { key: "Supplier" as const, label: "Supplier", icon: Truck, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="w-[280px] border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Conversations</h2>
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-[#E31E24]/10 text-[#E31E24] ring-1 ring-[#E31E24]/20"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-[#E31E24]/5 border border-[#E31E24]/10`}>
              <div className="w-9 h-9 rounded-full bg-[#E31E24] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {activeTab[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{activeTab} Channel</p>
                <p className="text-[10px] text-gray-400 truncate">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{activeTab} Channel</p>
            <p className="text-[10px] text-gray-400">Team communication</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/30">
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.senderName === (user?.name || user?.email || "Admin");
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${isCurrentUser ? "order-1" : ""}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "justify-end" : ""}`}>
                      <span className="text-[10px] font-semibold text-gray-500">{msg.senderName}</span>
                      <span className="text-[9px] text-gray-300">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isCurrentUser
                        ? "bg-[#E31E24] text-white rounded-br-md"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                    }`}>
                      {msg.messageBody}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message ${activeTab.toLowerCase()} channel...`}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim()}
              className="w-10 h-10 rounded-full bg-[#E31E24] text-white flex items-center justify-center hover:bg-[#c9191f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/15"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CallsView() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await authFetch("/api/call-logs");
      if (res.ok) setLogs(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) =>
      l.clientName.toLowerCase().includes(q) ||
      l.loggedByEmployee.toLowerCase().includes(q) ||
      l.callOutcome.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Employee call activity tracker</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Phone className="w-4 h-4" /> Log a Call
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Search calls..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
          <Phone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No call logs yet. Start logging calls!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                <th className="px-4 py-3 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(log.callDate)}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{log.loggedByEmployee}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{log.clientName}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${log.callType === "Inbound" ? "text-green-600" : "text-blue-600"}`}>
                      {log.callType === "Inbound" ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />}
                      {log.callType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{log.durationMinutes} min</span>
                  </td>
                  <td className="px-4 py-3.5 text-center"><StatusPill status={log.callOutcome} type="call" /></td>
                  <td className="px-4 py-3.5">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <LogCallModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLogs(); }}
        />
      )}

      {selectedLog && (
        <CallDetailDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

function LogCallModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    loggedByEmployee: "",
    clientName: "",
    callType: "Outbound",
    durationMinutes: "",
    callDate: new Date().toISOString().split("T")[0],
    callOutcome: "Follow-up",
    detailedNotes: "",
  });

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.loggedByEmployee.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: parseInt(form.durationMinutes) || 0,
          callDate: form.callDate ? new Date(form.callDate).toISOString() : null,
        }),
      });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#E31E24]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Log a Call</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By Employee</label>
              <input type="text" value={form.loggedByEmployee} onChange={(e) => setForm({ ...form, loggedByEmployee: e.target.value })} placeholder="Employee name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client name" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Call Type</label>
              <select value={form.callType} onChange={(e) => setForm({ ...form, callType: e.target.value })} className={inputCls + " cursor-pointer"}>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} placeholder="15" className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Call Date</label>
              <input type="date" value={form.callDate} onChange={(e) => setForm({ ...form, callDate: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Call Outcome</label>
            <select value={form.callOutcome} onChange={(e) => setForm({ ...form, callOutcome: e.target.value })} className={inputCls + " cursor-pointer"}>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Issue Resolved">Issue Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Call Notes / Summary</label>
            <textarea rows={5} value={form.detailedNotes} onChange={(e) => setForm({ ...form, detailedNotes: e.target.value })} placeholder="Enter detailed notes about the call..." className={inputCls + " resize-none"} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.clientName.trim() || !form.loggedByEmployee.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Plus className="w-4 h-4" /> Log Call
          </button>
        </div>
      </div>
    </div>
  );
}

function CallDetailDrawer({ log, onClose }: { log: CallLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div className="relative w-[440px] bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Call Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{log.clientName}</p>
              <p className="text-xs text-gray-400">Logged by {log.loggedByEmployee}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Type</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${log.callType === "Inbound" ? "text-green-600" : "text-blue-600"}`}>
                {log.callType === "Inbound" ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                {log.callType}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Duration</p>
              <p className="text-sm font-medium text-gray-800">{log.durationMinutes} minutes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Date</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(log.callDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Outcome</p>
              <StatusPill status={log.callOutcome} type="call" />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Detailed Notes</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
              {log.detailedNotes || <span className="text-gray-300 italic">No notes recorded</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingsView() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await authFetch("/api/meetings");
      if (res.ok) setMeetings(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const meetingDatesSet = useMemo(() => {
    const s = new Set<string>();
    meetings.forEach((m) => {
      if (m.meetingDate) {
        const d = new Date(m.meetingDate);
        s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return s;
  }, [meetings]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const hasEvent = (day: number) => meetingDatesSet.has(`${year}-${month}-${day}`);

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(b.meetingDate || "").getTime() - new Date(a.meetingDate || "").getTime());
  }, [meetings]);

  const upcomingMeetings = sortedMeetings.filter((m) => m.status === "Scheduled");
  const pastMeetings = sortedMeetings.filter((m) => m.status !== "Scheduled");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Schedule and log team meetings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Calendar className="w-4 h-4" /> Log / Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-800">{monthName}</span>
            <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="aspect-square flex items-center justify-center relative">
                  {day !== null ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      isToday(day) ? "bg-[#E31E24] text-white font-bold" : "text-gray-600 hover:bg-gray-100"
                    }`}>
                      {day}
                      {hasEvent(day) && !isToday(day) && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#E31E24]" />
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <>
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Upcoming / Scheduled ({upcomingMeetings.length})</h3>
                </div>
                {upcomingMeetings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No upcoming meetings</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcomingMeetings.map((m) => (
                      <MeetingRow key={m.id} meeting={m} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Past / Completed ({pastMeetings.length})</h3>
                </div>
                {pastMeetings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No past meetings</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pastMeetings.slice(0, 10).map((m) => (
                      <MeetingRow key={m.id} meeting={m} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <LogMeetingModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchMeetings(); }}
        />
      )}
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const statusIcon = {
    Scheduled: <CalendarDays className="w-4 h-4 text-blue-500" />,
    Completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    Canceled: <XCircle className="w-4 h-4 text-gray-400" />,
  }[meeting.status] || <AlertCircle className="w-4 h-4 text-gray-400" />;

  return (
    <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
      <div className="shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{meeting.meetingTitle}</p>
        <p className="text-xs text-gray-400 truncate">
          {meeting.clientName} {meeting.attendees ? `· ${meeting.attendees}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-gray-700">{formatDate(meeting.meetingDate)}</p>
        <p className="text-[10px] text-gray-400">{meeting.startTime} – {meeting.endTime}</p>
      </div>
      <StatusPill status={meeting.status} type="meeting" />
    </div>
  );
}

function LogMeetingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    loggedByEmployee: "",
    clientName: "",
    meetingTitle: "",
    meetingDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    attendees: "",
    agendaAndMinutes: "",
    status: "Scheduled",
  });

  const handleSave = async () => {
    if (!form.meetingTitle.trim() || !form.loggedByEmployee.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          meetingDate: form.meetingDate ? new Date(form.meetingDate).toISOString() : null,
        }),
      });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#E31E24]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Log / Schedule Meeting</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Meeting Title</label>
            <input type="text" value={form.meetingTitle} onChange={(e) => setForm({ ...form, meetingTitle: e.target.value })} placeholder="e.g. Q2 Planning Review" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By Employee</label>
              <input type="text" value={form.loggedByEmployee} onChange={(e) => setForm({ ...form, loggedByEmployee: e.target.value })} placeholder="Employee name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client name" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
              <input type="date" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Attendees</label>
            <input type="text" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="e.g. John, Sarah, Client Team" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Agenda / Meeting Minutes</label>
            <textarea rows={5} value={form.agendaAndMinutes} onChange={(e) => setForm({ ...form, agendaAndMinutes: e.target.value })} placeholder="Enter agenda items or meeting minutes..." className={inputCls + " resize-none"} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.meetingTitle.trim() || !form.loggedByEmployee.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Plus className="w-4 h-4" /> Save Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
