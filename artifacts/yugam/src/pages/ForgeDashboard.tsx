import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Wrench,
  FileText,
  Pencil,
  AlertTriangle,
  Cog,
  ClipboardList,
  CheckCircle,
  PauseCircle,
  Plus,
  X,
  Factory,
} from "lucide-react";

interface ProductionOrderRecord {
  id: number;
  workOrderNumber: string;
  productName: string;
  quantity: number;
  status: string;
  startDate: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Planned: "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-50 text-blue-600",
    Completed: "bg-green-50 text-green-600",
    Halted: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ForgeDashboard() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<ProductionOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ workOrderNumber: "", productName: "", quantity: "", status: "Planned", startDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authFetch("/api/production-orders");
      if (res.ok) setOrders(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderNumber: formData.workOrderNumber,
          productName: formData.productName,
          quantity: parseInt(formData.quantity) || 0,
          status: formData.status,
          startDate: formData.startDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create work order");
        return;
      }
      setShowModal(false);
      setFormData({ workOrderNumber: "", productName: "", quantity: "", status: "Planned", startDate: new Date().toISOString().split("T")[0] });
      await fetchOrders();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.productName.toLowerCase().includes(search.toLowerCase()) ||
      o.workOrderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const activeOrders = orders.filter((o) => o.status === "In Progress").length;
  const plannedCount = orders.filter((o) => o.status === "Planned").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const haltedCount = orders.filter((o) => o.status === "Halted").length;
  const unitsInProduction = orders.filter((o) => o.status === "In Progress").reduce((s, o) => s + o.quantity, 0);

  const metrics = [
    { label: "Active Orders", value: activeOrders.toString(), icon: ClipboardList, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Units in Production", value: unitsInProduction.toLocaleString(), icon: Factory, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Completed", value: completedCount.toString(), icon: CheckCircle, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Halted", value: haltedCount.toString(), icon: PauseCircle, iconColor: "text-red-500", ringColor: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forge Production</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manufacturing floor & work order tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
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
          placeholder="Search work orders or products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading work orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No work orders found</div>
      ) : (
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
                  <p className="text-xs text-gray-400 font-mono">{wo.workOrderNumber}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{wo.productName}</p>
                </div>
              </div>

              <div className="text-center min-w-[80px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Quantity</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{wo.quantity.toLocaleString()}</p>
              </div>

              <div className="text-center min-w-[100px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Start Date</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatDate(wo.startDate)}</p>
              </div>

              <div className="min-w-[110px] flex justify-center">
                <StatusPill status={wo.status} />
              </div>

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
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Work Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Work Order #</label>
                  <input type="text" required value={formData.workOrderNumber} onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })} placeholder="e.g., WRK-7008" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label>
                  <input type="number" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g., 250" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Product Name</label>
                <input type="text" required value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} placeholder="e.g., Precision Axle Assembly" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Halted">Halted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create Order"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
