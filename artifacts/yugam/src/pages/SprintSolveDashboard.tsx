import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from "lucide-react";

const metrics = [
  { label: "Total Open", value: "34", accent: "border-l-blue-500", iconColor: "text-blue-500", icon: CheckSquare },
  { label: "High Priority", value: "8", accent: "border-l-red-500", iconColor: "text-red-500", icon: Flame },
  { label: "Due Today", value: "5", accent: "border-l-orange-500", iconColor: "text-orange-500", icon: AlertTriangle },
  { label: "Resolved (24h)", value: "12", accent: "border-l-green-500", iconColor: "text-green-500", icon: CheckCircle2 },
];

type Priority = "High" | "Medium" | "Low";

interface Task {
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  initials: string;
  gradient: string;
  due: string;
}

const columns: { title: string; headerColor: string; tasks: Task[] }[] = [
  {
    title: "To Do",
    headerColor: "border-b-gray-300",
    tasks: [
      { title: "Vendor onboarding flow", description: "Create the multi-step form for new vendor registration.", priority: "High", assignee: "Nisha A.", initials: "NA", gradient: "from-violet-500 to-purple-600", due: "Mar 24" },
      { title: "Fix CSV export bug", description: "Export fails for records with special characters.", priority: "Medium", assignee: "Rohan D.", initials: "RD", gradient: "from-emerald-500 to-teal-600", due: "Mar 25" },
      { title: "Update privacy policy page", description: "Legal team sent revised copy for GDPR compliance.", priority: "Low", assignee: "Kavya I.", initials: "KI", gradient: "from-amber-500 to-orange-600", due: "Mar 28" },
    ],
  },
  {
    title: "In Progress",
    headerColor: "border-b-blue-400",
    tasks: [
      { title: "Dashboard analytics API", description: "Build endpoints for real-time chart data aggregation.", priority: "High", assignee: "Aarav M.", initials: "AM", gradient: "from-blue-500 to-indigo-600", due: "Mar 23" },
      { title: "Mobile responsive sidebar", description: "Collapse sidebar into a hamburger menu on small screens.", priority: "Medium", assignee: "Priya S.", initials: "PS", gradient: "from-pink-500 to-rose-600", due: "Mar 26" },
    ],
  },
  {
    title: "Review",
    headerColor: "border-b-orange-400",
    tasks: [
      { title: "Payroll calculation engine", description: "Tax slab logic and PF deduction formulas need QA sign-off.", priority: "High", assignee: "Sameer K.", initials: "SK", gradient: "from-sky-500 to-blue-600", due: "Mar 22" },
      { title: "Client portal redesign", description: "New Asthiraa V2 design applied to the external portal.", priority: "Medium", assignee: "Nisha A.", initials: "NA", gradient: "from-violet-500 to-purple-600", due: "Mar 24" },
    ],
  },
  {
    title: "Done",
    headerColor: "border-b-green-400",
    tasks: [
      { title: "Email notification service", description: "Transactional emails via SMTP with template engine.", priority: "Low", assignee: "Rohan D.", initials: "RD", gradient: "from-emerald-500 to-teal-600", due: "Mar 20" },
      { title: "Role-based access control", description: "Admin, Manager, and Viewer permission tiers configured.", priority: "High", assignee: "Aarav M.", initials: "AM", gradient: "from-blue-500 to-indigo-600", due: "Mar 19" },
    ],
  },
];

function PriorityPill({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-orange-50 text-orange-600",
    Low: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-all">
      <PriorityPill priority={task.priority} />
      <p className="text-sm font-semibold text-gray-800 mt-2">{task.title}</p>
      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${task.gradient} flex items-center justify-center text-white text-[8px] font-bold`}>
            {task.initials}
          </div>
          <span className="text-[11px] text-gray-500">{task.assignee}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">{task.due}</span>
        </div>
      </div>
    </div>
  );
}

export default function SprintSolveDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprint & Solve</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track day-to-day tasks and support tickets</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <CheckSquare className="w-4 h-4" />
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

      <div className="grid grid-cols-4 gap-4 items-start">
        {columns.map((col) => (
          <div key={col.title} className="min-h-[200px]">
            <div className={`bg-gray-50 p-3 rounded-t-lg border-b-2 ${col.headerColor} flex items-center justify-between`}>
              <span className="text-sm font-bold text-gray-600">{col.title}</span>
              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{col.tasks.length}</span>
            </div>
            <div className="bg-gray-50/50 p-3 rounded-b-lg min-h-[300px]">
              {col.tasks.map((task) => (
                <TaskCard key={task.title} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
