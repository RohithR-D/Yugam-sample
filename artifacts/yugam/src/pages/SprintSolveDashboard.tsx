import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckSquare, Clock, AlertTriangle, Flame, CheckCircle2, Plus, X,
  LayoutDashboard, ListChecks, ClipboardList, FileCheck, Trash2,
  Search, Play, Pause, Bug, HelpCircle, Wrench, Users, Target,
  Calendar, ArrowRight, Timer, Edit2, Eye, Filter,
} from "lucide-react";

type SprintSub = "My Workspace" | "Task Boards" | "Backlog & Planning" | "Issue Desk (Tickets)" | "Timesheets";

interface TaskRecord { id: number; title: string; description: string; assignee: string; priority: string; status: string; parentProject: number | null; startDate: string | null; dueDate: string; attachments: string; reminder: string | null; createdAt: string | null; }
interface TicketRecord { id: number; ticketName: string; type: string; priority: string; status: string; parentProject: number | null; dueDate: string | null; contact: string; description: string; assignedTeam: string; assignedTo: string; attachments: string; createdAt: string | null; }
interface TimesheetRecord { id: number; userName: string; referenceType: string; referenceId: number | null; referenceLabel: string; logDate: string; startTime: string; endTime: string; totalHours: string; notes: string; createdAt: string | null; }
interface ProjectRef { id: number; projectName: string; }

const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtShortDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }

