import { useState } from "react";
import {
  Search,
  FolderPlus,
  Folder,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  Gauge,
  CalendarClock,
  TrendingUp,
} from "lucide-react";

const metrics = [
  { label: "Active Projects", value: "14", icon: ClipboardList, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Team Utilization", value: "88%", icon: Gauge, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Upcoming Deadlines", value: "7", icon: CalendarClock, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Avg. Profitability", value: "32%", icon: TrendingUp, iconColor: "text-emerald-500", ringColor: "border-emerald-200" },
];

type Health = "Healthy" | "At Risk" | "Delayed";

interface Project {
  name: string;
  client: string;
  start: string;
  end: string;
  completion: number;
  health: Health;
}

const projects: Project[] = [
  { name: "Solar Farm Phase 1", client: "GreenLeaf Industries", start: "Jan 2026", end: "June 2026", completion: 72, health: "Healthy" },
  { name: "ERP Cloud Migration", client: "TechNova Solutions", start: "Mar 2026", end: "Sep 2026", completion: 35, health: "At Risk" },
  { name: "Smart Factory IoT", client: "Apex Dynamics", start: "Nov 2025", end: "Apr 2026", completion: 90, health: "Healthy" },
  { name: "Warehouse Automation", client: "CloudSync AI", start: "Feb 2026", end: "Aug 2026", completion: 18, health: "Delayed" },
];

function HealthPill({ health }: { health: Health }) {
  const styles: Record<Health, string> = {
    Healthy: "bg-green-50 text-green-600",
    "At Risk": "bg-yellow-50 text-yellow-600",
    Delayed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[health]}`}>
      {health}
    </span>
  );
}

function ProgressBar({ completion, health }: { completion: number; health: Health }) {
  const barColor: Record<Health, string> = {
    Healthy: "bg-green-500",
    "At Risk": "bg-yellow-400",
    Delayed: "bg-red-400",
  };
  return (
    <div className="w-44">
      <div className="flex items-center justify-between mb-1.5">
        <HealthPill health={health} />
        <span className="text-[11px] font-semibold text-gray-500">{completion}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor[health]}`}
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>
  );
}

export default function FlowDashboard() {
  const [search, setSearch] = useState("");

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flow Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">Project management & resource allocation</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <FolderPlus className="w-4 h-4" />
          New Project
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
          placeholder="Search projects, clients, or leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((p) => (
          <div
            key={p.name}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <Folder className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.client}</p>
              </div>
            </div>

            <div className="min-w-[130px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Timeline</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{p.start} — {p.end}</p>
            </div>

            <ProgressBar completion={p.completion} health={p.health} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Gantt Chart">
                <BarChart3 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Team Board">
                <Users className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Edit Project">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
