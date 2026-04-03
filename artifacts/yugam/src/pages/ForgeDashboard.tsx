import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Plus, X, Factory, ClipboardList, ListChecks, Shield, Calendar,
  LayoutDashboard, Trash2, CheckCircle, XCircle, AlertTriangle, Clock,
  ArrowRight, Zap, Target, TrendingUp, Wrench, Play, Pause, Settings,
  ChevronRight, Eye, Package,
} from "lucide-react";

type ForgeSub = "Production Dashboard" | "Bill of Materials" | "Workstations & Routing" | "Work Orders" | "Quality Control" | "Downtime Logs";

interface Workstation { id: number; name: string; type: string; costPerHour: string; status: string; description: string; createdAt: string | null; }
interface BOM { id: number; productName: string; productCode: string; uom: string; outputQty: number; notes: string; createdAt: string | null; materials?: BOMMaterial[]; routing?: BOMRouting[]; }
interface BOMMaterial { id: number; bomId: number; itemName: string; itemId: number | null; qty: string; uom: string; wastagePercent: string; }
interface BOMRouting { id: number; bomId: number; sequenceNo: number; workstationId: number; workstationName: string; operationName: string; estimatedMinutes: number; }
interface WorkOrder { id: number; woNumber: string; productName: string; bomId: number | null; targetQty: number; producedQty: number; scrapQty: number; assignedWorkstationId: number | null; assignedWorkstationName: string; status: string; priority: string; startDate: string | null; endDate: string | null; notes: string; createdAt: string | null; }
interface QCRecord { id: number; workOrderId: number; woNumber: string; productName: string; inspectedQty: number; passedQty: number; rejectedQty: number; rejectionReason: string; inspectedBy: string; inspectionDate: string | null; notes: string; createdAt: string | null; }
interface DowntimeLog { id: number; workstationId: number; workstationName: string; reason: string; startTime: string; endTime: string | null; totalMinutesLost: number; notes: string; loggedBy: string; createdAt: string | null; }
interface DashSummary { activeWorkOrders: number; todayYield: number; oee: number; scrapRate: number; workstations: { total: number; active: number; idle: number; maintenance: number }; }
interface CatalogItem { id: number; name: string; sku: string; category: string; uom: string; unitPrice: string; }