function PriorityBadge({ priority }: { priority: string }) {
  const s: Record<string, string> = { High: "bg-red-50 text-red-600 border-red-200", Medium: "bg-amber-50 text-amber-600 border-amber-200", Low: "bg-gray-50 text-gray-500 border-gray-200" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${s[priority] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{priority}</span>;
}

function StatusPill({ status, variant }: { status: string; variant?: "task" | "ticket" }) {
  const taskColors: Record<string, string> = { New: "bg-gray-50 text-gray-500", "In Progress": "bg-blue-50 text-blue-600", Review: "bg-amber-50 text-amber-600", Done: "bg-green-50 text-green-600" };
  const ticketColors: Record<string, string> = { New: "bg-gray-50 text-gray-500", Open: "bg-blue-50 text-blue-600", Pending: "bg-amber-50 text-amber-600", Closed: "bg-green-50 text-green-600" };
  const colors = variant === "ticket" ? ticketColors : taskColors;
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${colors[status] || "bg-gray-50 text-gray-500"}`}>{status}</span>;
}

function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function getGradient(name: string) {
  const g = ["from-violet-500 to-purple-600", "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-pink-500 to-rose-600", "from-amber-500 to-orange-600", "from-sky-500 to-blue-600", "from-red-500 to-rose-600"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return g[Math.abs(h) % g.length];
}

function Avatar({ name }: { name: string }) {
  if (!name) return null;
  return <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>{getInitials(name)}</div>;
}

const TEAMS = ["Engineering", "Design", "QA", "Support", "Operations", "HR"];

export default function SprintSolveDashboard() {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Sprint & Solve:", "") || "My Workspace") as SprintSub;
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [tR, tkR, tsR, pR] = await Promise.all([
        authFetch("/api/sprint/tasks"), authFetch("/api/sprint/tickets"),
        authFetch("/api/sprint/timesheets"), authFetch("/api/sprint/projects"),
      ]);
      if (tR.ok) setTasks(await tR.json());
      if (tkR.ok) setTickets(await tkR.json());
      if (tsR.ok) setTimesheets(await tsR.json());
      if (pR.ok) setProjects(await pR.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading workspace...</div>;

  switch (sub) {
    case "My Workspace": return <MyWorkspaceView tasks={tasks} tickets={tickets} projects={projects} onRefresh={fetchAll} />;
    case "Task Boards": return <TaskBoardsView tasks={tasks} projects={projects} onRefresh={fetchAll} />;
    case "Backlog & Planning": return <BacklogPlanningView tasks={tasks} projects={projects} onRefresh={fetchAll} />;
    case "Issue Desk (Tickets)": return <IssueDeskView tickets={tickets} projects={projects} onRefresh={fetchAll} />;
    case "Timesheets": return <TimesheetsView tasks={tasks} tickets={tickets} timesheets={timesheets} onRefresh={fetchAll} />;
    default: return <MyWorkspaceView tasks={tasks} tickets={tickets} projects={projects} onRefresh={fetchAll} />;
  }
}

function MyWorkspaceView({ tasks, tickets, projects, onRefresh }: { tasks: TaskRecord[]; tickets: TicketRecord[]; projects: ProjectRef[]; onRefresh: () => void }) {
  const [runningTimer, setRunningTimer] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (runningTimer === null) return;
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, [runningTimer]);

  const currentUser = "Admin";
  const activeTasks = tasks.filter(t => t.status !== "Done" && (t.assignee.toLowerCase().includes("admin") || t.assignee === currentUser || tasks.length <= 20));
  const myTickets = tickets.filter(t => t.status !== "Closed" && (t.assignedTo.toLowerCase().includes("admin") || t.assignedTo === currentUser || tickets.length <= 20));
  const fmtElapsed = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, "0")}`; };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">My Workspace</h1><p className="text-sm text-gray-400 mt-0.5">Your personalized task & ticket overview</p></div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={CheckSquare} label="Active Tasks" value={activeTasks.length} color="blue" />
        <MetricCard icon={Flame} label="High Priority" value={tasks.filter(t => t.priority === "High" && t.status !== "Done").length} color="red" />
        <MetricCard icon={FileCheck} label="Open Tickets" value={myTickets.length} color="purple" />
        <MetricCard icon={CheckCircle2} label="Completed" value={tasks.filter(t => t.status === "Done").length + tickets.filter(t => t.status === "Closed").length} color="green" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-blue-500" /> My Active Tasks</h3><span className="text-[10px] text-gray-400">{activeTasks.length} tasks</span></div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {activeTasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No active tasks</p> : activeTasks.map(t => {
              const proj = projects.find(p => p.id === t.parentProject);
              const isRunning = runningTimer === t.id;
              return (
                <div key={t.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5"><PriorityBadge priority={t.priority} /><StatusPill status={t.status} variant="task" />{proj && <span className="text-[10px] text-gray-400">{proj.projectName}</span>}</div>
                  </div>
                  <div className="text-xs text-gray-400">{fmtShortDate(t.dueDate)}</div>
                  <button
                    onClick={() => { if (isRunning) { setRunningTimer(null); setElapsed(0); } else { setRunningTimer(t.id); setElapsed(0); } }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isRunning ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                  >
                    {isRunning ? <><Pause className="w-3 h-3" /> {fmtElapsed(elapsed)}</> : <><Play className="w-3 h-3" /> Start Timer</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><FileCheck className="w-4 h-4 text-purple-500" /> My Assigned Tickets</h3><span className="text-[10px] text-gray-400">{myTickets.length} tickets</span></div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {myTickets.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No open tickets</p> : myTickets.map(tk => {
              const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = { Bug: Bug, Question: HelpCircle, Maintenance: Wrench, HR: Users };
              const TIcon = typeIcon[tk.type] || HelpCircle;
              return (
                <div key={tk.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0"><TIcon className="w-3.5 h-3.5 text-gray-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tk.ticketName}</p>
                    <div className="flex items-center gap-2 mt-0.5"><PriorityBadge priority={tk.priority} /><StatusPill status={tk.status} variant="ticket" /><span className="text-[10px] text-gray-400">{tk.type}</span></div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{fmtShortDate(tk.dueDate)}</p>
                    {tk.assignedTeam && <p className="text-[10px] text-gray-400">{tk.assignedTeam}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskBoardsView({ tasks, projects, onRefresh }: { tasks: TaskRecord[]; projects: ProjectRef[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const COLS = [
    { title: "New", color: "border-b-gray-300", bg: "bg-gray-50/50" },
    { title: "In Progress", color: "border-b-blue-400", bg: "bg-blue-50/20" },
    { title: "Review", color: "border-b-amber-400", bg: "bg-amber-50/20" },
    { title: "Done", color: "border-b-green-400", bg: "bg-green-50/20" },
  ];

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await authFetch(`/api/sprint/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Task Boards</h1><p className="text-sm text-gray-400 mt-0.5">Kanban board for active task tracking</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Task</button></div>
      <div className="grid grid-cols-4 gap-4 items-start">
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.title);
          const nextStatus: Record<string, string> = { "New": "In Progress", "In Progress": "Review", "Review": "Done" };
          return (
            <div key={col.title} className="min-h-[200px]">
              <div className={`p-3 rounded-t-xl border-b-2 ${col.color} bg-gray-50 flex items-center justify-between`}>
                <span className="text-sm font-bold text-gray-600">{col.title}</span>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-sm">{colTasks.length}</span>
              </div>
              <div className={`${col.bg} p-3 rounded-b-xl min-h-[300px] space-y-2.5`}>
                {colTasks.map(task => {
                  const proj = projects.find(p => p.id === task.parentProject);
                  return (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-2"><PriorityBadge priority={task.priority} />
                        {nextStatus[col.title] && <button onClick={() => handleStatusChange(task.id, nextStatus[col.title])} className="p-1 rounded text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title={`Move to ${nextStatus[col.title]}`}><ArrowRight className="w-3.5 h-3.5" /></button>}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
                      {proj && <p className="text-[10px] text-gray-400 mt-1.5 bg-gray-50 rounded px-1.5 py-0.5 inline-block">{proj.projectName}</p>}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">{task.assignee && <Avatar name={task.assignee} />}<span className="text-[11px] text-gray-500">{task.assignee || "Unassigned"}</span></div>
                        <div className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3" /><span className="text-[11px]">{fmtShortDate(task.dueDate)}</span></div>
                      </div>
                      <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={async () => { if (confirm("Delete task?")) { await authFetch(`/api/sprint/tasks/${task.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {showModal && <AddTaskModal projects={projects} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddTaskModal({ projects, onClose, onSaved, defaults }: { projects: ProjectRef[]; onClose: () => void; onSaved: () => void; defaults?: Partial<TaskRecord> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: defaults?.title || "", description: defaults?.description || "", assignee: defaults?.assignee || "",
    priority: defaults?.priority || "Medium", status: defaults?.status || "New",
    parentProject: defaults?.parentProject?.toString() || "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: defaults?.dueDate ? new Date(defaults.dueDate).toISOString().split("T")[0] : "",
    attachments: "", reminder: "",
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.assignee.trim() || !form.dueDate) return; setSaving(true);
    try {
      const payload: Record<string, any> = { title: form.title, description: form.description, assignee: form.assignee, priority: form.priority, status: form.status, dueDate: form.dueDate, attachments: form.attachments };
      if (form.parentProject) payload.parentProject = parseInt(form.parentProject);
      if (form.startDate) payload.startDate = form.startDate;
      if (form.reminder) payload.reminder = form.reminder;
      const res = await authFetch("/api/sprint/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Add Task" icon={CheckSquare} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Task Name</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Implement search filters" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Parent Project</label><select value={form.parentProject} onChange={e => setForm({ ...form, parentProject: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assigned To</label><input type="text" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="e.g. Priya S." className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}><option value="New">New</option><option value="In Progress">In Progress</option><option value="Review">Review</option><option value="Done">Done</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Attachments (URLs)</label><input type="text" value={form.attachments} onChange={e => setForm({ ...form, attachments: e.target.value })} placeholder="Comma-separated URLs" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reminder</label><input type="datetime-local" value={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.value })} className={inputCls} /></div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.title.trim() || !form.assignee.trim() || !form.dueDate} label="Create Task" />
    </Modal>
  );
}

function BacklogPlanningView({ tasks, projects, onRefresh }: { tasks: TaskRecord[]; projects: ProjectRef[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const backlogTasks = useMemo(() => {
    let result = tasks.filter(t => t.status === "New" || !t.assignee.trim());
    if (search) { const q = search.toLowerCase(); result = result.filter(t => t.title.toLowerCase().includes(q)); }
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);
    return result.sort((a, b) => { const pr: Record<string, number> = { High: 0, Medium: 1, Low: 2 }; return (pr[a.priority] ?? 1) - (pr[b.priority] ?? 1); });
  }, [tasks, search, priorityFilter]);

  const handleAssign = async (taskId: number, assignee: string) => {
    const val = prompt("Assign to user:", assignee || ""); if (val === null) return;
    await authFetch(`/api/sprint/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignee: val, status: val.trim() ? "In Progress" : "New" }) });
    onRefresh();
  };

  const handleSprintAssign = async (taskId: number) => {
    const sprint = prompt("Assign to sprint (e.g. Sprint 1, Sprint 2):", ""); if (sprint === null) return;
    await authFetch(`/api/sprint/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attachments: sprint }) });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Backlog & Planning</h1><p className="text-sm text-gray-400 mt-0.5">Unassigned and future tasks for sprint planning</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Task</button></div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search backlog..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"><option value="">All Priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
      </div>
      {backlogTasks.length === 0 ? <EmptyState icon={ClipboardList} text="Backlog is empty — all tasks are assigned!" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Assignee</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Sprint</th>
              <th className="px-4 py-3 w-[80px]"></th>
            </tr></thead>
            <tbody>
              {backlogTasks.map(t => {
                const proj = projects.find(p => p.id === t.parentProject);
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3"><p className="font-medium text-gray-800">{t.title}</p>{t.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{proj?.projectName || "—"}</td>
                    <td className="px-4 py-3 text-center"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3 text-center"><StatusPill status={t.status} variant="task" /></td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtShortDate(t.dueDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleAssign(t.id, t.assignee)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">{t.assignee || "Assign →"}</button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleSprintAssign(t.id)} className="text-xs text-purple-500 hover:text-purple-700 font-medium">{t.attachments || "Assign Sprint →"}</button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/sprint/tasks/${t.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <AddTaskModal projects={projects} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function IssueDeskView({ tickets, projects, onRefresh }: { tickets: TicketRecord[]; projects: ProjectRef[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = tickets;
    if (search) { const q = search.toLowerCase(); result = result.filter(t => t.ticketName.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q)); }
    if (typeFilter) result = result.filter(t => t.type === typeFilter);
    if (statusFilter) result = result.filter(t => t.status === statusFilter);
    return result;
  }, [tickets, search, typeFilter, statusFilter]);

  const typeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    Bug: { icon: Bug, color: "text-red-500 bg-red-50" }, Question: { icon: HelpCircle, color: "text-blue-500 bg-blue-50" },
    Maintenance: { icon: Wrench, color: "text-amber-500 bg-amber-50" }, HR: { icon: Users, color: "text-purple-500 bg-purple-50" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Issue Desk (Tickets)</h1><p className="text-sm text-gray-400 mt-0.5">Helpdesk and issue tracking</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Ticket</button></div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"><option value="">All Types</option><option value="Question">Question</option><option value="Bug">Bug</option><option value="Maintenance">Maintenance</option><option value="HR">HR</option></select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"><option value="">All Status</option><option value="New">New</option><option value="Open">Open</option><option value="Pending">Pending</option><option value="Closed">Closed</option></select>
      </div>
      {filtered.length === 0 ? <EmptyState icon={FileCheck} text="No tickets found" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Ticket Name</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Assigned Team</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Assigned To</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr></thead>
            <tbody>
              {filtered.map(tk => {
                const ti = typeIcons[tk.type] || typeIcons.Question;
                const TIcon = ti.icon;
                return (
                  <tr key={tk.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3 text-xs font-mono text-gray-400">TKT-{String(tk.id).padStart(4, "0")}</td>
                    <td className="px-4 py-3"><p className="font-medium text-gray-800">{tk.ticketName}</p>{tk.contact && <p className="text-[10px] text-gray-400 mt-0.5">Reporter: {tk.contact}</p>}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${ti.color}`}><TIcon className="w-3 h-3" />{tk.type}</span></td>
                    <td className="px-4 py-3 text-center"><PriorityBadge priority={tk.priority} /></td>
                    <td className="px-4 py-3 text-center"><StatusPill status={tk.status} variant="ticket" /></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{tk.assignedTeam || "—"}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5">{tk.assignedTo && <Avatar name={tk.assignedTo} />}<span className="text-xs text-gray-600">{tk.assignedTo || "—"}</span></div></td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtShortDate(tk.dueDate)}</td>
                    <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete ticket?")) { await authFetch(`/api/sprint/tickets/${tk.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <AddTicketModal projects={projects} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddTicketModal({ projects, onClose, onSaved }: { projects: ProjectRef[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ticketName: "", type: "Question", priority: "Medium", status: "New", parentProject: "", dueDate: "", contact: "", description: "", assignedTeam: "", assignedTo: "", attachments: "" });

  const handleSave = async () => {
    if (!form.ticketName.trim()) return; setSaving(true);
    try {
      const payload: Record<string, any> = { ...form };
      if (form.parentProject) payload.parentProject = parseInt(form.parentProject); else delete payload.parentProject;
      if (form.dueDate) payload.dueDate = form.dueDate; else delete payload.dueDate;
      const res = await authFetch("/api/sprint/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Add Ticket" icon={FileCheck} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Ticket Name</label><input type="text" value={form.ticketName} onChange={e => setForm({ ...form, ticketName: e.target.value })} placeholder="e.g. Login page not loading" className={inputCls} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Question">Question</option><option value="Bug">Bug</option><option value="Maintenance">Maintenance</option><option value="HR">HR</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}><option value="New">New</option><option value="Open">Open</option><option value="Pending">Pending</option><option value="Closed">Closed</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Parent Project</label><select value={form.parentProject} onChange={e => setForm({ ...form, parentProject: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Contact (Reporter)</label><input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Reporter name or email" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Attachments (URLs)</label><input type="text" value={form.attachments} onChange={e => setForm({ ...form, attachments: e.target.value })} placeholder="Comma-separated URLs" className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} /></div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-3">Two-Tier Assignment</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assigned Team</label><select value={form.assignedTeam} onChange={e => setForm({ ...form, assignedTeam: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select Team...</option>{TEAMS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assigned To (User)</label><input type="text" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} placeholder="e.g. Rahul K." className={inputCls} /></div>
          </div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.ticketName.trim()} label="Create Ticket" />
    </Modal>
  );
}

function TimesheetsView({ tasks, tickets, timesheets, onRefresh }: { tasks: TaskRecord[]; tickets: TicketRecord[]; timesheets: TimesheetRecord[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const totalHrs = timesheets.reduce((s, t) => s + parseFloat(t.totalHours || "0"), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Timesheets</h1><p className="text-sm text-gray-400 mt-0.5">Logged hours against tasks and tickets</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Time</button></div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard icon={Timer} label="Total Entries" value={timesheets.length} color="blue" />
        <MetricCard icon={Clock} label="Total Hours Logged" value={`${totalHrs.toFixed(1)} hrs`} color="green" isText />
        <MetricCard icon={Target} label="Avg Hours/Entry" value={timesheets.length > 0 ? `${(totalHrs / timesheets.length).toFixed(1)} hrs` : "0 hrs"} color="purple" isText />
      </div>
      {timesheets.length === 0 ? <EmptyState icon={Clock} text="No timesheet entries" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Task/Ticket Ref</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Start Time</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">End Time</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Total Hours</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr></thead>
            <tbody>
              {timesheets.map(ts => (
                <tr key={ts.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={ts.userName} /><span className="font-medium text-gray-800">{ts.userName}</span></div></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ts.referenceType === "Task" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>{ts.referenceType}</span><span className="text-xs text-gray-600 ml-2">{ts.referenceLabel || `#${ts.referenceId || "—"}`}</span></td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{fmtDate(ts.logDate)}</td>
                  <td className="px-4 py-3 text-center text-xs font-mono text-gray-600">{ts.startTime}</td>
                  <td className="px-4 py-3 text-center text-xs font-mono text-gray-600">{ts.endTime}</td>
                  <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-gray-800">{parseFloat(ts.totalHours).toFixed(1)}</span><span className="text-[10px] text-gray-400 ml-0.5">hrs</span></td>
                  <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete entry?")) { await authFetch(`/api/sprint/timesheets/${ts.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <LogTimeModal tasks={tasks} tickets={tickets} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogTimeModal({ tasks, tickets, onClose, onSaved }: { tasks: TaskRecord[]; tickets: TicketRecord[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userName: "", referenceType: "Task", referenceId: "", logDate: new Date().toISOString().split("T")[0], startTime: "09:00", endTime: "17:00", notes: "" });

  const computeHours = () => {
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? (diff / 60).toFixed(2) : "0";
  };

  const refOptions = form.referenceType === "Task" ? tasks.map(t => ({ id: t.id, label: t.title })) : tickets.map(t => ({ id: t.id, label: t.ticketName }));

  const handleSave = async () => {
    if (!form.userName.trim() || !form.logDate) return; setSaving(true);
    const refItem = refOptions.find(r => r.id === parseInt(form.referenceId));
    try {
      const payload = { userName: form.userName, referenceType: form.referenceType, referenceId: form.referenceId ? parseInt(form.referenceId) : null, referenceLabel: refItem?.label || "", logDate: form.logDate, startTime: form.startTime, endTime: form.endTime, totalHours: computeHours(), notes: form.notes };
      const res = await authFetch("/api/sprint/timesheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Log Time" icon={Clock} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">User</label><input type="text" value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} placeholder="Your name" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reference Type</label><select value={form.referenceType} onChange={e => setForm({ ...form, referenceType: e.target.value, referenceId: "" })} className={inputCls + " cursor-pointer"}><option value="Task">Task</option><option value="Ticket">Ticket</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">{form.referenceType}</label><select value={form.referenceId} onChange={e => setForm({ ...form, referenceId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select...</option>{refOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label><input type="date" value={form.logDate} onChange={e => setForm({ ...form, logDate: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label><input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Total Hours</label><div className="px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-700">{computeHours()} hrs</div></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.userName.trim() || !form.logDate} label="Log Time" />
    </Modal>
  );
}

function MetricCard({ icon: Icon, label, value, color, isText }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string; isText?: boolean }) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = { blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" }, green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" }, red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-500" }, purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" } };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>
        <div><p className="text-xs text-gray-400">{label}</p><p className={`text-2xl font-bold ${c.text}`}>{isText ? value : value}</p></div></div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">{text}</p></div>;
}

function Modal({ title, icon: Icon, onClose, children, wide }: { title: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? "w-[680px]" : "w-[520px]"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Icon className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">{title}</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled, label }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean; label: string }) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
      <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"><Plus className="w-4 h-4" /> {label}</button>
    </div>
  );
}
