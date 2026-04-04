import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import { useModule } from "@/context/ModuleContext";
import {
  Search,
  Truck,
  Plus,
  X,
  Car,
  Wrench,
  MapPin,
  AlertTriangle,
  Fuel,
  CalendarClock,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Vehicle {
  id: number;
  regNumber: string;
  type: string;
  make: string;
  model: string;
  status: string;
  rcExpiry: string | null;
  insuranceExpiry: string | null;
  createdAt: string | null;
}

interface Trip {
  id: number;
  vehicleId: number;
  vehicleReg: string;
  driverName: string;
  origin: string;
  destination: string;
  startTime: string;
  endTime: string | null;
  status: string;
  notes: string;
  createdAt: string | null;
}

interface Expense {
  id: number;
  vehicleId: number;
  vehicleReg: string;
  expenseDate: string;
  expenseType: string;
  amount: string;
  description: string;
  loggedBy: string;
  createdAt: string | null;
}

interface DashboardData {
  total: number;
  onTrip: number;
  inMaintenance: number;
  available: number;
  expiring: { regNumber: string; vehicleType: string; expiries: { type: string; date: string }[] }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " +
    new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatCurrency(n: string | number) {
  return "₹ " + parseFloat(String(n)).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

function VehicleStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Available: "bg-green-100 text-green-700 border-green-300",
    "On Trip": "bg-blue-100 text-blue-700 border-blue-300",
    Maintenance: "bg-amber-100 text-amber-700 border-amber-300",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-300"}`}>{status}</span>;
}

function TripStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: "bg-gray-100 text-gray-600",
    "In Transit": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function ExpenseTypeBadge({ t }: { t: string }) {
  const styles: Record<string, string> = {
    Fuel: "bg-orange-50 text-orange-600",
    Repair: "bg-red-50 text-red-600",
    Servicing: "bg-blue-50 text-blue-600",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${styles[t] || "bg-gray-50 text-gray-600"}`}>{t}</span>;
}

function VehicleTypeBadge({ t }: { t: string }) {
  const icons: Record<string, typeof Truck> = { Truck, Van: Truck, Car };
  const Icon = icons[t] || Truck;
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Icon className="w-3.5 h-3.5" /> {t}
    </span>
  );
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

function FleetDashboardView() {
  const [data, setData] = useState<DashboardData>({ total: 0, onTrip: 0, inMaintenance: 0, available: 0, expiring: [] });

  useEffect(() => {
    authFetch("/api/fleet/dashboard").then(async (r) => {
      if (r.ok) setData(await r.json());
    }).catch(() => {});
  }, []);

  const pieData = [
    { name: "Available", value: data.available },
    { name: "On Trip", value: data.onTrip },
    { name: "Maintenance", value: data.inMaintenance },
  ].filter((d) => d.value > 0);

  const metricCards = [
    { label: "Total Vehicles", value: data.total, icon: Truck, color: "text-gray-700", bg: "bg-gray-50", ring: "ring-gray-200" },
    { label: "Vehicles On Trip", value: data.onTrip, icon: Navigation, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
    { label: "In Maintenance", value: data.inMaintenance, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of company vehicle fleet and logistics</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${m.bg} ring-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-3xl font-black text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Fleet Status</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No vehicles registered</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-700">Upcoming Expiries (30 days)</h3>
          </div>
          {data.expiring.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No upcoming expiries</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-auto">
              {data.expiring.map((v, i) => (
                <div key={i} className="border border-amber-100 bg-amber-50/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{v.regNumber}</p>
                    <VehicleTypeBadge t={v.vehicleType} />
                  </div>
                  <div className="mt-1.5 flex gap-3">
                    {v.expiries.map((e, j) => (
                      <span key={j} className="text-xs text-amber-700 font-medium">
                        {e.type}: {formatDate(e.date)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VehicleDirectoryView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ regNumber: "", type: "Truck", make: "", model: "", status: "Available", rcExpiry: "", insuranceExpiry: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/fleet/vehicles");
      if (res.ok) setVehicles(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body: any = { ...form };
      if (!body.rcExpiry) delete body.rcExpiry;
      if (!body.insuranceExpiry) delete body.insuranceExpiry;
      const res = await authFetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add vehicle");
        return;
      }
      setShowModal(false);
      setForm({ regNumber: "", type: "Truck", make: "", model: "", status: "Available", rcExpiry: "", insuranceExpiry: "" });
      fetchVehicles();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = vehicles.filter((v) =>
    v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase()) ||
    v.make.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Directory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Complete fleet vehicle register</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Search by reg number, type, or make..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading vehicles...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reg Number</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Make / Model</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">RC Expiry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Insurance Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No vehicles found</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-800">{v.regNumber}</td>
                  <td className="px-5 py-3"><VehicleTypeBadge t={v.type} /></td>
                  <td className="px-5 py-3 text-gray-600">{v.make}{v.model ? ` ${v.model}` : ""}</td>
                  <td className="px-5 py-3"><VehicleStatusBadge status={v.status} /></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{v.rcExpiry ? formatDate(v.rcExpiry) : "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{v.insuranceExpiry ? formatDate(v.insuranceExpiry) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Vehicle</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Registration Number *</label>
                <input type="text" required value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} placeholder="e.g., MH-12-AB-1234" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Car">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Make</label>
                  <input type="text" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="e.g., Tata" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Model</label>
                  <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g., Ace Gold" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">RC Expiry</label>
                  <input type="date" value={form.rcExpiry} onChange={(e) => setForm({ ...form, rcExpiry: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Insurance Expiry</label>
                  <input type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Adding..." : "Add Vehicle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DispatchTripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", vehicleReg: "", driverName: "", origin: "", destination: "", startTime: "", status: "Scheduled", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsRes, vehRes] = await Promise.all([
        authFetch("/api/fleet/trips"),
        authFetch("/api/fleet/vehicles"),
      ]);
      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (vehRes.ok) setVehicles(await vehRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body: any = { ...form };
      if (body.vehicleId) body.vehicleId = parseInt(body.vehicleId);
      if (!body.startTime) body.startTime = new Date().toISOString();
      const res = await authFetch("/api/fleet/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create trip");
        return;
      }
      setShowModal(false);
      setForm({ vehicleId: "", vehicleReg: "", driverName: "", origin: "", destination: "", startTime: "", status: "Scheduled", notes: "" });
      fetchData();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tripId: number, newStatus: string) => {
    try {
      await authFetch(`/api/fleet/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {}
  };

  const filtered = filter === "all" ? trips : trips.filter((t) => t.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch & Trips</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track active journeys and dispatch vehicles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      <div className="flex gap-2">
        {["all", "Scheduled", "In Transit", "Completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === f ? "bg-[#E31E24] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f === "all" ? "All Trips" : f} {f !== "all" ? `(${trips.filter((t) => t.status === f).length})` : `(${trips.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading trips...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trip ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Route</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Start</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No trips found</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-xs font-mono text-gray-400">TRP-{t.id.toString().padStart(4, "0")}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-gray-800">{t.vehicleReg}</td>
                  <td className="px-5 py-3 text-gray-600">{t.driverName}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      {t.origin} <ArrowRight className="w-3 h-3 text-gray-400" /> {t.destination}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(t.startTime)}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{t.endTime ? formatDateTime(t.endTime) : "—"}</td>
                  <td className="px-5 py-3"><TripStatusBadge status={t.status} /></td>
                  <td className="px-5 py-3">
                    {t.status === "Scheduled" && (
                      <button onClick={() => handleStatusChange(t.id, "In Transit")} className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Start
                      </button>
                    )}
                    {t.status === "In Transit" && (
                      <button onClick={() => handleStatusChange(t.id, "Completed")} className="px-2.5 py-1 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-700">
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Dispatch</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Vehicle *</label>
                  <select value={form.vehicleId} onChange={(e) => {
                    const veh = vehicles.find((v) => v.id === parseInt(e.target.value));
                    setForm({ ...form, vehicleId: e.target.value, vehicleReg: veh ? veh.regNumber : "" });
                  }} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="">Select vehicle...</option>
                    {vehicles.filter((v) => v.status === "Available").map((v) => (
                      <option key={v.id} value={v.id}>{v.regNumber} — {v.type} {v.make}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Driver Name *</label>
                  <input type="text" required value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} placeholder="Driver name" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Origin *</label>
                  <input type="text" required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="e.g., Mumbai Factory" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Destination *</label>
                  <input type="text" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g., Pune Warehouse" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label>
                  <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Initial Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 resize-none" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting || !form.vehicleId} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Dispatching..." : "Dispatch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FuelMaintenanceView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", vehicleReg: "", expenseDate: new Date().toISOString().split("T")[0], expenseType: "Fuel", amount: "", description: "", loggedBy: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, vehRes] = await Promise.all([
        authFetch("/api/fleet/expenses"),
        authFetch("/api/fleet/vehicles"),
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (vehRes.ok) setVehicles(await vehRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body: any = { ...form };
      if (body.vehicleId) body.vehicleId = parseInt(body.vehicleId);
      const res = await authFetch("/api/fleet/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to log expense");
        return;
      }
      setShowModal(false);
      setForm({ vehicleId: "", vehicleReg: "", expenseDate: new Date().toISOString().split("T")[0], expenseType: "Fuel", amount: "", description: "", loggedBy: "" });
      fetchData();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await authFetch(`/api/fleet/expenses/${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
  };

  const totalFuel = expenses.filter((e) => e.expenseType === "Fuel").reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalRepair = expenses.filter((e) => e.expenseType === "Repair").reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalServicing = expenses.filter((e) => e.expenseType === "Servicing").reduce((s, e) => s + parseFloat(e.amount), 0);

  const filtered = expenses.filter((e) =>
    e.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
    e.expenseType.toLowerCase().includes(search.toLowerCase()) ||
    e.loggedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel & Maintenance Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track fuel, repair, and servicing expenses by vehicle</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Fuel</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalFuel)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Repair</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalRepair)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Servicing</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalServicing)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Search by vehicle, type, or logged by..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading expenses...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle Reg No</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Expense Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Logged By</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No expenses logged</td></tr>
              ) : filtered.map((exp) => (
                <tr key={exp.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-gray-800">{exp.vehicleReg}</td>
                  <td className="px-5 py-3"><ExpenseTypeBadge t={exp.expenseType} /></td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{formatCurrency(exp.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs max-w-[200px] truncate">{exp.description || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{exp.loggedBy || "—"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Vehicle *</label>
                <select value={form.vehicleId} onChange={(e) => {
                  const veh = vehicles.find((v) => v.id === parseInt(e.target.value));
                  setForm({ ...form, vehicleId: e.target.value, vehicleReg: veh ? veh.regNumber : "" });
                }} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.regNumber} — {v.type}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Expense Type *</label>
                  <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="Fuel">Fuel</option>
                    <option value="Repair">Repair</option>
                    <option value="Servicing">Servicing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹) *</label>
                  <input type="number" required step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date *</label>
                <input type="date" required value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By</label>
                <input type="text" value={form.loggedBy} onChange={(e) => setForm({ ...form, loggedBy: e.target.value })} placeholder="e.g., Ramesh" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 resize-none" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting || !form.vehicleId} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Logging..." : "Log Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FleetDashboard() {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Fleet:") ? activeModule.replace("Fleet:", "") : "Fleet Dashboard";

  switch (sub) {
    case "Fleet Dashboard":
      return <FleetDashboardView />;
    case "Vehicle Directory":
      return <VehicleDirectoryView />;
    case "Dispatch & Trips":
      return <DispatchTripsView />;
    case "Fuel & Maintenance Logs":
      return <FuelMaintenanceView />;
    default:
      return <FleetDashboardView />;
  }
}
