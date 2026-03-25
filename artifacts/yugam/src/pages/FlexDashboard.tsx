import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Eye,
  Download,
  Truck,
  FileText,
  ClipboardList,
  Package,
  DollarSign,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";

interface PORecord {
  id: number;
  vendorName: string;
  poNumber: string;
  totalAmount: string;
  status: string;
  orderDate: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Pending: "bg-yellow-50 text-yellow-600",
    Approved: "bg-blue-50 text-blue-600",
    Received: "bg-green-50 text-green-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function formatCurrency(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹ 0";
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toFixed(0)}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FlexDashboard() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<PORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ vendorName: "", poNumber: "", totalAmount: "", status: "Draft", orderDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authFetch("/api/purchase-orders");
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
      const res = await authFetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: formData.vendorName,
          poNumber: formData.poNumber,
          totalAmount: formData.totalAmount || "0",
          status: formData.status,
          orderDate: formData.orderDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create PO");
        return;
      }
      setShowModal(false);
      setFormData({ vendorName: "", poNumber: "", totalAmount: "", status: "Draft", orderDate: new Date().toISOString().split("T")[0] });
      await fetchOrders();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      o.poNumber.toLowerCase().includes(search.toLowerCase())
  );

  const activePOs = orders.filter((o) => o.status !== "Received").length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const receivedCount = orders.filter((o) => o.status === "Received").length;
  const totalSpend = orders.reduce((s, o) => s + parseFloat(o.totalAmount), 0);

  const metrics = [
    { label: "Active POs", value: activePOs.toString(), icon: ClipboardList, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Pending Approval", value: pendingCount.toString(), icon: Package, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Total Spend", value: formatCurrency(totalSpend), icon: DollarSign, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Received", value: receivedCount.toString(), icon: CheckCircle, iconColor: "text-emerald-500", ringColor: "border-emerald-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flex Procurement</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage suppliers & purchase orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create PO
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
          placeholder="Search POs or vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading purchase orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No purchase orders found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((po) => (
            <div
              key={po.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono">{po.poNumber}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{po.vendorName}</p>
                </div>
              </div>

              <div className="text-center min-w-[100px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Value</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{formatCurrency(po.totalAmount)}</p>
              </div>

              <div className="text-center min-w-[100px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Order Date</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatDate(po.orderDate)}</p>
              </div>

              <div className="min-w-[100px] flex justify-center">
                <StatusPill status={po.status} />
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download PO">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Track Shipment">
                  <Truck className="w-4 h-4" />
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
              <h2 className="text-lg font-bold text-gray-900">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label>
                <input type="text" required value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} placeholder="e.g., Tata Steel Processors" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">PO Number</label>
                  <input type="text" required value={formData.poNumber} onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })} placeholder="e.g., PO-5008" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Amount (₹)</label>
                  <input type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="e.g., 250000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Order Date</label>
                  <input type="date" required value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Creating..." : "Create PO"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