function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtTime(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = {
    Draft: "bg-gray-50 text-gray-500 border-gray-200", "In Progress": "bg-blue-50 text-blue-600 border-blue-200",
    QC: "bg-purple-50 text-purple-600 border-purple-200", Completed: "bg-green-50 text-green-600 border-green-200",
    Active: "bg-green-50 text-green-600 border-green-200", Idle: "bg-amber-50 text-amber-600 border-amber-200",
    Maintenance: "bg-red-50 text-red-500 border-red-200",
    Low: "bg-gray-50 text-gray-500 border-gray-200", Normal: "bg-blue-50 text-blue-600 border-blue-200",
    High: "bg-amber-50 text-amber-600 border-amber-200", Urgent: "bg-red-50 text-red-500 border-red-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

export default function ForgeDashboard() {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Forge:", "") || "Production Dashboard") as ForgeSub;
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [dashSummary, setDashSummary] = useState<DashSummary | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [wsR, bomR, woR, qcR, dtR, dsR, ciR] = await Promise.all([
        authFetch("/api/forge/workstations"), authFetch("/api/forge/bom"),
        authFetch("/api/forge/work-orders"), authFetch("/api/forge/quality-control"),
        authFetch("/api/forge/downtime-logs"), authFetch("/api/forge/dashboard-summary"),
        authFetch("/api/vault/catalog"),
      ]);
      if (wsR.ok) setWorkstations(await wsR.json());
      if (bomR.ok) setBoms(await bomR.json());
      if (woR.ok) setWorkOrders(await woR.json());
      if (qcR.ok) setQcRecords(await qcR.json());
      if (dtR.ok) setDowntimeLogs(await dtR.json());
      if (dsR.ok) setDashSummary(await dsR.json());
      if (ciR.ok) setCatalogItems(await ciR.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading production data...</div>;

  switch (sub) {
    case "Production Dashboard": return <ProductionDashboardView summary={dashSummary} workOrders={workOrders} workstations={workstations} />;
    case "Bill of Materials": return <BOMView boms={boms} catalogItems={catalogItems} workstations={workstations} onRefresh={fetchAll} />;
    case "Workstations & Routing": return <WorkstationsView workstations={workstations} workOrders={workOrders} onRefresh={fetchAll} />;
    case "Work Orders": return <WorkOrdersView workOrders={workOrders} workstations={workstations} boms={boms} onRefresh={fetchAll} />;
    case "Quality Control": return <QualityControlView qcRecords={qcRecords} workOrders={workOrders} onRefresh={fetchAll} />;
    case "Downtime Logs": return <DowntimeLogsView downtimeLogs={downtimeLogs} workstations={workstations} onRefresh={fetchAll} />;
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

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Active Work Orders Timeline</h3>
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
                      <p className="text-xs text-gray-400">{wo.assignedWorkstationName || "Unassigned"}</p>
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
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Workstation Status</h3>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Active</span><span className="text-sm font-bold text-green-600">{summary?.workstations.active ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Idle</span><span className="text-sm font-bold text-amber-500">{summary?.workstations.idle ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Maintenance</span><span className="text-sm font-bold text-red-500">{summary?.workstations.maintenance ?? 0}</span></div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 mb-2">Recent Workstations</p>
            {workstations.slice(0, 5).map(ws => (
              <div key={ws.id} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-600 truncate">{ws.name}</span>
                <StatusPill status={ws.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; suffix?: string; color: string }) {
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
        <div><p className="text-xs text-gray-400">{label}</p><p className={`text-2xl font-bold ${c.text}`}>{value}{suffix || ""}</p></div>
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
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Bill of Materials (BOM)</h1><p className="text-sm text-gray-400 mt-0.5">Define material requirements and operational routing for products</p></div>
        <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create BOM</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search BOMs..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={ClipboardList} text="No BOMs defined yet" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bom => (
            <div key={bom.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:border-[#E31E24]/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-bold text-gray-800">{bom.productName}</p><p className="text-xs font-mono text-gray-400 mt-0.5">{bom.productCode || "No code"}</p></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleView(bom.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { if (confirm("Delete this BOM?")) { await authFetch(`/api/forge/bom/${bom.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>Output: {bom.outputQty} {bom.uom}</span>
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
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs text-gray-400">Product Code</p><p className="text-sm font-semibold text-gray-800">{bom.productCode || "—"}</p></div>
          <div><p className="text-xs text-gray-400">Output Qty</p><p className="text-sm font-semibold text-gray-800">{bom.outputQty} {bom.uom}</p></div>
          <div><p className="text-xs text-gray-400">Created</p><p className="text-sm font-semibold text-gray-800">{fmtDate(bom.createdAt)}</p></div>
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
                    <p className="text-sm font-medium text-gray-800">{r.operationName || "Operation"}</p>
                    <p className="text-xs text-gray-400">{r.workstationName} · {r.estimatedMinutes} min</p>
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

interface MatLine { itemName: string; itemId: string; qty: string; uom: string; wastagePercent: string; }
interface RouteLine { workstationId: string; workstationName: string; operationName: string; estimatedMinutes: string; }

function BOMBuilder({ catalogItems, workstations, onClose, onSaved }: { catalogItems: CatalogItem[]; workstations: Workstation[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productName: "", productCode: "", uom: "Nos", outputQty: "1", notes: "" });
  const [materials, setMaterials] = useState<MatLine[]>([{ itemName: "", itemId: "", qty: "1", uom: "Nos", wastagePercent: "0" }]);
  const [routing, setRouting] = useState<RouteLine[]>([{ workstationId: "", workstationName: "", operationName: "", estimatedMinutes: "0" }]);

  const addMat = () => setMaterials([...materials, { itemName: "", itemId: "", qty: "1", uom: "Nos", wastagePercent: "0" }]);
  const removeMat = (i: number) => { if (materials.length > 1) setMaterials(materials.filter((_, idx) => idx !== i)); };
  const updateMat = (i: number, f: string, v: string) => { const n = [...materials]; (n[i] as any)[f] = v; setMaterials(n); };
  const selectCatalogItem = (i: number, itemId: string) => {
    const item = catalogItems.find(c => c.id === parseInt(itemId));
    if (item) { const n = [...materials]; n[i] = { ...n[i], itemId, itemName: item.name, uom: item.uom }; setMaterials(n); }
  };

  const addRoute = () => setRouting([...routing, { workstationId: "", workstationName: "", operationName: "", estimatedMinutes: "0" }]);
  const removeRoute = (i: number) => { if (routing.length > 1) setRouting(routing.filter((_, idx) => idx !== i)); };
  const updateRoute = (i: number, f: string, v: string) => { const n = [...routing]; (n[i] as any)[f] = v; setRouting(n); };
  const selectWorkstation = (i: number, wsId: string) => {
    const ws = workstations.find(w => w.id === parseInt(wsId));
    if (ws) { const n = [...routing]; n[i] = { ...n[i], workstationId: wsId, workstationName: ws.name }; setRouting(n); }
  };

  const handleSave = async () => {
    if (!form.productName.trim()) return; setSaving(true);
    const payload = {
      ...form, outputQty: parseInt(form.outputQty) || 1,
      materials: materials.filter(m => m.itemName.trim()).map(m => ({ itemName: m.itemName, itemId: m.itemId ? parseInt(m.itemId) : null, qty: m.qty, uom: m.uom, wastagePercent: m.wastagePercent })),
      routing: routing.filter(r => r.workstationId).map((r, i) => ({ sequenceNo: i + 1, workstationId: parseInt(r.workstationId), workstationName: r.workstationName, operationName: r.operationName, estimatedMinutes: parseInt(r.estimatedMinutes) || 0 })),
    };
    try { const res = await authFetch("/api/forge/bom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[850px] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">BOM Builder</h2></div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Name</label><input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Steel Frame Assembly" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Code</label><input type="text" value={form.productCode} onChange={e => setForm({ ...form, productCode: e.target.value })} placeholder="SFA-001" className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Output Qty</label><input type="number" value={form.outputQty} onChange={e => setForm({ ...form, outputQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1.5">UOM</label><input type="text" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} className={inputCls} /></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Package className="w-4 h-4 text-[#E31E24]" /> Material Requirements</h3><button onClick={addMat} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Material</button></div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Material (from Vault)</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[100px]">Qty</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[70px]">UOM</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[80px]">Wastage %</th>
                <th className="w-[36px]"></th>
              </tr></thead><tbody>
                {materials.map((mat, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-2 py-1.5">
                      {catalogItems.length > 0 ? (
                        <select value={mat.itemId} onChange={e => selectCatalogItem(i, e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] cursor-pointer">
                          <option value="">Select from Vault...</option>
                          {catalogItems.map(ci => <option key={ci.id} value={ci.id}>{ci.name} ({ci.sku})</option>)}
                        </select>
                      ) : <input type="text" value={mat.itemName} onChange={e => updateMat(i, "itemName", e.target.value)} placeholder="Material name" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24]" />}
                    </td>
                    <td className="px-1 py-1.5"><input type="number" value={mat.qty} onChange={e => updateMat(i, "qty", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5"><input type="text" value={mat.uom} onChange={e => updateMat(i, "uom", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24]" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={mat.wastagePercent} onChange={e => updateMat(i, "wastagePercent", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5">{materials.length > 1 && <button onClick={() => removeMat(i)} className="p-1 rounded text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Factory className="w-4 h-4 text-[#E31E24]" /> Operational Routing</h3><button onClick={addRoute} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Step</button></div>
            <div className="space-y-2">
              {routing.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <div className="w-7 h-7 rounded-full bg-[#E31E24]/10 flex items-center justify-center text-xs font-bold text-[#E31E24] shrink-0">{i + 1}</div>
                  <select value={r.workstationId} onChange={e => selectWorkstation(i, e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] cursor-pointer bg-white">
                    <option value="">Select Workstation...</option>
                    {workstations.map(ws => <option key={ws.id} value={ws.id}>{ws.name} ({ws.type})</option>)}
                  </select>
                  <input type="text" value={r.operationName} onChange={e => updateRoute(i, "operationName", e.target.value)} placeholder="Operation name" className="w-[180px] px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24]" />
                  <div className="flex items-center gap-1 w-[100px]"><input type="number" value={r.estimatedMinutes} onChange={e => updateRoute(i, "estimatedMinutes", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /><span className="text-xs text-gray-400 shrink-0">min</span></div>
                  {routing.length > 1 && <button onClick={() => removeRoute(i)} className="p-1 rounded text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.productName.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"><Plus className="w-4 h-4" /> Save BOM</button>
        </div>
      </div>
    </div>
  );
}

function WorkstationsView({ workstations, workOrders, onRefresh }: { workstations: Workstation[]; workOrders: WorkOrder[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const getAssignedWO = (wsId: number) => workOrders.find(wo => wo.assignedWorkstationId === wsId && (wo.status === "In Progress" || wo.status === "QC"));
  const getUtilization = (wsId: number) => { const assigned = workOrders.filter(wo => wo.assignedWorkstationId === wsId && wo.status !== "Draft"); return assigned.length > 0 ? Math.min(100, assigned.length * 25) : 0; };

  const handleStatusChange = async (id: number, status: string) => {
    await authFetch(`/api/forge/workstations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    onRefresh();
  };

  const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = { Active: Play, Idle: Pause, Maintenance: Wrench };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Workstations & Routing</h1><p className="text-sm text-gray-400 mt-0.5">Manage production centres, machines, and manual lines</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Workstation</button></div>
      {workstations.length === 0 ? <EmptyState icon={Factory} text="No workstations defined" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workstations.map(ws => {
            const assignedWO = getAssignedWO(ws.id);
            const utilization = getUtilization(ws.id);
            const StIcon = statusIcons[ws.status] || Settings;
            return (
              <div key={ws.id} className={`bg-white border rounded-xl shadow-sm p-5 transition-colors ${ws.status === "Active" ? "border-green-200" : ws.status === "Maintenance" ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ws.status === "Active" ? "bg-green-50" : ws.status === "Maintenance" ? "bg-red-50" : "bg-amber-50"}`}>
                      <StIcon className={`w-4 h-4 ${ws.status === "Active" ? "text-green-500" : ws.status === "Maintenance" ? "text-red-500" : "text-amber-500"}`} />
                    </div>
                    <div><p className="text-sm font-bold text-gray-800">{ws.name}</p><p className="text-[10px] text-gray-400">{ws.type}</p></div>
                  </div>
                  <StatusPill status={ws.status} />
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs"><span className="text-gray-400">Cost/Hour</span><span className="font-semibold text-gray-700">₹ {parseFloat(ws.costPerHour).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-400">Utilization</span><span className="font-semibold text-gray-700">{utilization}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`rounded-full h-1.5 transition-all ${utilization > 75 ? "bg-green-500" : utilization > 40 ? "bg-amber-500" : "bg-gray-400"}`} style={{ width: `${utilization}%` }} /></div>
                </div>
                {assignedWO ? (
                  <div className="bg-blue-50 rounded-lg p-2.5 mb-3"><p className="text-[10px] text-blue-400 uppercase font-semibold">Current Work Order</p><p className="text-xs font-medium text-blue-700">{assignedWO.woNumber}: {assignedWO.productName}</p></div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-2.5 mb-3"><p className="text-xs text-gray-400">No active work order</p></div>
                )}
                <div className="flex items-center gap-1.5">
                  {ws.status !== "Active" && <button onClick={() => handleStatusChange(ws.id, "Active")} className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50">Activate</button>}
                  {ws.status !== "Idle" && <button onClick={() => handleStatusChange(ws.id, "Idle")} className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50">Set Idle</button>}
                  {ws.status !== "Maintenance" && <button onClick={() => handleStatusChange(ws.id, "Maintenance")} className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50">Maintenance</button>}
                  <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/workstations/${ws.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <AddWorkstationModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddWorkstationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Machine", costPerHour: "", description: "" });
  const handleSave = async () => {
    if (!form.name.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/forge/workstations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Add Workstation" icon={Factory} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Workstation Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. CNC Machine Bay 1" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Machine">Machine</option><option value="Manual Line">Manual Line</option><option value="Vendor">Vendor</option><option value="QC Desk">QC Desk</option></select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Cost Per Hour (₹)</label><input type="number" value={form.costPerHour} onChange={e => setForm({ ...form, costPerHour: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.name.trim()} label="Add Workstation" />
    </Modal>
  );
}

function WorkOrdersView({ workOrders, workstations, boms, onRefresh }: { workOrders: WorkOrder[]; workstations: Workstation[]; boms: BOM[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [completeWO, setCompleteWO] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return workOrders; const q = search.toLowerCase(); return workOrders.filter(w => w.woNumber.toLowerCase().includes(q) || w.productName.toLowerCase().includes(q)); }, [workOrders, search]);

  const getStatusColor = (s: string) => ({ Draft: "border-gray-200 bg-gray-50", "In Progress": "border-blue-200 bg-blue-50", QC: "border-purple-200 bg-purple-50", Completed: "border-green-200 bg-green-50" }[s] || "border-gray-200 bg-gray-50");

  const handleStatusChange = async (wo: WorkOrder, newStatus: string) => {
    if (newStatus === "Completed") { setCompleteWO(wo); return; }
    await authFetch(`/api/forge/work-orders/${wo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    onRefresh();
  };

  const statusColumns = ["Draft", "In Progress", "QC", "Completed"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Work Orders</h1><p className="text-sm text-gray-400 mt-0.5">Track production jobs across workstations</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create Work Order</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search work orders..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>

      <div className="grid grid-cols-4 gap-3">
        {statusColumns.map(status => {
          const wos = filtered.filter(w => w.status === status);
          return (
            <div key={status} className="space-y-2">
              <div className={`px-3 py-2 rounded-lg border ${getStatusColor(status)}`}>
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-700 uppercase">{status}</span><span className="text-xs text-gray-400">{wos.length}</span></div>
              </div>
              {wos.length === 0 ? <p className="text-center text-xs text-gray-300 py-6">No orders</p> : wos.map(wo => (
                <div key={wo.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group hover:border-[#E31E24]/30 transition-colors">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs font-mono text-gray-400">{wo.woNumber}</span><StatusPill status={wo.priority} /></div>
                  <p className="text-sm font-medium text-gray-800">{wo.productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{wo.assignedWorkstationName || "Unassigned"}</p>
                  <div className="mt-2 flex items-center justify-between text-xs"><span className="text-gray-400">Target</span><span className="font-semibold text-gray-700">{wo.producedQty}/{wo.targetQty}</span></div>
                  {wo.targetQty > 0 && <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-[#E31E24] rounded-full h-1.5" style={{ width: `${Math.min(100, Math.round((wo.producedQty / wo.targetQty) * 100))}%` }} /></div>}
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status === "Draft" && <button onClick={() => handleStatusChange(wo, "In Progress")} className="flex-1 px-2 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded hover:bg-blue-50">Start</button>}
                    {status === "In Progress" && <button onClick={() => handleStatusChange(wo, "QC")} className="flex-1 px-2 py-1 text-[10px] font-semibold text-purple-600 border border-purple-200 rounded hover:bg-purple-50">Send to QC</button>}
                    {status === "QC" && <button onClick={() => handleStatusChange(wo, "Completed")} className="flex-1 px-2 py-1 text-[10px] font-semibold text-green-600 border border-green-200 rounded hover:bg-green-50">Complete</button>}
                    <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/work-orders/${wo.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {showModal && <CreateWorkOrderModal workstations={workstations} boms={boms} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
      {completeWO && <CompleteWOModal wo={completeWO} onClose={() => setCompleteWO(null)} onSaved={() => { setCompleteWO(null); onRefresh(); }} />}
    </div>
  );
}

function CreateWorkOrderModal({ workstations, boms, onClose, onSaved }: { workstations: Workstation[]; boms: BOM[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ woNumber: `WO-${Date.now().toString().slice(-6)}`, productName: "", bomId: "", targetQty: "1", assignedWorkstationId: "", assignedWorkstationName: "", priority: "Normal", startDate: new Date().toISOString().split("T")[0], notes: "" });
  const handleSelectBOM = (bomId: string) => { const bom = boms.find(b => b.id === parseInt(bomId)); setForm({ ...form, bomId, productName: bom?.productName || form.productName }); };
  const handleSelectWS = (wsId: string) => { const ws = workstations.find(w => w.id === parseInt(wsId)); setForm({ ...form, assignedWorkstationId: wsId, assignedWorkstationName: ws?.name || "" }); };
  const handleSave = async () => {
    if (!form.productName.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/forge/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, targetQty: parseInt(form.targetQty) || 1, bomId: form.bomId ? parseInt(form.bomId) : null, assignedWorkstationId: form.assignedWorkstationId ? parseInt(form.assignedWorkstationId) : null, startDate: form.startDate || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Create Work Order" icon={ListChecks} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">WO Number</label><input type="text" value={form.woNumber} onChange={e => setForm({ ...form, woNumber: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select></div>
        </div>
        {boms.length > 0 && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to BOM (optional)</label><select value={form.bomId} onChange={e => handleSelectBOM(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Manual entry...</option>{boms.map(b => <option key={b.id} value={b.id}>{b.productName} ({b.productCode})</option>)}</select></div>}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Product Name</label><input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Target Quantity</label><input type="number" value={form.targetQty} onChange={e => setForm({ ...form, targetQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assign Workstation</label><select value={form.assignedWorkstationId} onChange={e => handleSelectWS(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Unassigned</option>{workstations.filter(ws => ws.status === "Active").map(ws => <option key={ws.id} value={ws.id}>{ws.name} ({ws.type})</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.productName.trim()} label="Create WO" />
    </Modal>
  );
}

function CompleteWOModal({ wo, onClose, onSaved }: { wo: WorkOrder; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [producedQty, setProducedQty] = useState(wo.producedQty.toString() || wo.targetQty.toString());
  const [scrapQty, setScrapQty] = useState(wo.scrapQty.toString() || "0");
  const handleSave = async () => {
    setSaving(true);
    try { await authFetch(`/api/forge/work-orders/${wo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Completed", producedQty: parseInt(producedQty) || 0, scrapQty: parseInt(scrapQty) || 0, endDate: new Date().toISOString() }) }); onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Complete Work Order" icon={CheckCircle} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-400">Work Order</p>
          <p className="text-sm font-bold text-gray-800">{wo.woNumber}: {wo.productName}</p>
          <p className="text-xs text-gray-500 mt-1">Target: {wo.targetQty} units</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Finished Good Yield</label><input type="number" value={producedQty} onChange={e => setProducedQty(e.target.value)} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Scrap / Waste Qty</label><input type="number" value={scrapQty} onChange={e => setScrapQty(e.target.value)} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><p className="text-xs text-amber-700">This will mark the work order as Completed. Ensure the yield and scrap quantities are accurate.</p></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={false} label="Mark Completed" />
    </Modal>
  );
}

function QualityControlView({ qcRecords, workOrders, onRefresh }: { qcRecords: QCRecord[]; workOrders: WorkOrder[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const completedWOs = workOrders.filter(wo => wo.status === "Completed" || wo.status === "QC");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Quality Control</h1><p className="text-sm text-gray-400 mt-0.5">Inspection ledger for completed work orders</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Inspection</button></div>
      {qcRecords.length === 0 ? <EmptyState icon={Shield} text="No quality inspections logged" /> : (
        <DataTable headers={["WO #", "Product", "Inspected", "Passed", "Rejected", "Rejection Reason", "Inspector", "Date", ""]}>
          {qcRecords.map(qc => {
            const passRate = qc.inspectedQty > 0 ? Math.round((qc.passedQty / qc.inspectedQty) * 100) : 0;
            return (
              <tr key={qc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{qc.woNumber}</td>
                <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{qc.productName}</td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{qc.inspectedQty}</td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-green-600">{qc.passedQty}</td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-red-500">{qc.rejectedQty}</td>
                <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[180px] truncate">{qc.rejectionReason || "—"}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{qc.inspectedBy || "—"}</td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(qc.inspectionDate)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${passRate >= 90 ? "bg-green-50 text-green-600" : passRate >= 70 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>{passRate}% pass</span>
                    <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/quality-control/${qc.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
      {showModal && <LogInspectionModal workOrders={completedWOs} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogInspectionModal({ workOrders, onClose, onSaved }: { workOrders: WorkOrder[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ workOrderId: "", woNumber: "", productName: "", inspectedQty: "", passedQty: "", rejectedQty: "", rejectionReason: "", inspectedBy: "", inspectionDate: new Date().toISOString().split("T")[0] });
  const handleSelectWO = (woId: string) => {
    const wo = workOrders.find(w => w.id === parseInt(woId));
    if (wo) setForm({ ...form, workOrderId: woId, woNumber: wo.woNumber, productName: wo.productName, inspectedQty: wo.producedQty.toString() });
  };
  const updateQty = (field: "passedQty" | "rejectedQty", val: string) => {
    const newForm = { ...form, [field]: val };
    if (field === "passedQty") newForm.rejectedQty = ((parseInt(form.inspectedQty) || 0) - (parseInt(val) || 0)).toString();
    if (field === "rejectedQty") newForm.passedQty = ((parseInt(form.inspectedQty) || 0) - (parseInt(val) || 0)).toString();
    setForm(newForm);
  };
  const handleSave = async () => {
    if (!form.workOrderId || !form.inspectedQty) return; setSaving(true);
    try { const res = await authFetch("/api/forge/quality-control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, workOrderId: parseInt(form.workOrderId), inspectedQty: parseInt(form.inspectedQty) || 0, passedQty: parseInt(form.passedQty) || 0, rejectedQty: parseInt(form.rejectedQty) || 0, inspectionDate: form.inspectionDate || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Log Quality Inspection" icon={Shield} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Work Order</label><select value={form.workOrderId} onChange={e => handleSelectWO(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select a Work Order...</option>{workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.woNumber}: {wo.productName} (Produced: {wo.producedQty})</option>)}</select></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspected Qty</label><input type="number" value={form.inspectedQty} onChange={e => setForm({ ...form, inspectedQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Passed Qty</label><input type="number" value={form.passedQty} onChange={e => updateQty("passedQty", e.target.value)} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Rejected Qty</label><input type="number" value={form.rejectedQty} onChange={e => updateQty("rejectedQty", e.target.value)} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Rejection Reason</label><textarea rows={2} value={form.rejectionReason} onChange={e => setForm({ ...form, rejectionReason: e.target.value })} placeholder="e.g. Dimensional out of tolerance, surface defects..." className={inputCls + " resize-none"} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspected By</label><input type="text" value={form.inspectedBy} onChange={e => setForm({ ...form, inspectedBy: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Inspection Date</label><input type="date" value={form.inspectionDate} onChange={e => setForm({ ...form, inspectionDate: e.target.value })} className={inputCls} /></div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.workOrderId || !form.inspectedQty} label="Log Inspection" />
    </Modal>
  );
}

function DowntimeLogsView({ downtimeLogs, workstations, onRefresh }: { downtimeLogs: DowntimeLog[]; workstations: Workstation[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  const reasonColors: Record<string, string> = {
    "Mechanical Failure": "bg-red-50 text-red-500 border-red-200",
    "Material Shortage": "bg-amber-50 text-amber-600 border-amber-200",
    "Labor Absence": "bg-blue-50 text-blue-600 border-blue-200",
    "Power Outage": "bg-purple-50 text-purple-600 border-purple-200",
    "Tooling Issue": "bg-orange-50 text-orange-600 border-orange-200",
    "Other": "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Downtime Logs</h1><p className="text-sm text-gray-400 mt-0.5">Track production inefficiencies and stoppages</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Downtime</button></div>
      {downtimeLogs.length === 0 ? <EmptyState icon={Clock} text="No downtime events logged" /> : (
        <DataTable headers={["Workstation", "Reason", "Start", "End", "Minutes Lost", "Logged By", ""]}>
          {downtimeLogs.map(dt => (
            <tr key={dt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{dt.workstationName}</td>
              <td className="px-4 py-3.5"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${reasonColors[dt.reason] || reasonColors["Other"]}`}>{dt.reason}</span></td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(dt.startTime)} {fmtTime(dt.startTime)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{dt.endTime ? `${fmtDate(dt.endTime)} ${fmtTime(dt.endTime)}` : "Ongoing"}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-red-500">{dt.totalMinutesLost} min</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{dt.loggedBy || "—"}</td>
              <td className="px-4 py-3.5"><button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/forge/downtime-logs/${dt.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
            </tr>
          ))}
        </DataTable>
      )}
      {showModal && <LogDowntimeModal workstations={workstations} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogDowntimeModal({ workstations, onClose, onSaved }: { workstations: Workstation[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ workstationId: "", workstationName: "", reason: "Mechanical Failure", startTime: "", endTime: "", totalMinutesLost: "", loggedBy: "", notes: "" });
  const handleSelectWS = (wsId: string) => { const ws = workstations.find(w => w.id === parseInt(wsId)); setForm({ ...form, workstationId: wsId, workstationName: ws?.name || "" }); };

  const calcMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.round(diff / 60000));
  };

  const updateTime = (field: "startTime" | "endTime", val: string) => {
    const newForm = { ...form, [field]: val };
    if (newForm.startTime && newForm.endTime) { newForm.totalMinutesLost = calcMinutes(newForm.startTime, newForm.endTime).toString(); }
    setForm(newForm);
  };

  const handleSave = async () => {
    if (!form.workstationId || !form.startTime) return; setSaving(true);
    try { const res = await authFetch("/api/forge/downtime-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, workstationId: parseInt(form.workstationId), totalMinutesLost: parseInt(form.totalMinutesLost) || 0, startTime: form.startTime, endTime: form.endTime || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Log Downtime Event" icon={Clock} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Workstation</label><select value={form.workstationId} onChange={e => handleSelectWS(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select Workstation...</option>{workstations.map(ws => <option key={ws.id} value={ws.id}>{ws.name} ({ws.type})</option>)}</select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Downtime Reason</label><select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Mechanical Failure">Mechanical Failure</option><option value="Material Shortage">Material Shortage</option><option value="Labor Absence">Labor Absence</option><option value="Power Outage">Power Outage</option><option value="Tooling Issue">Tooling Issue</option><option value="Other">Other</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label><input type="datetime-local" value={form.startTime} onChange={e => updateTime("startTime", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label><input type="datetime-local" value={form.endTime} onChange={e => updateTime("endTime", e.target.value)} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Total Minutes Lost</label><input type="number" value={form.totalMinutesLost} onChange={e => setForm({ ...form, totalMinutesLost: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By</label><input type="text" value={form.loggedBy} onChange={e => setForm({ ...form, loggedBy: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.workstationId || !form.startTime} label="Log Downtime" />
    </Modal>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">{text}</p></div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
      {headers.map((h, i) => <th key={i} className={`px-${i === 0 ? 5 : 4} py-3 text-${h ? "left" : "center"} text-[10px] font-semibold text-gray-500 uppercase tracking-wider ${!h ? "w-[80px]" : ""}`}>{h}</th>)}
    </tr></thead><tbody>{children}</tbody></table></div>
  );
}

function Modal({ title, icon: Icon, onClose, children, wide }: { title: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? "w-[680px]" : "w-[520px]"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Icon className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">{title}</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled, label }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean; label: string }) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
      <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"><Plus className="w-4 h-4" /> {label}</button>
    </div>
  );
}
