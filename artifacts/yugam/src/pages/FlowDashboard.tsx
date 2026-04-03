import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search, Plus, X, FolderKanban, BarChart3, CreditCard, HardDrive,
  LayoutDashboard, Trash2, AlertTriangle, Clock, TrendingUp,
  Target, Zap, FileText, Upload, Eye, Calendar, Edit2,
  ChevronRight, Folder, DollarSign, CheckCircle, PauseCircle,
  Flag, ArrowRight, Download, Filter,
} from "lucide-react";

type FlowSub = "Dashboard" | "Project Portfolio" | "Milestones & Gantt" | "Budgets & Costing" | "Document Center";

interface ProjectRecord { id: number; projectName: string; clientName: string; budget: string; totalValue: string; status: string; startDate: string | null; dueDate: string; description: string; createdAt: string | null; }
interface Milestone { id: number; projectId: number; title: string; targetDate: string; completionPercent: number; notes: string; createdAt: string | null; }
interface BudgetLine { id: number; projectId: number; category: string; description: string; estimatedBudget: string; actualCost: string; notes: string; createdAt: string | null; }
interface DocRecord { id: number; projectId: number; fileName: string; fileUrl: string; fileType: string; fileSize: string; uploadedBy: string; notes: string; createdAt: string | null; }
interface DashSummary { activeProjects: number; totalPortfolioValue: number; scheduleVarianceDays: number; budgetBurnRate: number; upcomingMilestones: Milestone[]; categoryBreakdown: { category: string; estimated: number; actual: number }[]; }

function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtCurrency(val: string | number) { const n = typeof val === "string" ? parseFloat(val) : val; if (isNaN(n)) return "₹ 0"; if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`; if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`; if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)} K`; return `₹ ${n.toLocaleString("en-IN")}`; }
const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = { Planning: "bg-gray-50 text-gray-500 border-gray-200", Active: "bg-blue-50 text-blue-600 border-blue-200", "On Hold": "bg-amber-50 text-amber-600 border-amber-200", Handover: "bg-green-50 text-green-600 border-green-200" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

export default function FlowDashboard() {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Flow:", "") || "Dashboard") as FlowSub;
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budgets, setBudgets] = useState<BudgetLine[]>([]);
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [dashSummary, setDashSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [pR, mR, bR, dR, sR] = await Promise.all([
        authFetch("/api/flow/projects"), authFetch("/api/flow/milestones"),
        authFetch("/api/flow/budgets"), authFetch("/api/flow/documents"),
        authFetch("/api/flow/dashboard-summary"),
      ]);
      if (pR.ok) setProjects(await pR.json());
      if (mR.ok) setMilestones(await mR.json());
      if (bR.ok) setBudgets(await bR.json());
      if (dR.ok) setDocuments(await dR.json());
      if (sR.ok) setDashSummary(await sR.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading project data...</div>;

  switch (sub) {
    case "Dashboard": return <FlowDashboardView summary={dashSummary} projects={projects} milestones={milestones} />;
    case "Project Portfolio": return <ProjectPortfolioView projects={projects} milestones={milestones} onRefresh={fetchAll} />;
    case "Milestones & Gantt": return <MilestonesGanttView projects={projects} milestones={milestones} onRefresh={fetchAll} />;
    case "Budgets & Costing": return <BudgetsCostingView projects={projects} budgets={budgets} onRefresh={fetchAll} />;
    case "Document Center": return <DocumentCenterView projects={projects} documents={documents} onRefresh={fetchAll} />;
    default: return <FlowDashboardView summary={dashSummary} projects={projects} milestones={milestones} />;
  }
}

function FlowDashboardView({ summary, projects, milestones }: { summary: DashSummary | null; projects: ProjectRecord[]; milestones: Milestone[] }) {
  const burnRate = summary?.budgetBurnRate ?? 0;
  const burnColor = burnRate > 90 ? "text-red-500" : burnRate > 70 ? "text-amber-500" : "text-green-600";
  const varianceDays = summary?.scheduleVarianceDays ?? 0;
  const varianceColor = varianceDays > 5 ? "text-red-500" : varianceDays > 0 ? "text-amber-500" : "text-green-600";

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Flow Dashboard</h1><p className="text-sm text-gray-400 mt-0.5">Executive project management overview</p></div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Active Projects" value={summary?.activeProjects ?? 0} color="blue" />
        <MetricCard icon={DollarSign} label="Total Portfolio Value" value={fmtCurrency(summary?.totalPortfolioValue ?? 0)} color="green" isText />
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-500" /></div>
            <div><p className="text-xs text-gray-400">Avg Schedule Variance</p><p className={`text-2xl font-bold ${varianceColor}`}>{varianceDays > 0 ? "+" : ""}{varianceDays} days</p></div></div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-red-500" /></div>
            <div><p className="text-xs text-gray-400">Budget Burn Rate</p><p className={`text-2xl font-bold ${burnColor}`}>{burnRate}%</p></div></div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Flag className="w-4 h-4 text-[#E31E24]" /> Upcoming Milestones</h3>
          {(!summary?.upcomingMilestones || summary.upcomingMilestones.length === 0) ? <p className="text-sm text-gray-400 py-6 text-center">No upcoming milestones</p> : (
            <div className="space-y-2">
              {summary.upcomingMilestones.map(m => {
                const project = projects.find(p => p.id === m.projectId);
                const daysLeft = Math.ceil((new Date(m.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{m.title}</p>
                      <p className="text-xs text-gray-400">{project?.projectName || "Unknown project"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{fmtDate(m.targetDate)}</p>
                      <p className={`text-[10px] font-semibold ${daysLeft < 7 ? "text-red-500" : daysLeft < 30 ? "text-amber-500" : "text-gray-400"}`}>{daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}</p>
                    </div>
                    <div className="w-[120px]">
                      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-gray-400">Progress</span><span className="font-semibold text-gray-600">{m.completionPercent}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-[#E31E24] rounded-full h-1.5 transition-all" style={{ width: `${m.completionPercent}%` }} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#E31E24]" /> Budget Burn Rate by Category</h3>
          {(!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0) ? <p className="text-sm text-gray-400 py-6 text-center">No budget data</p> : (
            <div className="space-y-3">
              {summary.categoryBreakdown.map(cat => {
                const est = Number(cat.estimated) || 1;
                const act = Number(cat.actual) || 0;
                const pct = Math.round((act / est) * 100);
                const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500";
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 font-medium">{cat.category}</span><span className="text-gray-400">{fmtCurrency(act)} / {fmtCurrency(est)}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`${barColor} rounded-full h-2 transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, isText, suffix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string; isText?: boolean; suffix?: string }) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" },
    red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-500" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>
        <div><p className="text-xs text-gray-400">{label}</p><p className={`text-2xl font-bold ${c.text}`}>{isText ? value : `${value}${suffix || ""}`}</p></div>
      </div>
    </div>
  );
}

