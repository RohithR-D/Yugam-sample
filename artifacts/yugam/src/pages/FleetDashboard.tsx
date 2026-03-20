import { useState } from "react";
import {
  Search,
  Truck,
  MapPin,
  Navigation,
  Phone,
  FileText,
  PackageCheck,
  Fuel,
  AlertCircle,
} from "lucide-react";

const metrics = [
  { label: "Active Deliveries", value: "42", icon: PackageCheck, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Vehicles on Road", value: "28", icon: Truck, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Fuel Efficiency", value: "₹ 12.4/km", icon: Fuel, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Delayed Shipments", value: "5", icon: AlertCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
];

const stages = ["Picked Up", "In Transit", "Out for Delivery", "Delivered"] as const;

interface Dispatch {
  id: string;
  destination: string;
  driver: string;
  vehicle: string;
  activeStage: number;
}

const dispatches: Dispatch[] = [
  { id: "#SHP-9901", destination: "Bangalore Warehouse Hub", driver: "Rajesh K.", vehicle: "TN-38-AX-4402", activeStage: 2 },
  { id: "#SHP-9898", destination: "Mumbai Distribution Center", driver: "Vikram S.", vehicle: "MH-12-BT-7761", activeStage: 3 },
  { id: "#SHP-9895", destination: "Delhi NCR Logistics Park", driver: "Anil M.", vehicle: "DL-01-CQ-2290", activeStage: 4 },
  { id: "#SHP-9903", destination: "Hyderabad Cargo Terminal", driver: "Suresh P.", vehicle: "TS-09-FX-1185", activeStage: 1 },
];

function RouteTracker({ activeStage }: { activeStage: number }) {
  return (
    <div className="flex items-center w-72">
      {stages.map((stage, i) => {
        const idx = i + 1;
        const completed = idx < activeStage;
        const active = idx === activeStage;

        const nodeColor = completed
          ? "bg-green-500 border-green-500"
          : active
          ? "bg-yellow-400 border-yellow-400 animate-pulse"
          : "bg-white border-gray-300";
        const textColor = completed ? "text-green-600" : active ? "text-yellow-600 font-semibold" : "text-gray-400";

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className={`text-[8px] mt-1 whitespace-nowrap ${textColor}`}>{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5 mt-[-12px] ${completed ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FleetDashboard() {
  const [search, setSearch] = useState("");

  const filtered = dispatches.filter(
    (d) =>
      d.destination.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.driver.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Logistics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dispatch tracking & vehicle management</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Truck className="w-4 h-4" />
          New Dispatch
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
          placeholder="Search shipments, drivers, or destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[210px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{d.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{d.destination}</p>
              </div>
            </div>

            <div className="min-w-[140px]">
              <p className="text-xs text-gray-700">Driver: {d.driver}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Vehicle: {d.vehicle}</p>
            </div>

            <RouteTracker activeStage={d.activeStage} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Live Map">
                <Navigation className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Call Driver">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="View E-Way Bill">
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
