import { authFetch } from "@/lib/authFetch";
import { useState, useMemo } from "react";
import {
  Search, Plus, X, Package, Warehouse, ArrowLeftRight, ClipboardList,
  Store, HardDrive, TrendingUp, Boxes, Clock, AlertTriangle, Trash2,
  ArrowDownToLine, ArrowUpFromLine, RefreshCw, Settings2, Eye,
  Wrench, UserCheck, ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useVault } from "../hooks/useVault";
import { useVaultSub } from "../hooks/useVaultSub";
import { fmt, fmtDate, inputCls } from "../utils/vaultUtils";
import type { Asset, CatalogItem, DashSummary, Indent, Location, Movement } from "../types";

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = { Active: "bg-green-50 text-green-600 border-green-200", Allocated: "bg-blue-50 text-blue-600 border-blue-200", Maintenance: "bg-amber-50 text-amber-600 border-amber-200", Sold: "bg-gray-50 text-gray-500 border-gray-200", Pending: "bg-amber-50 text-amber-600 border-amber-200", Approved: "bg-blue-50 text-blue-600 border-blue-200", Issued: "bg-green-50 text-green-600 border-green-200", Rejected: "bg-red-50 text-red-500 border-red-200" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

export default function VaultDashboard() {
  const sub = useVaultSub();
  const { catalog, locations, movements, indents, assets, dashSummary, loading, fetchAll } = useVault();

  if (loading) return <div className="text-center py-16 text-gray-400">Loading inventory data...</div>;

  switch (sub) {
    case "Dashboard": return <VaultOverview summary={dashSummary} catalog={catalog} />;
    case "Item & Product Master": return <ItemMaster catalog={catalog} onRefresh={fetchAll} />;
    case "Warehouses & Stores": return <WarehouseStores locations={locations} onRefresh={fetchAll} />;
    case "Stock Movements": return <StockMovementsView movements={movements} catalog={catalog} locations={locations} onRefresh={fetchAll} />;
    case "Material Issue": return <MaterialIssueView indents={indents} catalog={catalog} locations={locations} onRefresh={fetchAll} />;
    case "Store Management": return <StoreManagementView catalog={catalog} locations={locations} onRefresh={fetchAll} />;
    case "Asset Management": return <AssetManagementView assets={assets} onRefresh={fetchAll} />;
    default: return <VaultOverview summary={dashSummary} catalog={catalog} />;
  }
}

const PIE_COLORS = ["#E31E24", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function VaultOverview({ summary, catalog }: { summary: DashSummary | null; catalog: CatalogItem[] }) {
  if (!summary) return <div className="text-center py-16 text-gray-400">No data</div>;
  const metrics = [
    { label: "Total Inventory Value", value: fmt(summary.totalValue), icon: TrendingUp, color: "text-blue-600", ring: "border-blue-200", bg: "bg-blue-50" },
    { label: "Total Items", value: summary.totalItems.toString(), icon: Boxes, color: "text-green-600", ring: "border-green-200", bg: "bg-green-50" },
    { label: "Active Warehouses", value: summary.activeWarehouses.toString(), icon: Warehouse, color: "text-purple-600", ring: "border-purple-200", bg: "bg-purple-50" },
    { label: "Pending Indents", value: summary.pendingIndents.toString(), icon: AlertTriangle, color: "text-amber-600", ring: "border-amber-200", bg: "bg-amber-50" },
  ];
  const pieData = Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  const mvTypeIcon: Record<string, typeof ArrowDownToLine> = { Inward: ArrowDownToLine, Outward: ArrowUpFromLine, Transfer: ArrowLeftRight, Adjustment: RefreshCw };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1><p className="text-sm text-gray-400 mt-0.5">Industrial-grade inventory overview</p></div>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => { const Icon = m.icon; return (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><div className="flex items-center gap-4"><div className={`w-11 h-11 rounded-full border-2 ${m.ring} ${m.bg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${m.color}`} /></div><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{m.label}</p><p className="text-xl font-bold text-gray-800 mt-0.5">{m.value}</p></div></div></div>
        ); })}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-bold text-gray-800">Value by Category</h2></div>
          <div className="p-5 h-[280px]">
            {pieData.length === 0 ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div> : (
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => [fmt(v), "Value"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} /><Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-gray-600">{v}</span>} /></PieChart></ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-bold text-gray-800">Recent Stock Movements</h2></div>
          <div className="divide-y divide-gray-50">
            {summary.recentMovements.length === 0 ? <div className="px-5 py-10 text-center text-gray-400 text-sm">No movements yet</div> : summary.recentMovements.slice(0, 8).map(mv => {
              const MvIcon = mvTypeIcon[mv.movementType] || ArrowLeftRight;
              const itemName = catalog.find(c => c.id === mv.itemId)?.name || `Item #${mv.itemId}`;
              return (
                <div key={mv.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0"><MvIcon className="w-4 h-4 text-gray-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{mv.movementType}: {itemName}</p><p className="text-xs text-gray-400">Qty: {mv.quantity} · {fmtDate(mv.movementDate || mv.createdAt)}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemMaster({ catalog, onRefresh }: { catalog: CatalogItem[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const filtered = useMemo(() => { if (!search.trim()) return catalog; const q = search.toLowerCase(); return catalog.filter(c => c.name.toLowerCase().includes(q) || c.sku.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)); }, [catalog, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Item & Product Master</h1><p className="text-sm text-gray-400 mt-0.5">Central catalog of raw materials and finished products</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add New</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Package className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No items found</p></div> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
          <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">HSN/SAC</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Global Stock</th>
          <th className="px-4 py-3 w-[40px]"></th>
        </tr></thead><tbody>
          {filtered.map(item => (
            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{item.name}</td>
              <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{item.sku}</td>
              <td className="px-4 py-3.5 text-xs text-gray-600">{item.category}</td>
              <td className="px-4 py-3.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.itemType === "Raw Material" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>{item.itemType}</span></td>
              <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{item.hsnSac}</td>
              <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-800">{fmt(parseFloat(item.unitPrice) || 0)}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{item.globalStock}</td>
              <td className="px-4 py-3.5"><button onClick={async () => { if (confirm("Delete this item?")) { await authFetch(`/api/vault/catalog/${item.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      {showModal && <AddItemModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddItemModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "General", itemType: "Raw Material", hsnSac: "", unitPrice: "", uom: "Nos", globalStock: "", reorderLevel: "10" });
  const handleSave = async () => {
    if (!form.name.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/vault/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, unitPrice: form.unitPrice || "0", globalStock: parseInt(form.globalStock) || 0, reorderLevel: parseInt(form.reorderLevel) || 10 }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Package className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">Add New Item</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Steel Rod 12mm" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">SKU</label><input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SR-12-001" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={form.itemType} onChange={e => setForm({ ...form, itemType: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Raw Material">Raw Material</option><option value="Finished Product">Finished Product</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">HSN/SAC</label><input type="text" value={form.hsnSac} onChange={e => setForm({ ...form, hsnSac: e.target.value })} placeholder="7213" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Unit Price (₹)</label><input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">UOM</label><input type="text" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Initial Stock</label><input type="number" value={form.globalStock} onChange={e => setForm({ ...form, globalStock: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Add Item</button>
        </div>
      </div>
    </div>
  );
}

function WarehouseStores({ locations, onRefresh }: { locations: Location[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Warehouses & Stores</h1><p className="text-sm text-gray-400 mt-0.5">Manage physical storage locations</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Location</button></div>
      {locations.length === 0 ? <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Warehouse className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No locations yet</p></div> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Location Name</th>
          <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
          <th className="px-4 py-3 w-[40px]"></th>
        </tr></thead><tbody>
          {locations.map(loc => (
            <tr key={loc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{loc.locationName}</td>
              <td className="px-4 py-3.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${loc.locationType === "Warehouse" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-teal-50 text-teal-600 border-teal-200"}`}>{loc.locationType}</span></td>
              <td className="px-4 py-3.5 text-right text-sm text-gray-700">{loc.capacity.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{loc.manager || "—"}</td>
              <td className="px-4 py-3.5"><button onClick={async () => { if (confirm("Delete this location?")) { await authFetch(`/api/vault/locations/${loc.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      {showModal && <AddLocationModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddLocationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ locationName: "", locationType: "Warehouse", capacity: "", manager: "", address: "" });
  const handleSave = async () => {
    if (!form.locationName.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/vault/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) || 0 }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Warehouse className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">Add Location</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Location Name</label><input type="text" value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={form.locationType} onChange={e => setForm({ ...form, locationType: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Warehouse">Warehouse / Godown</option><option value="Store">Store / POS</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Manager</label><input type="text" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.locationName.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Add Location</button>
        </div>
      </div>
    </div>
  );
}

function StockMovementsView({ movements, catalog, locations, onRefresh }: { movements: Movement[]; catalog: CatalogItem[]; locations: Location[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const mvTypeIcon: Record<string, string> = { Inward: "text-green-600", Outward: "text-red-500", Transfer: "text-blue-600", Adjustment: "text-amber-600" };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1><p className="text-sm text-gray-400 mt-0.5">Ledger of all inventory movements</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><ArrowLeftRight className="w-4 h-4" /> Record Movement</button></div>
      {movements.length === 0 ? <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><ArrowLeftRight className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No movements recorded</p></div> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Item</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">From</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">To</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ref#</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">By</th>
        </tr></thead><tbody>
          {movements.map(mv => (
            <tr key={mv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="px-5 py-3.5 text-xs text-gray-500">{fmtDate(mv.movementDate || mv.createdAt)}</td>
              <td className="px-4 py-3.5"><span className={`text-xs font-semibold ${mvTypeIcon[mv.movementType] || "text-gray-500"}`}>{mv.movementType}</span></td>
              <td className="px-4 py-3.5 text-sm text-gray-800 font-medium">{catalog.find(c => c.id === mv.itemId)?.name || `#${mv.itemId}`}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{mv.quantity}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{mv.fromLocationId ? locations.find(l => l.id === mv.fromLocationId)?.locationName || `#${mv.fromLocationId}` : "—"}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{mv.toLocationId ? locations.find(l => l.id === mv.toLocationId)?.locationName || `#${mv.toLocationId}` : "—"}</td>
              <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{mv.referenceNumber || "—"}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{mv.performedBy || "—"}</td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      {showModal && <RecordMovementModal catalog={catalog} locations={locations} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function RecordMovementModal({ catalog, locations, onClose, onSaved }: { catalog: CatalogItem[]; locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", movementType: "Inward", quantity: "", fromLocationId: "", toLocationId: "", referenceNumber: "", notes: "", performedBy: "", movementDate: new Date().toISOString().split("T")[0] });
  const showFrom = form.movementType === "Transfer" || form.movementType === "Outward";
  const showTo = form.movementType === "Transfer" || form.movementType === "Inward" || form.movementType === "Adjustment";
  const handleSave = async () => {
    if (!form.itemId || !form.quantity) return; setSaving(true);
    try {
      const payload: any = { ...form, itemId: parseInt(form.itemId), quantity: parseInt(form.quantity), movementDate: form.movementDate ? new Date(form.movementDate).toISOString() : undefined };
      if (form.fromLocationId) payload.fromLocationId = parseInt(form.fromLocationId); else delete payload.fromLocationId;
      if (form.toLocationId) payload.toLocationId = parseInt(form.toLocationId); else delete payload.toLocationId;
      const res = await authFetch("/api/vault/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><ArrowLeftRight className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">Record Movement</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Movement Type</label><select value={form.movementType} onChange={e => setForm({ ...form, movementType: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Inward">Inward (GRN)</option><option value="Outward">Outward</option><option value="Transfer">Transfer</option><option value="Adjustment">Adjustment</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item</label><select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select item...</option>{catalog.map(c => <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label><input type="date" value={form.movementDate} onChange={e => setForm({ ...form, movementDate: e.target.value })} className={inputCls} /></div>
          </div>
          {showFrom && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">From Location</label><select value={form.fromLocationId} onChange={e => setForm({ ...form, fromLocationId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.locationName}</option>)}</select></div>}
          {showTo && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">To Location</label><select value={form.toLocationId} onChange={e => setForm({ ...form, toLocationId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.locationName}</option>)}</select></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reference #</label><input type="text" value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} placeholder="GRN-001" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Performed By</label><input type="text" value={form.performedBy} onChange={e => setForm({ ...form, performedBy: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.itemId || !form.quantity} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Record</button>
        </div>
      </div>
    </div>
  );
}

function MaterialIssueView({ indents, catalog, locations, onRefresh }: { indents: Indent[]; catalog: CatalogItem[]; locations: Location[]; onRefresh: () => void }) {
  const [tab, setTab] = useState<"pending" | "issued">("pending");
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [issueTarget, setIssueTarget] = useState<Indent | null>(null);
  const pending = indents.filter(i => i.status === "Pending" || i.status === "Approved");
  const issued = indents.filter(i => i.status === "Issued" || i.status === "Rejected");

  const handleIssue = async (indent: Indent, approvedQty: number, locationId: number) => {
    await authFetch(`/api/vault/indents/${indent.id}/issue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedQty, issuedFromLocationId: locationId }) });
    setIssueTarget(null); onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Material Issue</h1><p className="text-sm text-gray-400 mt-0.5">Industrial requisition and issue workflow</p></div>
        <button onClick={() => setShowIndentModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create Indent</button></div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("pending")} className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${tab === "pending" ? "bg-white text-[#E31E24] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Pending Indents ({pending.length})</button>
        <button onClick={() => setTab("issued")} className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${tab === "issued" ? "bg-white text-[#E31E24] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Issued Logs ({issued.length})</button>
      </div>
      {(tab === "pending" ? pending : issued).length === 0 ? <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No {tab} indents</p></div> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Item</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Requested By</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Req Qty</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Appr Qty</th>
          <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          {tab === "pending" && <th className="px-4 py-3 w-[80px]"></th>}
        </tr></thead><tbody>
          {(tab === "pending" ? pending : issued).map(ind => (
            <tr key={ind.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs text-gray-500">{fmtDate(ind.requestDate)}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{catalog.find(c => c.id === ind.itemId)?.name || `#${ind.itemId}`}</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{ind.requestedBy} {ind.department ? `(${ind.department})` : ""}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{ind.requestedQty}</td>
              <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-600">{ind.approvedQty || "—"}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={ind.status} /></td>
              {tab === "pending" && <td className="px-4 py-3.5"><button onClick={() => setIssueTarget(ind)} className="px-3 py-1.5 text-[10px] font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">Issue</button></td>}
            </tr>
          ))}
        </tbody></table></div>
      )}
      {showIndentModal && <CreateIndentModal catalog={catalog} onClose={() => setShowIndentModal(false)} onSaved={() => { setShowIndentModal(false); onRefresh(); }} />}
      {issueTarget && <IssueModal indent={issueTarget} catalog={catalog} locations={locations.filter(l => l.locationType === "Warehouse")} onClose={() => setIssueTarget(null)} onIssue={handleIssue} />}
    </div>
  );
}

function CreateIndentModal({ catalog, onClose, onSaved }: { catalog: CatalogItem[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", requestedQty: "", requestedBy: "", department: "", purpose: "" });
  const handleSave = async () => {
    if (!form.itemId || !form.requestedQty) return; setSaving(true);
    try { const res = await authFetch("/api/vault/indents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, itemId: parseInt(form.itemId), requestedQty: parseInt(form.requestedQty) }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Create Material Indent</h2><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item</label><select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select item...</option>{catalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Requested Qty</label><input type="number" value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Requested By</label><input type="text" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Purpose</label><textarea rows={3} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={inputCls + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.itemId || !form.requestedQty} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Submit</button>
        </div>
      </div>
    </div>
  );
}

function IssueModal({ indent, catalog, locations, onClose, onIssue }: { indent: Indent; catalog: CatalogItem[]; locations: Location[]; onClose: () => void; onIssue: (indent: Indent, qty: number, locId: number) => void }) {
  const [approvedQty, setApprovedQty] = useState(indent.requestedQty.toString());
  const [locationId, setLocationId] = useState("");
  const itemName = catalog.find(c => c.id === indent.itemId)?.name || `Item #${indent.itemId}`;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Issue Material</h2><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Requested Item</p><p className="text-sm font-bold text-gray-800">{itemName}</p><p className="text-xs text-gray-500 mt-1">Requested by: {indent.requestedBy} · Qty: {indent.requestedQty}</p></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Approved Issue Qty</label><input type="number" value={approvedQty} onChange={e => setApprovedQty(e.target.value)} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Issue from Warehouse</label><select value={locationId} onChange={e => setLocationId(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select warehouse...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.locationName}</option>)}</select></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onIssue(indent, parseInt(approvedQty) || 0, parseInt(locationId) || 0)} disabled={!locationId || !approvedQty} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">Issue Material</button>
        </div>
      </div>
    </div>
  );
}

function StoreManagementView({ catalog, locations, onRefresh }: { catalog: CatalogItem[]; locations: Location[]; onRefresh: () => void }) {
  const [showSaleModal, setShowSaleModal] = useState(false);
  const stores = locations.filter(l => l.locationType === "Store");
  const finishedProducts = catalog.filter(c => c.itemType === "Finished Product");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Store Management</h1><p className="text-sm text-gray-400 mt-0.5">Retail and distribution — finished products</p></div>
        <button onClick={() => setShowSaleModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Store className="w-4 h-4" /> Create Sale / Issue</button></div>
      {stores.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {stores.map(s => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Store className="w-5 h-5 text-teal-600" /></div><div><p className="text-sm font-bold text-gray-800">{s.locationName}</p><p className="text-xs text-gray-400">Manager: {s.manager || "—"}</p></div></div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100"><h2 className="text-sm font-bold text-gray-800">Available Finished Products ({finishedProducts.length})</h2></div>
        {finishedProducts.length === 0 ? <div className="px-5 py-10 text-center text-gray-400 text-sm">No finished products in catalog</div> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
          </tr></thead><tbody>
            {finishedProducts.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{p.sku}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{p.category}</td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-800">{fmt(parseFloat(p.unitPrice) || 0)}</td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{p.globalStock}</td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
      {showSaleModal && <StoreSaleModal catalog={finishedProducts} locations={stores} onClose={() => setShowSaleModal(false)} onSaved={() => { setShowSaleModal(false); onRefresh(); }} />}
    </div>
  );
}

function StoreSaleModal({ catalog, locations, onClose, onSaved }: { catalog: CatalogItem[]; locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", quantity: "", fromLocationId: "", performedBy: "", notes: "" });
  const handleSave = async () => {
    if (!form.itemId || !form.quantity || !form.fromLocationId) return; setSaving(true);
    try {
      const res = await authFetch("/api/vault/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: parseInt(form.itemId), movementType: "Outward", quantity: parseInt(form.quantity), fromLocationId: parseInt(form.fromLocationId), referenceNumber: `SALE-${Date.now()}`, performedBy: form.performedBy, notes: form.notes }) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Create Sale / Issue</h2><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Product</label><select value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select product...</option>{catalog.map(c => <option key={c.id} value={c.id}>{c.name} (Stock: {c.globalStock})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">From Store</label><select value={form.fromLocationId} onChange={e => setForm({ ...form, fromLocationId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select store...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.locationName}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Sold By</label><input type="text" value={form.performedBy} onChange={e => setForm({ ...form, performedBy: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.itemId || !form.quantity || !form.fromLocationId} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">Create Sale</button>
        </div>
      </div>
    </div>
  );
}

function AssetManagementView({ assets, onRefresh }: { assets: Asset[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return assets; const q = search.toLowerCase(); return assets.filter(a => a.assetName.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q) || a.assignedTo.toLowerCase().includes(q)); }, [assets, search]);

  const handleUpdateStatus = async (id: number, status: string) => {
    await authFetch(`/api/vault/assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Asset Management</h1><p className="text-sm text-gray-400 mt-0.5">Fixed assets — machinery, equipment, vehicles</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Asset</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><HardDrive className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No assets found</p></div> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Asset Name</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Serial Number</th>
          <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
          <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Purchase Value</th>
          <th className="px-4 py-3 w-[120px]"></th>
        </tr></thead><tbody>
          {filtered.map(asset => (
            <tr key={asset.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{asset.assetName}</td>
              <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{asset.serialNumber || "—"}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={asset.status} /></td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{asset.assignedTo || "—"}</td>
              <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-800">{fmt(parseFloat(asset.purchaseValue) || 0)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {asset.status !== "Allocated" && <button onClick={() => handleUpdateStatus(asset.id, "Allocated")} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Allocate"><UserCheck className="w-3.5 h-3.5" /></button>}
                  {asset.status !== "Maintenance" && <button onClick={() => handleUpdateStatus(asset.id, "Maintenance")} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Log Maintenance"><Wrench className="w-3.5 h-3.5" /></button>}
                  <button onClick={async () => { if (confirm("Delete this asset?")) { await authFetch(`/api/vault/assets/${asset.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      {showModal && <AddAssetModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddAssetModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ assetName: "", serialNumber: "", category: "Equipment", status: "Active", assignedTo: "", purchaseValue: "", purchaseDate: "" });
  const handleSave = async () => {
    if (!form.assetName.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/vault/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, purchaseValue: form.purchaseValue || "0", purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><HardDrive className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">Add Asset</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Asset Name</label><input type="text" value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} placeholder="e.g. CNC Milling Machine" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Serial Number</label><input type="text" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Active">Active</option><option value="Allocated">Allocated</option><option value="Maintenance">Maintenance</option><option value="Sold">Sold</option></select></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assigned To</label><input type="text" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Purchase Value (₹)</label><input type="number" value={form.purchaseValue} onChange={e => setForm({ ...form, purchaseValue: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className={inputCls} /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.assetName.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Add Asset</button>
        </div>
      </div>
    </div>
  );
}
