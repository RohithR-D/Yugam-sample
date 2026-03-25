import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  Boxes,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Clock,
  ShoppingCart,
  Plus,
  X,
  PackageCheck,
} from "lucide-react";

interface InventoryRecord {
  id: number;
  itemName: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: string;
  status: string;
  createdAt: string | null;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "In Stock": "bg-green-50 text-green-600",
    "Low Stock": "bg-yellow-50 text-yellow-600",
    "Out of Stock": "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    "Raw Materials": "bg-blue-50 text-blue-600",
    "Finished Goods": "bg-purple-50 text-purple-600",
    "Spare Parts": "bg-orange-50 text-orange-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles[category] || "bg-gray-50 text-gray-500"}`}>
      {category}
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

export default function VaultDashboard() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ itemName: "", sku: "", category: "Raw Materials", quantity: "", unitPrice: "", status: "In Stock" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setItems(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: formData.itemName,
          sku: formData.sku,
          category: formData.category,
          quantity: parseInt(formData.quantity) || 0,
          unitPrice: formData.unitPrice || "0",
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add item");
        return;
      }
      setShowModal(false);
      setFormData({ itemName: "", sku: "", category: "Raw Materials", quantity: "", unitPrice: "", status: "In Stock" });
      await fetchInventory();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = items.length;
  const lowStockCount = items.filter((i) => i.status === "Low Stock").length;
  const outOfStockCount = items.filter((i) => i.status === "Out of Stock").length;
  const totalValue = items.reduce((s, i) => s + i.quantity * parseFloat(i.unitPrice), 0);

  const metrics = [
    { label: "Total SKUs", value: totalItems.toString(), icon: Boxes, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Low Stock", value: lowStockCount.toString(), icon: AlertTriangle, iconColor: "text-yellow-500", ringColor: "border-yellow-200" },
    { label: "Out of Stock", value: outOfStockCount.toString(), icon: PackageCheck, iconColor: "text-red-500", ringColor: "border-red-200" },
    { label: "Total Value", value: formatCurrency(totalValue), icon: DollarSign, iconColor: "text-green-500", ringColor: "border-green-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vault Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time stock tracking & warehouse levels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Item
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
          placeholder="Search items, SKUs, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No items found</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-[220px]">
                <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.itemName}</p>
                </div>
              </div>

              <div className="min-w-[100px] flex justify-center">
                <CategoryBadge category={item.category} />
              </div>

              <div className="text-center min-w-[80px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Qty</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{item.quantity.toLocaleString()}</p>
              </div>

              <div className="text-center min-w-[90px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Unit Price</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{formatCurrency(item.unitPrice)}</p>
              </div>

              <div className="min-w-[100px] flex justify-center">
                <StatusPill status={item.status} />
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Clock className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                  <ShoppingCart className="w-4 h-4" />
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
              <h2 className="text-lg font-bold text-gray-900">Add Inventory Item</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label>
                <input type="text" required value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} placeholder="e.g., Steel Rods (10mm)" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">SKU</label>
                  <input type="text" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g., RM-1005" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g., 500" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit Price (₹)</label>
                  <input type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} placeholder="e.g., 250.00" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
