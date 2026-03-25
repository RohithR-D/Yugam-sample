import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Truck,
  MapPin,
  Navigation,
  Phone,
  FileText,
  PackageCheck,
  AlertCircle,
  Plus,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";

interface ShipmentRecord {
  id: number;
  trackingNumber: string;
  destination: string;
  carrier: string;
  status: string;
  dispatchDate: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-600",
    "In Transit": "bg-blue-50 text-blue-600",
    Delivered: "bg-green-50 text-green-600",
    Delayed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function CarrierBadge({ carrier }: { carrier: string }) {
  const styles: Record<string, string> = {
    FedEx: "bg-purple-50 text-purple-600",
    BlueDart: "bg-blue-50 text-blue-600",
    DTDC: "bg-orange-50 text-orange-600",
    Delhivery: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles[carrier] || "bg-gray-50 text-gray-500"}`}>
      {carrier}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FleetDashboard() {
  const [search, setSearch] = useState("");
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ trackingNumber: "", destination: "", carrier: "BlueDart", status: "Pending", dispatchDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchShipments = useCallback(async () => {
    try {
      const res = await authFetch("/api/shipments");
      if (res.ok) setShipments(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: formData.trackingNumber,
          destination: formData.destination,
          carrier: formData.carrier,
          status: formData.status,
          dispatchDate: formData.dispatchDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create shipment");
        return;
      }
      setShowModal(false);
      setFormData({ trackingNumber: "", destination: "", carrier: "BlueDart", status: "Pending", dispatchDate: new Date().toISOString().split("T")[0] });
      await fetchShipments();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = shipments.filter(
    (s) =>
      s.destination.toLowerCase().includes(search.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.carrier.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = shipments.filter((s) => s.status !== "Delivered").length;
  const inTransitCount = shipments.filter((s) => s.status === "In Transit").length;
  const deliveredCount = shipments.filter((s) => s.status === "Delivered").length;
  const delayedCount = shipments.filter((s) => s.status === "Delayed").length;

  const metrics = [
    { label: "Active Shipments", value: activeCount.toString(), icon: PackageCheck, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "In Transit", value: inTransitCount.toString(), icon: Truck, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Delivered", value: deliveredCount.toString(), icon: CheckCircle, iconColor: "text-emerald-500", ringColor: "border-emerald-200" },
    { label: "Delayed", value: delayedCount.toString(), icon: AlertCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Logistics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dispatch tracking & shipment management</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Shipment
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
          placeholder="Search shipments, carriers, or destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading shipments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No shipments found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono">{s.trackingNumber}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.destination}</p>
                </div>
              </div>

              <div className="min-w-[90px] flex justify-center">
                <CarrierBadge carrier={s.carrier} />
              </div>

              <div className="text-center min-w-[100px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Dispatch</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatDate(s.dispatchDate)}</p>
              </div>

              <div className="min-w-[100px] flex justify-center">
                <StatusPill status={s.status} />
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Live Map">
                  <Navigation className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Contact">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="View Details">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Shipment</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tracking Number</label>
                  <input type="text" required value={formData.trackingNumber} onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })} placeholder="e.g., SHP-9008" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Carrier</label>
                  <select value={formData.carrier} onChange={(e) => setFormData({ ...formData, carrier: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="BlueDart">BlueDart</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DTDC">DTDC</option>
                    <option value="Delhivery">Delhivery</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Destination</label>
                <input type="text" required value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="e.g., Bangalore Warehouse Hub" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Dispatch Date</label>
                  <input type="date" required value={formData.dispatchDate} onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create Shipment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
