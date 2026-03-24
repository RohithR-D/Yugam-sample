import { useState } from "react";
import {
  Search,
  ShieldCheck,
  Users,
  Car,
  DoorOpen,
  AlertTriangle,
  Eye,
  LogOut,
  UserPlus,
  Clock,
} from "lucide-react";

const metrics = [
  { label: "Visitors Today", value: "34", icon: Users, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Vehicles on Campus", value: "18", icon: Car, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Access Points Active", value: "12/12", icon: DoorOpen, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Security Alerts", value: "2", icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
];

interface VisitorEntry {
  id: string;
  name: string;
  company: string;
  purpose: string;
  host: string;
  checkIn: string;
  checkOut: string | null;
  badge: string;
  type: "visitor" | "vehicle";
  vehiclePlate?: string;
}

const visitors: VisitorEntry[] = [
  { id: "VIS-1042", name: "Rahul Kapoor", company: "TechNova Solutions", purpose: "Client Meeting", host: "Arjun Nair", checkIn: "09:15 AM", checkOut: null, badge: "V-12", type: "visitor" },
  { id: "VEH-0087", name: "Delivery — FedEx", company: "FedEx Logistics", purpose: "Package Delivery", host: "Reception", checkIn: "10:30 AM", checkOut: "10:52 AM", badge: "T-04", type: "vehicle", vehiclePlate: "KA-01-MJ-4521" },
  { id: "VIS-1043", name: "Sneha Reddy", company: "CloudSync AI", purpose: "Interview - Sr. Engineer", host: "Meera Joshi", checkIn: "11:00 AM", checkOut: null, badge: "V-13", type: "visitor" },
  { id: "VEH-0088", name: "Vendor — Office Supplies", company: "StationeryHub", purpose: "Supply Drop-off", host: "Admin Desk", checkIn: "11:45 AM", checkOut: null, badge: "T-05", type: "vehicle", vehiclePlate: "MH-12-AB-7890" },
];

const accessLog = [
  { time: "11:48 AM", event: "Gate B — Unauthorized swipe attempt (Badge #E-99 revoked)", type: "error" },
  { time: "11:30 AM", event: "Gate A — Vendor vehicle KA-01-MJ-4521 checked in", type: "info" },
  { time: "10:52 AM", event: "Gate A — FedEx delivery vehicle checked out", type: "success" },
  { time: "09:15 AM", event: "Main Lobby — Visitor Rahul Kapoor issued Badge V-12", type: "info" },
  { time: "08:00 AM", event: "All gates — Morning shift activated, 12/12 access points online", type: "success" },
];

const logDotColors: Record<string, string> = {
  error: "bg-red-400",
  success: "bg-green-400",
  info: "bg-blue-400",
};

export default function GateDashboard() {
  const [search, setSearch] = useState("");

  const filtered = visitors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      (v.vehiclePlate?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Security</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage visitor logs, vehicle entry, and physical access</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <UserPlus className="w-4 h-4" />
          Log Visitor
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
          placeholder="Search visitors, vehicles, or badge IDs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${v.type === "vehicle" ? "bg-orange-50" : "bg-blue-50"}`}>
                {v.type === "vehicle" ? (
                  <Car className="w-5 h-5 text-orange-500" />
                ) : (
                  <Users className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{v.name}</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">{v.badge}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{v.company}{v.vehiclePlate ? ` · ${v.vehiclePlate}` : ""}</p>
              </div>
            </div>

            <div className="min-w-[130px]">
              <p className="text-[11px] text-gray-400">{v.purpose}</p>
              <p className="text-xs text-gray-500 mt-0.5">Host: <span className="font-medium text-gray-700">{v.host}</span></p>
            </div>

            <div className="min-w-[130px] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{v.checkIn}</span>
                <span className="text-gray-300">→</span>
                <span className={v.checkOut ? "text-green-600 font-medium" : "text-yellow-500 font-medium"}>
                  {v.checkOut || "On Premises"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Details">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Check Out">
                <LogOut className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Flag">
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Physical Access Log</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {accessLog.map((log, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${logDotColors[log.type]}`} />
              <span className="text-xs font-mono text-gray-400 shrink-0 w-16">{log.time}</span>
              <p className="text-sm text-gray-600">{log.event}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