function ProjectPortfolioView({ projects, milestones, onRefresh }: { projects: ProjectRecord[]; milestones: Milestone[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter(p => p.projectName.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)); }
    if (statusFilter) result = result.filter(p => p.status === statusFilter);
    return result;
  }, [projects, search, statusFilter]);

  const getMilestoneProgress = (projectId: number) => {
    const ms = milestones.filter(m => m.projectId === projectId);
    if (ms.length === 0) return 0;
    return Math.round(ms.reduce((s, m) => s + m.completionPercent, 0) / ms.length);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Project Portfolio</h1><p className="text-sm text-gray-400 mt-0.5">All projects at a glance</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> New Project</button></div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search projects or clients..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"><option value="">All Status</option><option value="Planning">Planning</option><option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Handover">Handover</option></select>
      </div>
      {filtered.length === 0 ? <EmptyState icon={FolderKanban} text="No projects found" /> : (
        <div className="space-y-3">
          {filtered.map(p => {
            const progress = getMilestoneProgress(p.id);
            const msCount = milestones.filter(m => m.projectId === p.id).length;
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-[#E31E24]/30 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gray-50 rounded-lg shrink-0"><Folder className="w-5 h-5 text-gray-400" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{p.projectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.clientName}</p>
                    </div>
                  </div>
                  <div className="w-[180px]">
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-400">{msCount} milestones</span><span className="font-semibold text-gray-600">{progress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#E31E24] rounded-full h-2 transition-all" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="text-center w-[100px]"><p className="text-[10px] text-gray-400 uppercase">Value</p><p className="text-sm font-bold text-gray-800">{fmtCurrency(p.totalValue || p.budget)}</p></div>
                  <div className="text-center w-[100px]"><p className="text-[10px] text-gray-400 uppercase">Due</p><p className="text-xs font-medium text-gray-600">{fmtDate(p.dueDate)}</p></div>
                  <div className="w-[80px] flex justify-center"><StatusPill status={p.status} /></div>
                  <button onClick={async () => { if (confirm("Delete project and all linked data?")) { await authFetch(`/api/flow/projects/${p.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ projectName: "", clientName: "", budget: "", totalValue: "", status: "Planning", startDate: new Date().toISOString().split("T")[0], dueDate: "", description: "" });
  const handleSave = async () => {
    if (!form.projectName.trim() || !form.clientName.trim() || !form.dueDate) return; setSaving(true);
    try { const res = await authFetch("/api/flow/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, budget: form.budget || "0", totalValue: form.totalValue || form.budget || "0" }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Create New Project" icon={FolderKanban} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project Name</label><input type="text" value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} placeholder="e.g. Solar Farm Phase 2" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label><input type="text" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="e.g. GreenLeaf Industries" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Total Value (₹)</label><input type="number" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })} placeholder="Contract value" className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Budget (₹)</label><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="Estimated budget" className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Planning">Planning</option><option value="Active">Active</option><option value="On Hold">On Hold</option><option value="Handover">Handover</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.projectName.trim() || !form.clientName.trim() || !form.dueDate} label="Create Project" />
    </Modal>
  );
}

function MilestonesGanttView({ projects, milestones, onRefresh }: { projects: ProjectRecord[]; milestones: Milestone[]; onRefresh: () => void }) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editMs, setEditMs] = useState<Milestone | null>(null);

  const projectMilestones = useMemo(() => {
    if (!selectedProject) return milestones;
    return milestones.filter(m => m.projectId === selectedProject);
  }, [milestones, selectedProject]);

  const ganttRange = useMemo(() => {
    if (projectMilestones.length === 0) return { start: new Date(), end: new Date(Date.now() + 90 * 86400000), days: 90 };
    const dates = projectMilestones.map(m => new Date(m.targetDate).getTime());
    const minDate = new Date(Math.min(...dates) - 7 * 86400000);
    const maxDate = new Date(Math.max(...dates) + 14 * 86400000);
    const days = Math.max(30, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));
    return { start: minDate, end: maxDate, days };
  }, [projectMilestones]);

  const getPosition = (date: string) => {
    const d = new Date(date).getTime();
    const s = ganttRange.start.getTime();
    const e = ganttRange.end.getTime();
    return Math.max(0, Math.min(100, ((d - s) / (e - s)) * 100));
  };

  const monthMarkers = useMemo(() => {
    const markers: { label: string; pos: number }[] = [];
    const cursor = new Date(ganttRange.start);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= ganttRange.end) {
      const pos = getPosition(cursor.toISOString());
      markers.push({ label: cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), pos });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return markers;
  }, [ganttRange]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Milestones & Gantt</h1><p className="text-sm text-gray-400 mt-0.5">Visual timeline of project phases and milestones</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Milestone</button></div>
      <div className="flex items-center gap-3">
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value ? parseInt(e.target.value) : "")} className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm min-w-[250px]"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select>
        <p className="text-xs text-gray-400">{projectMilestones.length} milestones</p>
      </div>
      {projectMilestones.length === 0 ? <EmptyState icon={BarChart3} text="No milestones for selected project" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="relative border-b border-gray-100 px-5 py-3 bg-gray-50/50">
            <div className="relative h-6">
              <div className="absolute left-0 top-0 w-full h-full flex items-center">
                {monthMarkers.map((m, i) => (
                  <div key={i} className="absolute text-[10px] text-gray-400 font-medium" style={{ left: `${m.pos}%` }}>{m.label}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {projectMilestones.map(ms => {
              const pos = getPosition(ms.targetDate);
              const project = projects.find(p => p.id === ms.projectId);
              const isPast = new Date(ms.targetDate) < new Date() && ms.completionPercent < 100;
              return (
                <div key={ms.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-[200px] shrink-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ms.title}</p>
                    <p className="text-[10px] text-gray-400">{project?.projectName || "—"} · {fmtDate(ms.targetDate)}</p>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div className="absolute inset-0 bg-gray-100/50 rounded" />
                    <div className="absolute top-0 h-full" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                      <div className={`w-3 h-3 rounded-full border-2 mt-2.5 ${ms.completionPercent >= 100 ? "bg-green-500 border-green-300" : isPast ? "bg-red-500 border-red-300" : "bg-[#E31E24] border-red-300"}`} />
                    </div>
                    {ms.completionPercent > 0 && ms.completionPercent < 100 && (
                      <div className="absolute top-0 h-full rounded bg-[#E31E24]/10" style={{ left: 0, width: `${pos}%` }} />
                    )}
                  </div>
                  <div className="w-[60px] text-right"><span className={`text-xs font-bold ${ms.completionPercent >= 100 ? "text-green-600" : "text-gray-600"}`}>{ms.completionPercent}%</span></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditMs(ms)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/flow/milestones/${ms.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showModal && <MilestoneModal projects={projects} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} defaultProjectId={selectedProject || undefined} />}
      {editMs && <MilestoneModal projects={projects} milestone={editMs} onClose={() => setEditMs(null)} onSaved={() => { setEditMs(null); onRefresh(); }} />}
    </div>
  );
}

function MilestoneModal({ projects, milestone, onClose, onSaved, defaultProjectId }: { projects: ProjectRecord[]; milestone?: Milestone; onClose: () => void; onSaved: () => void; defaultProjectId?: number }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ projectId: milestone?.projectId?.toString() || defaultProjectId?.toString() || "", title: milestone?.title || "", targetDate: milestone ? new Date(milestone.targetDate).toISOString().split("T")[0] : "", completionPercent: milestone?.completionPercent?.toString() || "0", notes: milestone?.notes || "" });
  const isEdit = !!milestone;
  const handleSave = async () => {
    if (!form.projectId || !form.title.trim() || !form.targetDate) return; setSaving(true);
    try {
      const url = isEdit ? `/api/flow/milestones/${milestone!.id}` : "/api/flow/milestones";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? { title: form.title, targetDate: form.targetDate, completionPercent: parseInt(form.completionPercent) || 0, notes: form.notes } : { projectId: parseInt(form.projectId), title: form.title, targetDate: form.targetDate, completionPercent: parseInt(form.completionPercent) || 0, notes: form.notes };
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title={isEdit ? "Edit Milestone" : "Add Milestone"} icon={Flag} onClose={onClose}>
      <div className="p-6 space-y-4">
        {!isEdit && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label><select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select Project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Milestone Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Foundation Complete" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Target Date</label><input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Completion %</label><input type="number" min="0" max="100" value={form.completionPercent} onChange={e => setForm({ ...form, completionPercent: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.projectId || !form.title.trim() || !form.targetDate} label={isEdit ? "Save Changes" : "Add Milestone"} />
    </Modal>
  );
}

function BudgetsCostingView({ projects, budgets, onRefresh }: { projects: ProjectRecord[]; budgets: BudgetLine[]; onRefresh: () => void }) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);

  const projectBudgets = useMemo(() => {
    if (!selectedProject) return budgets;
    return budgets.filter(b => b.projectId === selectedProject);
  }, [budgets, selectedProject]);

  const budgetCategories = ["Material Costs", "Procurement Costs", "Labor/Machine Costs"];
  const categoryTotals = useMemo(() => {
    return budgetCategories.map(cat => {
      const lines = projectBudgets.filter(b => b.category === cat);
      const estimated = lines.reduce((s, b) => s + parseFloat(b.estimatedBudget), 0);
      const actual = lines.reduce((s, b) => s + parseFloat(b.actualCost), 0);
      return { category: cat, estimated, actual, variance: estimated - actual, lineCount: lines.length };
    });
  }, [projectBudgets]);

  const grandEstimated = categoryTotals.reduce((s, c) => s + c.estimated, 0);
  const grandActual = categoryTotals.reduce((s, c) => s + c.actual, 0);
  const grandVariance = grandEstimated - grandActual;

  const selectedProj = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Budgets & Costing</h1><p className="text-sm text-gray-400 mt-0.5">Financial matrix comparing estimated vs. actual costs</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Budget Line</button></div>
      <div className="flex items-center gap-3">
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value ? parseInt(e.target.value) : "")} className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm min-w-[250px]"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select>
        {selectedProj && <div className="text-xs text-gray-400">Project Budget: <span className="font-semibold text-gray-600">{fmtCurrency(selectedProj.budget)}</span></div>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Total Estimated</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{fmtCurrency(grandEstimated)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Total Actual</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmtCurrency(grandActual)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Variance</p>
          <p className={`text-2xl font-bold mt-1 ${grandVariance >= 0 ? "text-green-600" : "text-red-500"}`}>{grandVariance >= 0 ? "+" : ""}{fmtCurrency(grandVariance)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cost Category</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estimated Budget</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actual Cost</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Variance</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Burn %</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-[200px]">Visual</th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.map(cat => {
              const burnPct = cat.estimated > 0 ? Math.round((cat.actual / cat.estimated) * 100) : 0;
              const barColor = burnPct > 100 ? "bg-red-500" : burnPct > 80 ? "bg-amber-500" : "bg-green-500";
              return (
                <tr key={cat.category} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${cat.category === "Material Costs" ? "bg-blue-500" : cat.category === "Procurement Costs" ? "bg-purple-500" : "bg-amber-500"}`} /><span className="font-medium text-gray-800">{cat.category}</span></div><p className="text-[10px] text-gray-400 ml-5 mt-0.5">{cat.lineCount} line items</p></td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-800">{fmtCurrency(cat.estimated)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-blue-600">{fmtCurrency(cat.actual)}</td>
                  <td className={`px-4 py-4 text-right font-bold ${cat.variance >= 0 ? "text-green-600" : "text-red-500"}`}>{cat.variance >= 0 ? "+" : ""}{fmtCurrency(cat.variance)}</td>
                  <td className="px-4 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${burnPct > 100 ? "bg-red-50 text-red-500" : burnPct > 80 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{burnPct}%</span></td>
                  <td className="px-4 py-4"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${barColor} rounded-full h-2.5 transition-all`} style={{ width: `${Math.min(burnPct, 100)}%` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50/80 border-t border-gray-200">
              <td className="px-5 py-3.5 font-bold text-gray-800 text-sm">Grand Total</td>
              <td className="px-4 py-3.5 text-right font-bold text-gray-800">{fmtCurrency(grandEstimated)}</td>
              <td className="px-4 py-3.5 text-right font-bold text-blue-600">{fmtCurrency(grandActual)}</td>
              <td className={`px-4 py-3.5 text-right font-bold ${grandVariance >= 0 ? "text-green-600" : "text-red-500"}`}>{grandVariance >= 0 ? "+" : ""}{fmtCurrency(grandVariance)}</td>
              <td className="px-4 py-3.5 text-center"><span className="text-xs font-bold text-gray-700">{grandEstimated > 0 ? Math.round((grandActual / grandEstimated) * 100) : 0}%</span></td>
              <td className="px-4 py-3.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {projectBudgets.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50"><h3 className="text-sm font-bold text-gray-700">Line Item Detail</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100"><th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Category</th><th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Estimated</th><th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Actual</th><th className="w-[50px]"></th></tr></thead>
            <tbody>
              {projectBudgets.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-3 text-sm text-gray-800">{b.description || "—"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">{b.category}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtCurrency(b.estimatedBudget)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmtCurrency(b.actualCost)}</td>
                  <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/flow/budgets/${b.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <AddBudgetLineModal projects={projects} defaultProjectId={selectedProject || undefined} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddBudgetLineModal({ projects, defaultProjectId, onClose, onSaved }: { projects: ProjectRecord[]; defaultProjectId?: number; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ projectId: defaultProjectId?.toString() || "", category: "Material Costs", description: "", estimatedBudget: "", actualCost: "0", notes: "" });
  const handleSave = async () => {
    if (!form.projectId || !form.estimatedBudget) return; setSaving(true);
    try { const res = await authFetch("/api/flow/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, projectId: parseInt(form.projectId), estimatedBudget: form.estimatedBudget, actualCost: form.actualCost || "0" }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Add Budget Line" icon={CreditCard} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label><select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select Project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Cost Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Material Costs">Material Costs</option><option value="Procurement Costs">Procurement Costs</option><option value="Labor/Machine Costs">Labor/Machine Costs</option></select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Structural steel procurement" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Estimated Budget (₹)</label><input type="number" value={form.estimatedBudget} onChange={e => setForm({ ...form, estimatedBudget: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Actual Cost (₹)</label><input type="number" value={form.actualCost} onChange={e => setForm({ ...form, actualCost: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.projectId || !form.estimatedBudget} label="Add Line" />
    </Modal>
  );
}

function DocumentCenterView({ projects, documents, onRefresh }: { projects: ProjectRecord[]; documents: DocRecord[]; onRefresh: () => void }) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const projectDocs = useMemo(() => {
    let result = selectedProject ? documents.filter(d => d.projectId === selectedProject) : documents;
    if (typeFilter) result = result.filter(d => d.fileType === typeFilter);
    return result;
  }, [documents, selectedProject, typeFilter]);

  const fileTypeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    Contracts: { icon: FileText, color: "bg-blue-50 text-blue-600" },
    "Architectural Drawings": { icon: BarChart3, color: "bg-purple-50 text-purple-600" },
    "Compliance Permits": { icon: CheckCircle, color: "bg-green-50 text-green-600" },
    BOQs: { icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  };

  const docsByType = useMemo(() => {
    const grouped: Record<string, DocRecord[]> = {};
    projectDocs.forEach(d => {
      if (!grouped[d.fileType]) grouped[d.fileType] = [];
      grouped[d.fileType].push(d);
    });
    return grouped;
  }, [projectDocs]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Document Center</h1><p className="text-sm text-gray-400 mt-0.5">Project file repository — contracts, drawings, permits, BOQs</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Upload className="w-4 h-4" /> Upload Document</button></div>
      <div className="flex items-center gap-3">
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value ? parseInt(e.target.value) : "")} className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm min-w-[250px]"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"><option value="">All Types</option><option value="Contracts">Contracts</option><option value="Architectural Drawings">Architectural Drawings</option><option value="Compliance Permits">Compliance Permits</option><option value="BOQs">BOQs</option></select>
        <p className="text-xs text-gray-400">{projectDocs.length} documents</p>
      </div>
      {projectDocs.length === 0 ? <EmptyState icon={HardDrive} text="No documents uploaded" /> : (
        <div className="space-y-4">
          {Object.entries(docsByType).map(([type, docs]) => {
            const ftInfo = fileTypeIcons[type] || { icon: FileText, color: "bg-gray-50 text-gray-600" };
            const FTIcon = ftInfo.icon;
            return (
              <div key={type} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${ftInfo.color} flex items-center justify-center`}><FTIcon className="w-3.5 h-3.5" /></div>
                  <h3 className="text-sm font-bold text-gray-700">{type}</h3>
                  <span className="text-[10px] text-gray-400 ml-auto">{docs.length} files</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {docs.map(doc => {
                    const project = projects.find(p => p.id === doc.projectId);
                    return (
                      <div key={doc.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{project?.projectName || "—"} · {doc.uploadedBy || "System"} · {fmtDate(doc.createdAt)}</p>
                        </div>
                        {doc.fileSize && <span className="text-xs text-gray-400">{doc.fileSize}</span>}
                        {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /></a>}
                        <button onClick={async () => { if (confirm("Delete document?")) { await authFetch(`/api/flow/documents/${doc.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <UploadDocumentModal projects={projects} defaultProjectId={selectedProject || undefined} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function UploadDocumentModal({ projects, defaultProjectId, onClose, onSaved }: { projects: ProjectRecord[]; defaultProjectId?: number; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ projectId: defaultProjectId?.toString() || "", fileName: "", fileUrl: "", fileType: "Contracts", fileSize: "", uploadedBy: "", notes: "" });
  const handleSave = async () => {
    if (!form.projectId || !form.fileName.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/flow/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, projectId: parseInt(form.projectId) }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Upload Document" icon={Upload} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label><select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select Project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">File Name</label><input type="text" value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="e.g. Contract_SolarFarm_v2.pdf" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Document Type</label><select value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Contracts">Contracts</option><option value="Architectural Drawings">Architectural Drawings</option><option value="Compliance Permits">Compliance Permits</option><option value="BOQs">BOQs</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">File Size</label><input type="text" value={form.fileSize} onChange={e => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 2.4 MB" className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">File URL (optional)</label><input type="url" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Uploaded By</label><input type="text" value={form.uploadedBy} onChange={e => setForm({ ...form, uploadedBy: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.projectId || !form.fileName.trim()} label="Upload Document" />
    </Modal>
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
