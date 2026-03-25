import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";

interface TaskRecord {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: string;
  status: string;
  dueDate: string;
  createdAt: string | null;
}

type Priority = "High" | "Medium" | "Low";

const COLUMNS = [
  { title: "To Do", headerColor: "border-b-gray-300" },
  { title: "In Progress", headerColor: "border-b-blue-400" },
  { title: "Review", headerColor: "border-b-orange-400" },
  { title: "Done", headerColor: "border-b-green-400" },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getGradient(name: string) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-600",
    "from-red-500 to-rose-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function formatDueDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function PriorityPill({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-orange-50 text-orange-600",
    Low: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${styles[priority] || "bg-gray-100 text-gray-500"}`}>
      {priority}
    </span>
  );
}

function TaskCard({ task }: { task: TaskRecord }) {
  const initials = getInitials(task.assignee);
  const gradient = getGradient(task.assignee);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-all">
      <PriorityPill priority={task.priority} />
      <p className="text-sm font-semibold text-gray-800 mt-2">{task.title}</p>
      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[8px] font-bold`}>
            {initials}
          </div>
          <span className="text-[11px] text-gray-500">{task.assignee}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">{formatDueDate(task.dueDate)}</span>
        </div>
      </div>
    </div>
  );
}

export default function SprintSolveDashboard() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", assignee: "", priority: "Medium", status: "To Do", dueDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await authFetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create task");
        return;
      }
      setShowModal(false);
      setFormData({ title: "", description: "", assignee: "", priority: "Medium", status: "To Do", dueDate: new Date().toISOString().split("T")[0] });
      await fetchTasks();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = tasks.filter((t) => t.status !== "Done").length;
  const highCount = tasks.filter((t) => t.priority === "High" && t.status !== "Done").length;
  const today = new Date().toISOString().split("T")[0];
  const dueTodayCount = tasks.filter((t) => t.dueDate.startsWith(today) && t.status !== "Done").length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;

  const metrics = [
    { label: "Total Open", value: openCount.toString(), accent: "border-l-blue-500", iconColor: "text-blue-500", icon: CheckSquare },
    { label: "High Priority", value: highCount.toString(), accent: "border-l-red-500", iconColor: "text-red-500", icon: Flame },
    { label: "Due Today", value: dueTodayCount.toString(), accent: "border-l-orange-500", iconColor: "text-orange-500", icon: AlertTriangle },
    { label: "Done", value: doneCount.toString(), accent: "border-l-green-500", iconColor: "text-green-500", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprint & Solve</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track day-to-day tasks and support tickets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm border-l-4 ${m.accent}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${m.iconColor}`} />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-xl font-bold text-gray-800">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.title);
            return (
              <div key={col.title} className="min-h-[200px]">
                <div className={`bg-gray-50 p-3 rounded-t-lg border-b-2 ${col.headerColor} flex items-center justify-between`}>
                  <span className="text-sm font-bold text-gray-600">{col.title}</span>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-b-lg min-h-[300px]">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Task</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Task Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Implement search filters" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the task..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Assignee</label>
                <input type="text" required value={formData.assignee} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })} placeholder="e.g., Priya S." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
                  <input type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
