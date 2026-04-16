import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForge } from "../hooks/useForge";
import { useForgeSub } from "../hooks/useForgeSub";
import type {
  BOM,
  BOMMaterial,
  BOMRouting,
  CatalogItem,
  DashSummary,
  DowntimeLog,
  ForgeSub,
  Location,
  MaterialConsumption,
  ProductionLogEntry,
  Project,
  QCRecord,
  Task,
  WOUnit,
  WorkOrder,
  Workstation,
} from "../types";
import { fmtCurrency, fmtDate, fmtDateTime, inputCls, selectCls } from "../utils/forgeUtils";
import {
  Search, Plus, X, Factory, ClipboardList, ListChecks, Shield, Calendar,
  LayoutDashboard, Trash2, CheckCircle, XCircle, AlertTriangle, Clock,
  ArrowRight, Zap, Target, TrendingUp, Wrench, Play, Pause, Settings,
  ChevronRight, Eye, Package, ArrowLeft, ChevronDown, ChevronUp, Edit,
  BarChart3, FileText, Timer, Users, MapPin, DollarSign,
} from "lucide-react";


function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = {
    Draft: "bg-gray-50 text-gray-500 border-gray-200", Planned: "bg-indigo-50 text-indigo-600 border-indigo-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-200", QC: "bg-purple-50 text-purple-600 border-purple-200",
    Completed: "bg-green-50 text-green-600 border-green-200", "On Hold": "bg-amber-50 text-amber-600 border-amber-200",
    Cancelled: "bg-gray-100 text-gray-400 border-gray-200",
    Active: "bg-green-50 text-green-600 border-green-200", Idle: "bg-amber-50 text-amber-600 border-amber-200",
    Maintenance: "bg-orange-50 text-orange-500 border-orange-200", Breakdown: "bg-red-50 text-red-500 border-red-200",
    Low: "bg-gray-50 text-gray-500 border-gray-200", Normal: "bg-blue-50 text-blue-600 border-blue-200",
    High: "bg-amber-50 text-amber-600 border-amber-200", Urgent: "bg-red-50 text-red-500 border-red-200",
    Queued: "bg-gray-50 text-gray-500 border-gray-200", "QC Pending": "bg-purple-50 text-purple-600 border-purple-200",
    "QC Passed": "bg-green-50 text-green-600 border-green-200", "QC Failed": "bg-red-50 text-red-500 border-red-200",
    Rework: "bg-orange-50 text-orange-600 border-orange-200", Scrapped: "bg-red-100 text-red-700 border-red-300",
    Obsolete: "bg-gray-100 text-gray-400 border-gray-200",
    Passed: "bg-green-50 text-green-600 border-green-200", Failed: "bg-red-50 text-red-500 border-red-200",
    Conditional: "bg-amber-50 text-amber-600 border-amber-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

export default function ForgeDashboardView() {
  const sub = useForgeSub() as ForgeSub;
  const {
    workstations,
    boms,
    workOrders,
    qcRecords,
    downtimeLogs,
    dashSummary,
    catalogItems,
    locations,
    projects,
    loading,
    fetchAll,
  } = useForge();

  if (loading) return <div className="text-center py-16 text-gray-400">Loading production data...</div>;

  switch (sub) {
    case "Production Dashboard": return <ProductionDashboardView summary={dashSummary} workOrders={workOrders} workstations={workstations} />;
    case "Bill of Materials": return <BOMView boms={boms} catalogItems={catalogItems} workstations={workstations} onRefresh={fetchAll} />;
    case "Workstations & Routing": return <WorkstationsView workstations={workstations} locations={locations} onRefresh={fetchAll} />;
    case "Work Orders": return <WorkOrdersView workOrders={workOrders} workstations={workstations} boms={boms} catalogItems={catalogItems} locations={locations} projects={projects} onRefresh={fetchAll} />;
    case "Quality Control": return <QualityControlView qcRecords={qcRecords} workOrders={workOrders} onRefresh={fetchAll} />;
    case "Downtime Logs": return <DowntimeLogsView downtimeLogs={downtimeLogs} workstations={workstations} workOrders={workOrders} onRefresh={fetchAll} />;
    default: return <ProductionDashboardView summary={dashSummary} workOrders={workOrders} workstations={workstations} />;
  }
}

function ProductionDashboardView({ summary, workOrders, workstations }: { summary: DashSummary | null; workOrders: WorkOrder[]; workstations: Workstation[] }) {
  const activeWOs = workOrders.filter(wo => wo.status === "In Progress" || wo.status === "QC");
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1><p className="text-sm text-gray-400 mt-0.5">Real-time manufacturing overview</p></div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Active Work Orders" value={summary?.activeWorkOrders ?? 0} color="blue" />
        <MetricCard icon={Target} label="Today's Yield" value={summary?.todayYield ?? 0} suffix=" units" color="green" />
        <MetricCard icon={TrendingUp} label="OEE" value={summary?.oee ?? 0} suffix="%" color="purple" />
        <MetricCard icon={AlertTriangle} label="Scrap Rate" value={summary?.scrapRate ?? 0} suffix="%" color="red" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Materials Cost" value={0} valueStr={fmtCurrency(summary?.totalMaterialsCost ?? 0)} color="blue" />
        <MetricCard icon={Users} label="Labor Cost" value={0} valueStr={fmtCurrency(summary?.totalLaborCost ?? 0)} color="green" />
        <MetricCard icon={BarChart3} label="Total Production Cost" value={0} valueStr={fmtCurrency(summary?.totalProductionCost ?? 0)} color="purple" />
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-2">Workstation Status</p>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Active</span><span className="text-sm font-bold text-green-600">{summary?.workstations.active ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-xs text-gray-500">Idle</span><span className="text-sm font-bold text-amber-500">{summary?.workstations.idle ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-xs text-gray-500">Maintenance</span><span className="text-sm font-bold text-orange-500">{summary?.workstations.maintenance ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-xs text-gray-500">Breakdown</span><span className="text-sm font-bold text-red-500">{summary?.workstations.breakdown ?? 0}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Active Work Orders</h3>
        {activeWOs.length === 0 ? <p className="text-sm text-gray-400 py-6 text-center">No active work orders</p> : (
          <div className="space-y-2">
            {activeWOs.map(wo => {
              const progress = wo.targetQty > 0 ? Math.round((wo.producedQty / wo.targetQty) * 100) : 0;
              return (
                <div key={wo.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{wo.woNumber}</span>
                      <StatusPill status={wo.status} />
                      <StatusPill status={wo.priority} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{wo.productName}</p>
                    <p className="text-xs text-gray-400">Step {wo.currentRoutingStep}/{wo.totalRoutingSteps} · {fmtCurrency(wo.totalCost)} cost</p>
                  </div>
                  <div className="w-[200px]">
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{wo.producedQty}/{wo.targetQty}</span><span className="font-semibold text-gray-600">{progress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#E31E24] rounded-full h-2 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, valueStr, suffix, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; valueStr?: string; suffix?: string; color: string }) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" },
    red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-500" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>
        <div><p className="text-xs text-gray-400">{label}</p><p className={`text-xl font-bold ${c.text}`}>{valueStr || `${value}${suffix || ""}`}</p></div>
      </div>
    </div>
  );
}

function BOMView({ boms, catalogItems, workstations, onRefresh }: { boms: BOM[]; catalogItems: CatalogItem[]; workstations: Workstation[]; onRefresh: () => void }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [viewBom, setViewBom] = useState<BOM | null>(null);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return boms; const q = search.toLowerCase(); return boms.filter(b => b.productName.toLowerCase().includes(q) || b.productCode.toLowerCase().includes(q)); }, [boms, search]);

  const handleView = async (bomId: number) => {
    const res = await authFetch(`/api/forge/bom/${bomId}`);
    if (res.ok) setViewBom(await res.json());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Bill of Materials (BOM)</h1><p className="text-sm text-gray-400 mt-0.5">Define material requirements and operational routing for products</p></div>
        <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create BOM</button>
      </div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search BOMs..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={ClipboardList} text="No BOMs defined yet" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bom => (
            <div key={bom.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:border-[#E31E24]/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{bom.productName}</p>
                    <StatusPill status={bom.bomStatus} />
                  </div>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{bom.productCode || "No code"} · v{bom.version}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleView(bom.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { if (confirm("Delete this BOM?")) { await authFetch(`/api/forge/bom/${bom.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>Output: {bom.outputQty} {bom.uom}</span>
                <span>·</span>
                <span>Est. Cost: {fmtCurrency(bom.estimatedCostPerUnit)}/{bom.uom}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showBuilder && <BOMBuilder catalogItems={catalogItems} workstations={workstations} onClose={() => setShowBuilder(false)} onSaved={() => { setShowBuilder(false); onRefresh(); }} />}
      {viewBom && <BOMDetailModal bom={viewBom} onClose={() => setViewBom(null)} />}
    </div>
  );
}

function BOMDetailModal({ bom, onClose }: { bom: BOM; onClose: () => void }) {
  return (
    <Modal title={`BOM: ${bom.productName}`} icon={ClipboardList} onClose={onClose} wide>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-400">Product Code</p><p className="text-sm font-semibold text-gray-800">{bom.productCode || "—"}</p></div>
          <div><p className="text-xs text-gray-400">Version</p><p className="text-sm font-semibold text-gray-800">v{bom.version}</p></div>
          <div><p className="text-xs text-gray-400">Status</p><StatusPill status={bom.bomStatus} /></div>
          <div><p className="text-xs text-gray-400">Est. Cost/Unit</p><p className="text-sm font-semibold text-gray-800">{fmtCurrency(bom.estimatedCostPerUnit)}</p></div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-[#E31E24]" /> Material Requirements</h3>
          {(!bom.materials || bom.materials.length === 0) ? <p className="text-xs text-gray-400 py-3">No materials added</p> : (
            <DataTable headers={["Material", "Qty", "UOM", "Wastage %"]}>
              {bom.materials.map(mat => (
                <tr key={mat.id} className="border-b border-gray-50"><td className="px-5 py-3 text-sm text-gray-800">{mat.itemName}</td><td className="px-4 py-3 text-sm font-bold text-right text-gray-800">{mat.qty}</td><td className="px-4 py-3 text-xs text-gray-500">{mat.uom}</td><td className="px-4 py-3 text-xs text-gray-500 text-right">{mat.wastagePercent}%</td></tr>
              ))}
            </DataTable>
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Factory className="w-4 h-4 text-[#E31E24]" /> Operational Routing</h3>
          {(!bom.routing || bom.routing.length === 0) ? <p className="text-xs text-gray-400 py-3">No routing defined</p> : (
            <div className="space-y-2">
              {bom.routing.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E31E24]/10 flex items-center justify-center text-xs font-bold text-[#E31E24]">{r.sequenceNo}</div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{r.operationName || "Operation"}</p>
                      {r.hasQcCheck && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 font-semibold">QC</span>}
                    </div>
                    <p className="text-xs text-gray-400">{r.workstationName} · {r.estimatedMinutes} min + {r.setupTimeMinutes} min setup</p>
                    {r.sopReference && <p className="text-xs text-blue-500 mt-0.5">SOP: {r.sopReference}</p>}
                  </div>
                  {i < bom.routing!.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface MatLine { itemName: string; itemId: string; qty: string; uom: string; wastagePercent: string; unitPrice: string; }
interface RouteLine { workstationId: string; workstationName: string; operationName: string; estimatedMinutes: string; setupTimeMinutes: string; sopReference: string; hasQcCheck: boolean; qcChecklistJson: string; consumableMaterials: string; }

function BOMBuilder({ catalogItems, workstations, onClose, onSaved }: { catalogItems: CatalogItem[]; workstations: Workstation[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productName: "", productCode: "", uom: "Nos", outputQty: "1", notes: "", bomStatus: "Draft", productItemId: "" });
  const [materials, setMaterials] = useState<MatLine[]>([{ itemName: "", itemId: "", qty: "1", uom: "Nos", wastagePercent: "0", unitPrice: "0" }]);
  const [routing, setRouting] = useState<RouteLine[]>([{ workstationId: "", workstationName: "", operationName: "", estimatedMinutes: "0", setupTimeMinutes: "0", sopReference: "", hasQcCheck: false, qcChecklistJson: "", consumableMaterials: "" }]);

  const addMat = () => setMaterials([...materials, { itemName: "", itemId: "", qty: "1", uom: "Nos", wastagePercent: "0", unitPrice: "0" }]);
  const removeMat = (i: number) => { if (materials.length > 1) setMaterials(materials.filter((_, idx) => idx !== i)); };
  const updateMat = (i: number, f: string, v: any) => { const n = [...materials]; (n[i] as any)[f] = v; setMaterials(n); };
  const selectCatalogItem = (i: number, itemId: string) => {
    const item = catalogItems.find(c => c.id === parseInt(itemId));
    if (item) { const n = [...materials]; n[i] = { ...n[i], itemId, itemName: item.name, uom: item.uom, unitPrice: item.unitPrice }; setMaterials(n); }
  };

  const addRoute = () => setRouting([...routing, { workstationId: "", workstationName: "", operationName: "", estimatedMinutes: "0", setupTimeMinutes: "0", sopReference: "", hasQcCheck: false, qcChecklistJson: "", consumableMaterials: "" }]);
  const removeRoute = (i: number) => { if (routing.length > 1) setRouting(routing.filter((_, idx) => idx !== i)); };
  const updateRoute = (i: number, f: string, v: any) => { const n = [...routing]; (n[i] as any)[f] = v; setRouting(n); };
  const selectWorkstation = (i: number, wsId: string) => {
    const ws = workstations.find(w => w.id === parseInt(wsId));
    if (ws) { const n = [...routing]; n[i] = { ...n[i], workstationId: wsId, workstationName: ws.name }; setRouting(n); }
  };

  const totalMaterialCost = materials.reduce((s, m) => {
    const qty = parseFloat(m.qty) || 0; const wastage = parseFloat(m.wastagePercent) || 0;
    const price = parseFloat(m.unitPrice) || 0;
    return s + qty * (1 + wastage / 100) * price;
  }, 0);

  const totalLaborCost = routing.reduce((s, r) => {
    const ws = workstations.find(w => w.id === parseInt(r.workstationId));
    const hours = ((parseInt(r.estimatedMinutes) || 0) + (parseInt(r.setupTimeMinutes) || 0)) / 60;
    return s + hours * parseFloat(ws?.costPerHour || "0");
  }, 0);

  const handleSave = async () => {
    if (!form.productName.trim()) return; setSaving(true);
    const payload = {
      ...form, outputQty: parseInt(form.outputQty) || 1,
      productItemId: form.productItemId ? parseInt(form.productItemId) : null,
      materials: materials.filter(m => m.itemName.trim()).map(m => ({ itemName: m.itemName, itemId: m.itemId ? parseInt(m.itemId) : null, qty: m.qty, uom: m.uom, wastagePercent: m.wastagePercent })),
      routing: routing.filter(r => r.workstationId).map((r, i) => ({
        sequenceNo: i + 1, workstationId: parseInt(r.workstationId), workstationName: r.workstationName,
        operationName: r.operationName, estimatedMinutes: parseInt(r.estimatedMinutes) || 0,
        setupTimeMinutes: parseInt(r.setupTimeMinutes) || 0, sopReference: r.sopReference || null,
        hasQcCheck: r.hasQcCheck, qcChecklistJson: r.qcChecklistJson || null,
        consumableMaterials: r.consumableMaterials || null,
      })),
    };
    try { const res = await authFetch("/api/forge/bom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">BOM Builder</h2></div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Name</label><input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Steel Column" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Code</label><input type="text" value={form.productCode} onChange={e => setForm({ ...form, productCode: e.target.value })} placeholder="COL-001" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select value={form.bomStatus} onChange={e => setForm({ ...form, bomStatus: e.target.value })} className={selectCls}><option value="Draft">Draft</option><option value="Active">Active</option><option value="Obsolete">Obsolete</option></select></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Output Qty</label><input type="number" value={form.outputQty} onChange={e => setForm({ ...form, outputQty: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">UOM</label><input type="text" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} className={inputCls} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1.5">Product (from Vault)</label>
              <select value={form.productItemId} onChange={e => setForm({ ...form, productItemId: e.target.value })} className={selectCls}>
                <option value="">Select finished product...</option>
                {catalogItems.map(ci => <option key={ci.id} value={ci.id}>{ci.name} ({ci.sku})</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-[#E31E24]" /> Material Requirements</h3><button onClick={addMat} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Material</button></div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Material (from Vault)</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[80px]">Qty</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[60px]">UOM</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[70px]">Wastage%</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[90px]">Unit Cost</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[90px]">Ext. Cost</th>
                <th className="w-[36px]"></th>
              </tr></thead><tbody>
                {materials.map((mat, i) => {
                  const extCost = (parseFloat(mat.qty) || 0) * (1 + (parseFloat(mat.wastagePercent) || 0) / 100) * (parseFloat(mat.unitPrice) || 0);
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-2 py-1.5">
                        <select value={mat.itemId} onChange={e => selectCatalogItem(i, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] cursor-pointer">
                          <option value="">Select from Vault...</option>
                          {catalogItems.map(ci => <option key={ci.id} value={ci.id}>{ci.name} ({ci.sku})</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1.5"><input type="number" value={mat.qty} onChange={e => updateMat(i, "qty", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                      <td className="px-1 py-1.5"><input type="text" value={mat.uom} readOnly className="w-full px-2 py-1.5 text-xs border border-gray-100 rounded bg-gray-50 text-gray-500" /></td>
                      <td className="px-1 py-1.5"><input type="number" value={mat.wastagePercent} onChange={e => updateMat(i, "wastagePercent", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                      <td className="px-2 py-1.5 text-right text-xs text-gray-500">{fmtCurrency(mat.unitPrice)}</td>
                      <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">{fmtCurrency(extCost)}</td>
                      <td><button onClick={() => removeMat(i)} className="p-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody></table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Factory className="w-4 h-4 text-[#E31E24]" /> Operational Routing</h3><button onClick={addRoute} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Step</button></div>
            <div className="space-y-3">
              {routing.map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#E31E24]/10 flex items-center justify-center text-xs font-bold text-[#E31E24]">{i + 1}</div>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <select value={r.workstationId} onChange={e => selectWorkstation(i, e.target.value)} className="px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] cursor-pointer">
                        <option value="">Workstation...</option>
                        {workstations.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                      </select>
                      <input type="text" value={r.operationName} onChange={e => updateRoute(i, "operationName", e.target.value)} placeholder="Operation name" className="px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24]" />
                      <input type="number" value={r.estimatedMinutes} onChange={e => updateRoute(i, "estimatedMinutes", e.target.value)} placeholder="Est. min" className="px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                      <input type="number" value={r.setupTimeMinutes} onChange={e => updateRoute(i, "setupTimeMinutes", e.target.value)} placeholder="Setup min" className="px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <button onClick={() => removeRoute(i)} className="p-1 text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-10">
                    <input type="text" value={r.sopReference} onChange={e => updateRoute(i, "sopReference", e.target.value)} placeholder="SOP Ref (e.g. SOP-WEL-001)" className="px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24]" />
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={r.hasQcCheck} onChange={e => updateRoute(i, "hasQcCheck", e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#E31E24] focus:ring-[#E31E24]" />
                      QC Required at this step
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-400">Total Material Cost</p><p className="text-sm font-bold text-gray-800">{fmtCurrency(totalMaterialCost)}</p></div>
              <div><p className="text-xs text-gray-400">Total Labor Cost</p><p className="text-sm font-bold text-gray-800">{fmtCurrency(totalLaborCost)}</p></div>
              <div><p className="text-xs text-gray-400">Estimated Cost/Unit</p><p className="text-sm font-bold text-[#E31E24]">{fmtCurrency((totalMaterialCost + totalLaborCost) / (parseInt(form.outputQty) || 1))}</p></div>
            </div>
          </div>

          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.productName.trim()} className="px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-40 shadow-lg shadow-red-500/15">{saving ? "Saving..." : "Save BOM"}</button>
        </div>
      </div>
    </div>
  );
}

function WorkstationsView({ workstations, locations, onRefresh }: { workstations: Workstation[]; locations: Location[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Workstations & Routing</h1><p className="text-sm text-gray-400 mt-0.5">Manage production centers</p></div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15"><Plus className="w-4 h-4" /> Add Workstation</button>
      </div>
      {workstations.length === 0 ? <EmptyState icon={Settings} text="No workstations configured" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workstations.map(ws => (
            <div key={ws.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 group hover:border-[#E31E24]/30 transition-colors">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-bold text-gray-800">{ws.name}</p><p className="text-xs text-gray-400 mt-0.5">{ws.type} · {fmtCurrency(ws.costPerHour)}/hr</p></div>
                <div className="flex items-center gap-2">
                  <StatusPill status={ws.currentStatus} />
                  <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/workstations/${ws.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                {ws.description && <p>{ws.description}</p>}
                <p>Capacity: {ws.capacity} job(s) · {ws.maintenanceSchedule || "No maintenance schedule"}</p>
                {ws.nextMaintenanceDate && <p className="text-amber-600">Next maintenance: {fmtDate(ws.nextMaintenanceDate)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddWorkstationModal locations={locations} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onRefresh(); }} />}
    </div>
  );
}

function AddWorkstationModal({ locations, onClose, onSaved }: { locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Machine", costPerHour: "0", description: "", locationId: "", capacity: "1", maintenanceSchedule: "", lastMaintenanceDate: "", nextMaintenanceDate: "" });

  const handleSave = async () => {
    if (!form.name.trim()) return; setSaving(true);
    const payload = { ...form, costPerHour: form.costPerHour, capacity: parseInt(form.capacity) || 1, locationId: form.locationId ? parseInt(form.locationId) : null, lastMaintenanceDate: form.lastMaintenanceDate || null, nextMaintenanceDate: form.nextMaintenanceDate || null };
    try { const res = await authFetch("/api/forge/workstations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Add Workstation" icon={Settings} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Workstation Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={selectCls}><option>Machine</option><option>Manual Line</option><option>Vendor</option><option>QC Desk</option></select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Cost/Hour (₹)</label><input type="number" value={form.costPerHour} onChange={e => setForm({ ...form, costPerHour: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label><select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} className={selectCls}><option value="">Select location...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Maintenance Schedule</label><input value={form.maintenanceSchedule} onChange={e => setForm({ ...form, maintenanceSchedule: e.target.value })} placeholder="e.g. Every 500 hours" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Last Maintenance</label><input type="date" value={form.lastMaintenanceDate} onChange={e => setForm({ ...form, lastMaintenanceDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Next Maintenance</label><input type="date" value={form.nextMaintenanceDate} onChange={e => setForm({ ...form, nextMaintenanceDate: e.target.value })} className={inputCls} /></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-40">{saving ? "Saving..." : "Add Workstation"}</button>
      </div>
    </Modal>
  );
}

function WorkOrdersView({ workOrders, workstations, boms, catalogItems, locations, projects, onRefresh }: { workOrders: WorkOrder[]; workstations: Workstation[]; boms: BOM[]; catalogItems: CatalogItem[]; locations: Location[]; projects: Project[]; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [detailWO, setDetailWO] = useState<number | null>(null);
  const columns = ["Draft", "In Progress", "QC", "Completed"] as const;

  if (detailWO) return <WorkOrderDetail woId={detailWO} onBack={() => { setDetailWO(null); onRefresh(); }} />;

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await authFetch(`/api/forge/work-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed"); }
      onRefresh();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Work Orders</h1><p className="text-sm text-gray-400 mt-0.5">Production job tracking</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15"><Plus className="w-4 h-4" /> Create Work Order</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => {
          const items = workOrders.filter(wo => wo.status === col);
          return (
            <div key={col} className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-600 uppercase">{col}</h3>
                <span className="text-xs font-mono text-gray-400">{items.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[200px] max-h-[65vh] overflow-y-auto">
                {items.map(wo => {
                  const progress = wo.targetQty > 0 ? Math.round((wo.producedQty / wo.targetQty) * 100) : 0;
                  return (
                    <div key={wo.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => setDetailWO(wo.id)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gray-400">{wo.woNumber}</span>
                        <StatusPill status={wo.priority} />
                      </div>
                      <p className="text-sm font-medium text-gray-800 leading-tight">{wo.productName}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-gray-400">{wo.producedQty}/{wo.targetQty}</span><span className="font-semibold text-gray-600">{progress}%</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-[#E31E24] rounded-full h-1.5" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                      </div>
                      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        {col === "Draft" && <button onClick={() => handleStatusChange(wo.id, "In Progress")} className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold">Start</button>}
                        {col === "In Progress" && <button onClick={() => handleStatusChange(wo.id, "QC")} className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 font-semibold">Send to QC</button>}
                        {col === "QC" && <button onClick={() => handleStatusChange(wo.id, "Completed")} className="text-[10px] px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 font-semibold">Complete</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {showCreate && <CreateWorkOrderModal boms={boms} locations={locations} projects={projects} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); onRefresh(); }} />}
    </div>
  );
}

function CreateWorkOrderModal({ boms, locations, projects, onClose, onSaved }: { boms: BOM[]; locations: Location[]; projects: Project[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bomId: "", targetQty: "1", priority: "Normal", startDate: new Date().toISOString().split("T")[0], notes: "", productionLocationId: "", projectId: "", taskId: "", trackIndividualUnits: true });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedBom, setSelectedBom] = useState<BOM | null>(null);
  const [routing, setRouting] = useState<BOMRouting[]>([]);
  const [bomMaterials, setBomMaterials] = useState<BOMMaterial[]>([]);

  const activeBoms = boms.filter(b => b.bomStatus === "Active");

  const handleBomChange = async (bomId: string) => {
    setForm({ ...form, bomId });
    if (bomId) {
      const res = await authFetch(`/api/forge/bom/${bomId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBom(data);
        setRouting(data.routing || []);
        setBomMaterials(data.materials || []);
      }
    } else {
      setSelectedBom(null); setRouting([]); setBomMaterials([]);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    setForm({ ...form, projectId, taskId: "" });
    if (projectId) {
      const res = await authFetch(`/api/forge/projects/${projectId}/tasks`);
      if (res.ok) setTasks(await res.json());
    } else { setTasks([]); }
  };

  const handleSave = async () => {
    if (!form.bomId) { alert("BOM is required"); return; }
    setSaving(true);
    const woNumber = `WO-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      woNumber, bomId: parseInt(form.bomId), targetQty: parseInt(form.targetQty) || 1,
      priority: form.priority, startDate: form.startDate, notes: form.notes,
      productionLocationId: form.productionLocationId ? parseInt(form.productionLocationId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      taskId: form.taskId ? parseInt(form.taskId) : null,
      productName: selectedBom?.productName || "",
      trackIndividualUnits: form.trackIndividualUnits,
    };
    try {
      const res = await authFetch("/api/forge/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved(); else { const err = await res.json(); alert(err.error || "Failed"); }
    } catch {} finally { setSaving(false); }
  };

  const targetQty = parseInt(form.targetQty) || 1;

  return (
    <Modal title="Create Work Order" icon={ClipboardList} onClose={onClose} wide>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to BOM (Required)</label>
            <select value={form.bomId} onChange={e => handleBomChange(e.target.value)} className={selectCls}>
              <option value="">Select Active BOM...</option>
              {activeBoms.map(b => <option key={b.id} value={b.id}>{b.productName} ({b.productCode}) v{b.version}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Target Qty</label><input type="number" value={form.targetQty} onChange={e => setForm({ ...form, targetQty: e.target.value })} className={inputCls} /></div>
        </div>

        {selectedBom && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          Product: <strong>{selectedBom.productName}</strong> · {routing.length} routing steps · Est. cost: {fmtCurrency(selectedBom.estimatedCostPerUnit)}/unit
        </div>}

        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={selectCls}><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Production Location</label><select value={form.productionLocationId} onChange={e => setForm({ ...form, productionLocationId: e.target.value })} className={selectCls}><option value="">Select...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project (Optional)</label><select value={form.projectId} onChange={e => handleProjectChange(e.target.value)} className={selectCls}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Task</label><select value={form.taskId} onChange={e => setForm({ ...form, taskId: e.target.value })} className={selectCls} disabled={!form.projectId}><option value="">None</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={form.trackIndividualUnits} onChange={e => setForm({ ...form, trackIndividualUnits: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#E31E24] focus:ring-[#E31E24]" />
          Track individual units (e.g. Column #1, #2, #3...)
        </label>

        {routing.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Routing Steps Preview</h4>
            <DataTable headers={["#", "Workstation", "Operation", "Est. Time", "QC"]}>
              {routing.map(r => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="px-4 py-2 text-sm font-bold text-[#E31E24]">{r.sequenceNo}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{r.workstationName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.operationName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.estimatedMinutes + r.setupTimeMinutes} min</td>
                  <td className="px-4 py-2">{r.hasQcCheck ? <CheckCircle className="w-4 h-4 text-purple-500" /> : <span className="text-gray-300">—</span>}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {bomMaterials.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Material Requirements</h4>
            <DataTable headers={["Material", "BOM Qty/Unit", "Total Required", "Stock"]}>
              {bomMaterials.map(m => {
                const qty = parseFloat(m.qty) || 0;
                const wastage = parseFloat(m.wastagePercent) || 0;
                const totalReq = qty * targetQty * (1 + wastage / 100);
                return (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-800">{m.itemName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{m.qty} {m.uom}</td>
                    <td className="px-4 py-2 text-sm font-bold text-gray-800">{totalReq.toFixed(1)} {m.uom}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">—</td>
                  </tr>
                );
              })}
            </DataTable>
          </div>
        )}

        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></div>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.bomId} className="px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-40">{saving ? "Creating..." : "Create Work Order"}</button>
      </div>
    </Modal>
  );
}

function WorkOrderDetail({ woId, onBack }: { woId: number; onBack: () => void }) {
  const [wo, setWo] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    const res = await authFetch(`/api/forge/work-orders/${woId}`);
    if (res.ok) setWo(await res.json());
    setLoading(false);
  }, [woId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading work order...</div>;
  if (!wo) return <div className="text-center py-16 text-gray-400">Work order not found</div>;

  const progress = wo.targetQty > 0 ? Math.round((wo.producedQty / wo.targetQty) * 100) : 0;
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "units", label: "Unit Tracker", icon: ListChecks },
    { key: "log", label: "Production Log", icon: FileText },
    { key: "materials", label: "Material Consumption", icon: Package },
    { key: "qc", label: "QC Records", icon: Shield },
    { key: "downtime", label: "Downtime", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{wo.woNumber}</h1>
            <StatusPill status={wo.status} />
            <StatusPill status={wo.priority} />
          </div>
          <p className="text-sm text-gray-400">{wo.productName}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">{wo.producedQty}/{wo.targetQty} units</span>
            <span className="font-bold text-gray-800">{progress}%</span>
          </div>
          <div className="w-[200px] bg-gray-200 rounded-full h-2 mt-1"><div className="bg-[#E31E24] rounded-full h-2" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-[#E31E24] text-[#E31E24]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <WOOverviewTab wo={wo} />}
      {tab === "units" && <WOUnitsTab wo={wo} onRefresh={fetchDetail} />}
      {tab === "log" && <WOProductionLogTab wo={wo} />}
      {tab === "materials" && <WOMaterialsTab wo={wo} />}
      {tab === "qc" && <WOQcTab wo={wo} />}
      {tab === "downtime" && <WODowntimeTab wo={wo} />}
    </div>
  );
}

function WOOverviewTab({ wo }: { wo: any }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Start Date</p><p className="text-sm font-semibold text-gray-800">{fmtDate(wo.startDate)}</p></div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Expected End</p><p className="text-sm font-semibold text-gray-800">{fmtDate(wo.expectedEndDate)}</p></div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Actual End</p><p className="text-sm font-semibold text-gray-800">{fmtDate(wo.actualEndDate)}</p></div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Routing Progress</p><p className="text-sm font-semibold text-gray-800">Step {wo.currentRoutingStep}/{wo.totalRoutingSteps}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Cost Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Materials Cost</span><span className="text-sm font-bold text-gray-800">{fmtCurrency(wo.materialsCost)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Labor Cost</span><span className="text-sm font-bold text-gray-800">{fmtCurrency(wo.laborCost)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Overhead Cost</span><span className="text-sm font-bold text-gray-800">{fmtCurrency(wo.overheadCost)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-sm font-bold text-gray-800">Total Cost</span><span className="text-sm font-bold text-[#E31E24]">{fmtCurrency(wo.totalCost)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Cost Per Unit</span><span className="text-sm font-semibold text-gray-800">{fmtCurrency(wo.costPerUnit)}</span></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Production Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Target Qty</span><span className="text-sm font-bold text-gray-800">{wo.targetQty}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Produced Qty</span><span className="text-sm font-bold text-green-600">{wo.producedQty}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Scrap Qty</span><span className="text-sm font-bold text-red-500">{wo.scrapQty}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Units Tracked</span><span className="text-sm font-semibold text-gray-800">{wo.trackIndividualUnits ? "Yes" : "No (Batch)"}</span></div>
          </div>
        </div>
      </div>
      {wo.routing && wo.routing.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Routing Steps</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {wo.routing.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${wo.currentRoutingStep >= r.sequenceNo ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                  {r.sequenceNo}. {r.operationName}
                </div>
                {i < wo.routing.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WOUnitsTab({ wo, onRefresh }: { wo: any; onRefresh: () => void }) {
  const units: WOUnit[] = wo.units || [];

  const handleAdvance = async (unitId: number) => {
    const res = await authFetch(`/api/forge/units/${unitId}/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (res.ok) onRefresh(); else { const err = await res.json(); alert(err.error || "Failed"); }
  };

  const handleScrap = async (unitId: number) => {
    if (!confirm("Mark this unit as scrapped?")) return;
    const res = await authFetch(`/api/forge/units/${unitId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Scrapped" }) });
    if (res.ok) onRefresh();
  };

  if (units.length === 0) return <EmptyState icon={ListChecks} text="No individual units tracked for this work order" />;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <DataTable headers={["Unit", "Current Step", "Status", "Started", "Completed", "Actions"]}>
        {units.map(u => (
          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
            <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.unitIdentifier}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{u.currentStepName || (u.currentStepSequence === 0 ? "Not started" : `Step ${u.currentStepSequence}`)}</td>
            <td className="px-4 py-3"><StatusPill status={u.status} /></td>
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(u.startedAt)}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(u.completedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                {["Queued", "In Progress", "QC Passed"].includes(u.status) && (
                  <button onClick={() => handleAdvance(u.id)} className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold">
                    {u.currentStepSequence === 0 ? "Start" : "Next Step"}
                  </button>
                )}
                {!["Completed", "Scrapped"].includes(u.status) && (
                  <button onClick={() => handleScrap(u.id)} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 font-semibold">Scrap</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function WOProductionLogTab({ wo }: { wo: any }) {
  const logs: ProductionLogEntry[] = wo.productionLog || [];
  const units: WOUnit[] = wo.units || [];

  if (logs.length === 0) return <EmptyState icon={FileText} text="No production log entries yet" />;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <DataTable headers={["Time", "Unit", "Step", "Operator", "Duration", "QC"]}>
        {logs.map(l => {
          const unit = units.find(u => u.id === l.unitId);
          const routeStep = wo.routing?.find((r: any) => r.id === l.routingStepId);
          return (
            <tr key={l.id} className="border-b border-gray-50">
              <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(l.startTime)}</td>
              <td className="px-4 py-3 text-sm text-gray-800">{unit?.unitIdentifier || `Unit #${l.unitId}`}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{routeStep?.operationName || `Step ${l.sequenceNo}`}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{l.operatorName || "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{l.actualMinutes ? `${l.actualMinutes} min` : (l.status === "In Progress" ? "In progress..." : "—")}</td>
              <td className="px-4 py-3"><StatusPill status={l.qcStatus} /></td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}

function WOMaterialsTab({ wo }: { wo: any }) {
  const materials: MaterialConsumption[] = wo.materialConsumption || [];

  if (materials.length === 0) return <EmptyState icon={Package} text="No material consumption records" />;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <DataTable headers={["Material", "BOM Estimate", "Issued", "Consumed", "Returned", "Variance", "Cost"]}>
        {materials.map(m => {
          const varianceNum = parseFloat(m.variance);
          const varianceColor = varianceNum > 0 ? "text-red-500" : varianceNum < 0 ? "text-green-600" : "text-gray-500";
          return (
            <tr key={m.id} className="border-b border-gray-50">
              <td className="px-4 py-3 text-sm text-gray-800">{m.itemName}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{parseFloat(m.bomEstimatedQty).toFixed(1)} {m.uom}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{parseFloat(m.actualQtyIssued).toFixed(1)}</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-800">{parseFloat(m.actualQtyConsumed).toFixed(1)}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{parseFloat(m.returnedQty).toFixed(1)}</td>
              <td className={`px-4 py-3 text-sm font-semibold ${varianceColor}`}>{varianceNum > 0 ? "+" : ""}{parseFloat(m.variance).toFixed(1)} ({m.variancePercent}%)</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-800">{fmtCurrency(m.totalCost)}</td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}

function WOQcTab({ wo }: { wo: any }) {
  const qcRecords: QCRecord[] = wo.qcRecords || [];

  if (qcRecords.length === 0) return <EmptyState icon={Shield} text="No QC records for this work order" />;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <DataTable headers={["Date", "Unit", "Type", "Result", "Inspected", "Passed", "Rejected", "Inspector", "Defect"]}>
        {qcRecords.map(qc => (
          <tr key={qc.id} className="border-b border-gray-50">
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(qc.inspectionDate)}</td>
            <td className="px-4 py-3 text-sm text-gray-800">{qc.unitIdentifier || "Batch"}</td>
            <td className="px-4 py-3"><StatusPill status={qc.inspectionType} /></td>
            <td className="px-4 py-3"><StatusPill status={qc.result} /></td>
            <td className="px-4 py-3 text-sm text-gray-600">{qc.inspectedQty}</td>
            <td className="px-4 py-3 text-sm text-green-600 font-bold">{qc.passedQty}</td>
            <td className="px-4 py-3 text-sm text-red-500 font-bold">{qc.rejectedQty}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{qc.inspectedBy}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{qc.defectCategory || "—"}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function WODowntimeTab({ wo }: { wo: any }) {
  const logs: DowntimeLog[] = wo.downtimeLogs || [];

  if (logs.length === 0) return <EmptyState icon={AlertTriangle} text="No downtime events for this work order" />;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <DataTable headers={["Workstation", "Reason", "Start", "End", "Duration", "Cost Impact"]}>
        {logs.map(l => (
          <tr key={l.id} className="border-b border-gray-50">
            <td className="px-4 py-3 text-sm text-gray-800">{l.workstationName}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{l.reason}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(l.startTime)}</td>
            <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(l.endTime)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{l.totalMinutesLost} min</td>
            <td className="px-4 py-3 text-sm font-bold text-red-500">{fmtCurrency(l.costImpact)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function QualityControlView({ qcRecords, workOrders, onRefresh }: { qcRecords: QCRecord[]; workOrders: WorkOrder[]; onRefresh: () => void }) {
  const [showLog, setShowLog] = useState(false);
  const [units, setUnits] = useState<WOUnit[]>([]);
  const [routing, setRouting] = useState<BOMRouting[]>([]);

  const fetchWODetails = async (woId: number) => {
    const res = await authFetch(`/api/forge/work-orders/${woId}`);
    if (res.ok) {
      const data = await res.json();
      setUnits(data.units || []);
      setRouting(data.routing || []);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Quality Control</h1><p className="text-sm text-gray-400 mt-0.5">Inspection records and quality checks</p></div>
        <button onClick={() => setShowLog(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15"><Plus className="w-4 h-4" /> Log Inspection</button>
      </div>
      {qcRecords.length === 0 ? <EmptyState icon={Shield} text="No QC records yet" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <DataTable headers={["Date", "WO", "Unit", "Type", "Result", "Inspected", "Passed", "Rejected", "Defect", "Inspector", ""]}>
            {qcRecords.map(qc => (
              <tr key={qc.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(qc.inspectionDate)}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{qc.woNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{qc.unitIdentifier || "Batch"}</td>
                <td className="px-4 py-3"><StatusPill status={qc.inspectionType} /></td>
                <td className="px-4 py-3"><StatusPill status={qc.result} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">{qc.inspectedQty}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-bold">{qc.passedQty}</td>
                <td className="px-4 py-3 text-sm text-red-500 font-bold">{qc.rejectedQty}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{qc.defectCategory || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{qc.inspectedBy}</td>
                <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/quality-control/${qc.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
      {showLog && <LogInspectionModal workOrders={workOrders} onClose={() => { setShowLog(false); setUnits([]); setRouting([]); }} onSaved={() => { setShowLog(false); setUnits([]); setRouting([]); onRefresh(); }} fetchWODetails={fetchWODetails} units={units} routing={routing} />}
    </div>
  );
}

function LogInspectionModal({ workOrders, onClose, onSaved, fetchWODetails, units, routing }: { workOrders: WorkOrder[]; onClose: () => void; onSaved: () => void; fetchWODetails: (id: number) => void; units: WOUnit[]; routing: BOMRouting[] }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workOrderId: "", woNumber: "", productName: "", unitIdentifier: "", routingStepId: "",
    inspectionType: "Final", result: "Passed", inspectedQty: "0", passedQty: "0", rejectedQty: "0",
    rejectionReason: "", inspectedBy: "", defectCategory: "", reworkRequired: false, reworkInstructions: "",
  });

  const handleWOChange = (woId: string) => {
    const wo = workOrders.find(w => w.id === parseInt(woId));
    setForm({ ...form, workOrderId: woId, woNumber: wo?.woNumber || "", productName: wo?.productName || "", unitIdentifier: "", routingStepId: "" });
    if (woId) fetchWODetails(parseInt(woId));
  };

  const handleSave = async () => {
    if (!form.workOrderId) return; setSaving(true);
    const payload = {
      ...form, workOrderId: parseInt(form.workOrderId),
      inspectedQty: parseInt(form.inspectedQty) || 0,
      passedQty: parseInt(form.passedQty) || 0,
      rejectedQty: parseInt(form.rejectedQty) || 0,
      routingStepId: form.routingStepId ? parseInt(form.routingStepId) : null,
      unitIdentifier: form.unitIdentifier || null,
      defectCategory: form.defectCategory || null,
      reworkInstructions: form.reworkInstructions || null,
    };
    try { const res = await authFetch("/api/forge/quality-control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); else { const err = await res.json(); alert(err.error || "Failed"); } } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Log QC Inspection" icon={Shield} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Work Order</label>
            <select value={form.workOrderId} onChange={e => handleWOChange(e.target.value)} className={selectCls}>
              <option value="">Select WO...</option>
              {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.woNumber} — {wo.productName}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Unit</label>
            <select value={form.unitIdentifier} onChange={e => setForm({ ...form, unitIdentifier: e.target.value })} className={selectCls}>
              <option value="">Batch (no specific unit)</option>
              {units.map(u => <option key={u.id} value={u.unitIdentifier}>{u.unitIdentifier} ({u.status})</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Routing Step</label>
            <select value={form.routingStepId} onChange={e => setForm({ ...form, routingStepId: e.target.value })} className={selectCls}>
              <option value="">Final Inspection</option>
              {routing.map(r => <option key={r.id} value={r.id}>{r.sequenceNo}. {r.operationName}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspection Type</label>
            <select value={form.inspectionType} onChange={e => setForm({ ...form, inspectionType: e.target.value })} className={selectCls}><option>In-Process</option><option>Final</option><option>Rework</option></select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Result</label>
            <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} className={selectCls}><option>Passed</option><option>Failed</option><option>Conditional</option></select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspected Qty</label><input type="number" value={form.inspectedQty} onChange={e => setForm({ ...form, inspectedQty: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Passed Qty</label><input type="number" value={form.passedQty} onChange={e => setForm({ ...form, passedQty: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Rejected Qty</label><input type="number" value={form.rejectedQty} onChange={e => setForm({ ...form, rejectedQty: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Defect Category</label>
            <select value={form.defectCategory} onChange={e => setForm({ ...form, defectCategory: e.target.value })} className={selectCls}><option value="">None</option><option>Dimensional</option><option>Surface</option><option>Welding</option><option>Material</option><option>Painting</option><option>Assembly</option><option>Other</option></select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspected By</label><input value={form.inspectedBy} onChange={e => setForm({ ...form, inspectedBy: e.target.value })} className={inputCls} /></div>
        </div>
        {form.result === "Failed" && (
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Rejection Reason</label><textarea value={form.rejectionReason} onChange={e => setForm({ ...form, rejectionReason: e.target.value })} rows={2} className={inputCls} /></div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.reworkRequired} onChange={e => setForm({ ...form, reworkRequired: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#E31E24]" />
              Rework Required
            </label>
            {form.reworkRequired && (
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Rework Instructions</label><textarea value={form.reworkInstructions} onChange={e => setForm({ ...form, reworkInstructions: e.target.value })} rows={2} className={inputCls} /></div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.workOrderId} className="px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-40">{saving ? "Saving..." : "Log Inspection"}</button>
      </div>
    </Modal>
  );
}

function DowntimeLogsView({ downtimeLogs, workstations, workOrders, onRefresh }: { downtimeLogs: DowntimeLog[]; workstations: Workstation[]; workOrders: WorkOrder[]; onRefresh: () => void }) {
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Downtime Logs</h1><p className="text-sm text-gray-400 mt-0.5">Track workstation stoppages and lost production time</p></div>
        <button onClick={() => setShowLog(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15"><Plus className="w-4 h-4" /> Log Downtime</button>
      </div>
      {downtimeLogs.length === 0 ? <EmptyState icon={AlertTriangle} text="No downtime events logged" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <DataTable headers={["Workstation", "Reason", "Category", "Start", "End", "Duration", "Cost Impact", "WO", "Logged By", ""]}>
            {downtimeLogs.map(l => (
              <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                <td className="px-4 py-3 text-sm text-gray-800">{l.workstationName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.reason}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{l.category}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(l.startTime)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(l.endTime)}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{l.totalMinutesLost} min</td>
                <td className="px-4 py-3 text-sm font-bold text-red-500">{fmtCurrency(l.costImpact)}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-400">{workOrders.find(w => w.id === l.workOrderId)?.woNumber || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{l.loggedBy}</td>
                <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/downtime-logs/${l.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
      {showLog && <LogDowntimeModal workstations={workstations} workOrders={workOrders} onClose={() => setShowLog(false)} onSaved={() => { setShowLog(false); onRefresh(); }} />}
    </div>
  );
}

function LogDowntimeModal({ workstations, workOrders, onClose, onSaved }: { workstations: Workstation[]; workOrders: WorkOrder[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workstationId: "", workstationName: "", reason: "Mechanical Failure", workOrderId: "",
    startTime: "", endTime: "", totalMinutesLost: "0", notes: "", loggedBy: "",
  });

  const selectWS = (id: string) => {
    const ws = workstations.find(w => w.id === parseInt(id));
    setForm({ ...form, workstationId: id, workstationName: ws?.name || "" });
  };

  const calcMinutes = (start: string, end: string) => {
    if (!start || !end) return "0";
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
    return Math.max(0, Math.round(diff)).toString();
  };

  const handleSave = async () => {
    if (!form.workstationId || !form.startTime) return; setSaving(true);
    const payload = {
      ...form,
      workstationId: parseInt(form.workstationId),
      workOrderId: form.workOrderId ? parseInt(form.workOrderId) : null,
      totalMinutesLost: parseInt(form.totalMinutesLost) || 0,
      startTime: new Date(form.startTime).toISOString(),
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
    };
    try { const res = await authFetch("/api/forge/downtime-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Log Downtime" icon={AlertTriangle} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Workstation</label>
            <select value={form.workstationId} onChange={e => selectWS(e.target.value)} className={selectCls}>
              <option value="">Select...</option>
              {workstations.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Work Order (Optional)</label>
            <select value={form.workOrderId} onChange={e => setForm({ ...form, workOrderId: e.target.value })} className={selectCls}>
              <option value="">None</option>
              {workOrders.filter(w => w.status === "In Progress").map(wo => <option key={wo.id} value={wo.id}>{wo.woNumber} — {wo.productName}</option>)}
            </select>
          </div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reason</label>
          <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={selectCls}>
            {["Mechanical Failure", "Electrical Failure", "Material Shortage", "Operator Absence", "Power Outage", "Scheduled Maintenance", "Tool Change", "Setup", "Other"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label><input type="datetime-local" value={form.startTime} onChange={e => { const s = e.target.value; setForm({ ...form, startTime: s, totalMinutesLost: calcMinutes(s, form.endTime) }); }} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label><input type="datetime-local" value={form.endTime} onChange={e => { const end = e.target.value; setForm({ ...form, endTime: end, totalMinutesLost: calcMinutes(form.startTime, end) }); }} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Minutes Lost</label><input type="number" value={form.totalMinutesLost} onChange={e => setForm({ ...form, totalMinutesLost: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By</label><input value={form.loggedBy} onChange={e => setForm({ ...form, loggedBy: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.workstationId || !form.startTime} className="px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-40">{saving ? "Saving..." : "Log Downtime"}</button>
      </div>
    </Modal>
  );
}

function Modal({ title, icon: Icon, children, onClose, wide }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? "w-[850px]" : "w-[600px]"} max-h-[92vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Icon className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">{title}</h2></div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b border-gray-200">
          {headers.map((h, i) => <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}
        </tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-gray-300" /></div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
