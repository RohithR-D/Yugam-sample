import { useState } from "react";
import {
  Search,
  Wrench,
  FileText,
  Pencil,
  AlertTriangle,
  Cog,
  ClipboardList,
  Gauge,
  Activity,
  ShieldCheck,
} from "lucide-react";

const metrics = [
  { label: "Active Work Orders", value: "18", icon: ClipboardList, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Efficiency Rate", value: "94%", icon: Gauge, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Machine Downtime", value: "2.3 hrs", icon: Activity, iconColor: "text-red-500", ringColor: "border-red-200" },
  { label: "Quality Pass Rate", value: "97.8%", icon: ShieldCheck, iconColor: "text-orange-500", ringColor: "border-orange-200" },
];

const stages = ["Setup", "Machining", "Assembly", "QC"] as const;

interface WorkOrder {
  id: string;
  product: string;
  batch: string;
  activeStage: number;
}

const orders: WorkOrder[] = [
  { id: "#WO-772-B", product: "Precision Axle Assembly", batch: "500 Units", activeStage: 1 },
  { id: "#WO-773-A", product: "Hydraulic Cylinder Block", batch: "200 Units", activeStage: 2 },
  { id: "#WO-770-C", product: "Titanium Flange Ring", batch: "1,000 Units", activeStage: 3 },
  { id: "#WO-768-D", product: "Carbon Fiber Drive Shaft", batch: "150 Units", activeStage: 4 },
];

function ProductionTracker({ activeStage }: { activeStage: number }) {
  return (
    <div className="flex items-center w-64">
      {stages.map((stage, i) => {
        const idx = i + 1;
        const completed = idx < activeStage;
        const active = idx === activeStage;
        const upcoming = idx > activeStage;

        const nodeColor = completed
          ? "bg-green-500 border-green-500"
          : active
          ? "bg-yellow-400 border-yellow-400 animate-pulse"
          : "bg-white border-gray-300";
        const textColor = completed ? "text-green-600" : active ? "text-yellow-600 font-semibold" : "text-gray-400";

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-[9px] mt-1 ${textColor}`}>{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${completed || (active && i < activeStage - 1) ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ForgeDashboard() {
  const [search, setSearch] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forge Production</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manufacturing floor & work order tracking</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Wrench className="w-4 h-4" />
          New Work Order
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
          placeholder="Search work orders, machines, or parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((wo) => (
          <div
            key={wo.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <Cog className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{wo.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{wo.product}</p>
              </div>
            </div>

            <div className="min-w-[100px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Batch Size</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{wo.batch}</p>
            </div>

            <ProductionTracker activeStage={wo.activeStage} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Specs">
                <FileText className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Log Progress">
                <Pencil className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Alert Supervisor">
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
