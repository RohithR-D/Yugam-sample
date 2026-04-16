import { authFetch } from "@/lib/authFetch";
import { useState, useMemo } from "react";
import {
  Search, Plus, X, Package, ShoppingBag, ClipboardList, FileText, FileCheck,
  ShoppingCart, Trash2, ChevronRight, CheckCircle, XCircle, ArrowRight,
  BarChart3, Receipt, RotateCcw, Eye, Truck, AlertTriangle,
} from "lucide-react";
import { useFlex } from "../hooks/useFlex";
import { useFlexSub } from "../hooks/useFlexSub";
import { fmt, fmtDate, inputCls } from "../utils/flexUtils";
import type { Bid, GRN, GRNItem, MR, PInv, PO, POItem, PR, PRet, RFQ } from "../types";

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200", Approved: "bg-blue-50 text-blue-600 border-blue-200",
    Rejected: "bg-red-50 text-red-500 border-red-200", Converted: "bg-purple-50 text-purple-600 border-purple-200",
    Open: "bg-blue-50 text-blue-600 border-blue-200", Received: "bg-green-50 text-green-600 border-green-200",
    Closed: "bg-gray-50 text-gray-500 border-gray-200", Draft: "bg-gray-50 text-gray-500 border-gray-200",
    Sent: "bg-blue-50 text-blue-600 border-blue-200", Acknowledged: "bg-green-50 text-green-600 border-green-200",
    Partial: "bg-amber-50 text-amber-600 border-amber-200", Complete: "bg-green-50 text-green-600 border-green-200",
    Matched: "bg-green-50 text-green-600 border-green-200", Mismatch: "bg-red-50 text-red-500 border-red-200",
    Unpaid: "bg-amber-50 text-amber-600 border-amber-200", Paid: "bg-green-50 text-green-600 border-green-200",
    Initiated: "bg-amber-50 text-amber-600 border-amber-200", Credited: "bg-green-50 text-green-600 border-green-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

export default function FlexDashboard() {
  const sub = useFlexSub();
  const { mrs, prs, rfqs, bids, pos, grns, pinvs, prets, loading, fetchAll } = useFlex();

  if (loading) return <div className="text-center py-16 text-gray-400">Loading procurement data...</div>;

  switch (sub) {
    case "Material Requests": return <MaterialRequestsView mrs={mrs} onRefresh={fetchAll} />;
    case "Purchase Requests": return <PurchaseRequestsView prs={prs} mrs={mrs} onRefresh={fetchAll} />;
    case "Quotation Requests": return <QuotationRequestsView rfqs={rfqs} prs={prs} onRefresh={fetchAll} />;
    case "Quotation Validations": return <QuotationValidationsView rfqs={rfqs} bids={bids} onRefresh={fetchAll} />;
    case "Purchase Orders": return <PurchaseOrdersView pos={pos} onRefresh={fetchAll} />;
    case "Goods Receipts": return <GoodsReceiptsView grns={grns} pos={pos} onRefresh={fetchAll} />;
    case "Purchase Invoices": return <PurchaseInvoicesView pinvs={pinvs} pos={pos} grns={grns} onRefresh={fetchAll} />;
    case "Purchase Returns": return <PurchaseReturnsView prets={prets} pos={pos} grns={grns} onRefresh={fetchAll} />;
    default: return <MaterialRequestsView mrs={mrs} onRefresh={fetchAll} />;
  }
}

function MaterialRequestsView({ mrs, onRefresh }: { mrs: MR[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return mrs; const q = search.toLowerCase(); return mrs.filter(m => m.itemName.toLowerCase().includes(q) || m.requestedBy.toLowerCase().includes(q) || m.department.toLowerCase().includes(q)); }, [mrs, search]);
  const handleStatus = async (id: number, status: string) => { await authFetch(`/api/flex/material-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); onRefresh(); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Material Requests</h1><p className="text-sm text-gray-400 mt-0.5">Internal demands for raw materials and supplies</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create Request</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={ClipboardList} text="No material requests" /> : (
        <DataTable headers={["Item", "Qty", "Required By", "Department", "Requested By", "Status", ""]}>
          {filtered.map(mr => (
            <tr key={mr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{mr.itemName}</td>
              <td className="px-4 py-3.5 text-sm font-bold text-gray-800 text-right">{mr.requestedQty}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(mr.requiredByDate)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-600">{mr.department || "—"}</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{mr.requestedBy || "—"}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={mr.status} /></td>
              <td className="px-4 py-3.5"><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {mr.status === "Pending" && <><button onClick={() => handleStatus(mr.id, "Approved")} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleStatus(mr.id, "Rejected")} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Reject"><XCircle className="w-3.5 h-3.5" /></button></>}
                <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/flex/material-requests/${mr.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>
          ))}
        </DataTable>
      )}
      {showModal && <CreateMRModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function CreateMRModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemName: "", requestedQty: "", requiredByDate: "", department: "", project: "", requestedBy: "" });
  const handleSave = async () => {
    if (!form.itemName.trim() || !form.requestedQty) return; setSaving(true);
    try { const res = await authFetch("/api/flex/material-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, requestedQty: parseInt(form.requestedQty), requiredByDate: form.requiredByDate || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Create Material Request" icon={ClipboardList} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label><input type="text" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Steel Plates 5mm" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Requested Qty</label><input type="number" value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Required By Date</label><input type="date" value={form.requiredByDate} onChange={e => setForm({ ...form, requiredByDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Production" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label><input type="text" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} placeholder="Project Alpha" className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Requested By</label><input type="text" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} className={inputCls} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.itemName.trim() || !form.requestedQty} label="Submit Request" />
    </Modal>
  );
}

function PurchaseRequestsView({ prs, mrs, onRefresh }: { prs: PR[]; mrs: MR[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return prs; const q = search.toLowerCase(); return prs.filter(p => p.itemName.toLowerCase().includes(q) || p.requestedBy.toLowerCase().includes(q)); }, [prs, search]);
  const handleStatus = async (id: number, status: string) => { await authFetch(`/api/flex/purchase-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); onRefresh(); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Purchase Requests</h1><p className="text-sm text-gray-400 mt-0.5">Internal purchase requisitions for procurement</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create PR</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search purchase requests..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={FileText} text="No purchase requests" /> : (
        <DataTable headers={["Item", "Qty", "Est. Price", "Required By", "Dept / Project", "Requested By", "Status", ""]}>
          {filtered.map(pr => (
            <tr key={pr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{pr.itemName}</td>
              <td className="px-4 py-3.5 text-sm font-bold text-gray-800 text-right">{pr.requestedQty}</td>
              <td className="px-4 py-3.5 text-sm text-right text-gray-700">{fmt(parseFloat(pr.estimatedUnitPrice) || 0)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(pr.requiredByDate)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-600">{[pr.department, pr.project].filter(Boolean).join(" / ") || "—"}</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{pr.requestedBy || "—"}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={pr.status} /></td>
              <td className="px-4 py-3.5"><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {pr.status === "Pending" && <><button onClick={() => handleStatus(pr.id, "Approved")} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleStatus(pr.id, "Rejected")} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Reject"><XCircle className="w-3.5 h-3.5" /></button></>}
                <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/flex/purchase-requests/${pr.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>
          ))}
        </DataTable>
      )}
      {showModal && <CreatePRModal mrs={mrs} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function CreatePRModal({ mrs, onClose, onSaved }: { mrs: MR[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const approvedMRs = mrs.filter(m => m.status === "Approved");
  const [form, setForm] = useState({ itemName: "", requestedQty: "", estimatedUnitPrice: "", requiredByDate: "", department: "", project: "", requestedBy: "", materialRequestId: "" });
  const handleSelectMR = (mrId: string) => {
    const mr = approvedMRs.find(m => m.id === parseInt(mrId));
    if (mr) setForm({ ...form, materialRequestId: mrId, itemName: mr.itemName, requestedQty: mr.requestedQty.toString(), department: mr.department, project: mr.project, requestedBy: mr.requestedBy, requiredByDate: mr.requiredByDate ? new Date(mr.requiredByDate).toISOString().split("T")[0] : "" });
    else setForm({ ...form, materialRequestId: mrId });
  };
  const handleSave = async () => {
    if (!form.itemName.trim() || !form.requestedQty) return; setSaving(true);
    try { const res = await authFetch("/api/flex/purchase-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, requestedQty: parseInt(form.requestedQty), materialRequestId: form.materialRequestId ? parseInt(form.materialRequestId) : null, requiredByDate: form.requiredByDate || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Create Purchase Request" icon={FileText} onClose={onClose}>
      <div className="p-6 space-y-4">
        {approvedMRs.length > 0 && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to Material Request (optional)</label><select value={form.materialRequestId} onChange={e => handleSelectMR(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Manual entry...</option>{approvedMRs.map(mr => <option key={mr.id} value={mr.id}>MR-{mr.id}: {mr.itemName} (Qty: {mr.requestedQty})</option>)}</select></div>}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label><input type="text" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Qty</label><input type="number" value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Est. Unit Price (₹)</label><input type="number" value={form.estimatedUnitPrice} onChange={e => setForm({ ...form, estimatedUnitPrice: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Required By</label><input type="date" value={form.requiredByDate} onChange={e => setForm({ ...form, requiredByDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label><input type="text" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Requested By</label><input type="text" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} className={inputCls} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.itemName.trim() || !form.requestedQty} label="Submit PR" />
    </Modal>
  );
}

function QuotationRequestsView({ rfqs, prs, onRefresh }: { rfqs: RFQ[]; prs: PR[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Quotation Requests (RFQ)</h1><p className="text-sm text-gray-400 mt-0.5">Send approved PRs to vendors for competitive bidding</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create RFQ</button></div>
      {rfqs.length === 0 ? <EmptyState icon={FileCheck} text="No RFQs created" /> : (
        <DataTable headers={["RFQ #", "Item", "Qty", "Vendors", "Required By", "Status", ""]}>
          {rfqs.map(rfq => { const vendors = (() => { try { return JSON.parse(rfq.vendors); } catch { return []; } })(); return (
            <tr key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{rfq.rfqNumber}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{rfq.itemName}</td>
              <td className="px-4 py-3.5 text-sm font-bold text-gray-800 text-right">{rfq.quantity}</td>
              <td className="px-4 py-3.5"><div className="flex flex-wrap gap-1">{vendors.length > 0 ? vendors.map((v: string, i: number) => <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full border border-blue-200">{v}</span>) : <span className="text-xs text-gray-400">None</span>}</div></td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(rfq.requiredByDate)}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={rfq.status} /></td>
              <td className="px-4 py-3.5"><button onClick={async () => { await authFetch(`/api/flex/rfqs/${rfq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: rfq.status === "Open" ? "Received" : "Closed" }) }); onRefresh(); }} className="px-3 py-1.5 text-[10px] font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">{rfq.status === "Open" ? "Mark Received" : "Close"}</button></td>
            </tr>
          ); })}
        </DataTable>
      )}
      {showModal && <CreateRFQModal prs={prs} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function CreateRFQModal({ prs, onClose, onSaved }: { prs: PR[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const approvedPRs = prs.filter(p => p.status === "Approved");
  const [form, setForm] = useState({ rfqNumber: `RFQ-${Date.now().toString().slice(-6)}`, purchaseRequestId: "", itemName: "", quantity: "", vendorInput: "", vendors: [] as string[] });
  const handleSelectPR = (prId: string) => {
    const pr = approvedPRs.find(p => p.id === parseInt(prId));
    if (pr) setForm({ ...form, purchaseRequestId: prId, itemName: pr.itemName, quantity: pr.requestedQty.toString() });
    else setForm({ ...form, purchaseRequestId: prId });
  };
  const addVendor = () => { if (form.vendorInput.trim() && !form.vendors.includes(form.vendorInput.trim())) { setForm({ ...form, vendors: [...form.vendors, form.vendorInput.trim()], vendorInput: "" }); } };
  const removeVendor = (v: string) => { setForm({ ...form, vendors: form.vendors.filter(x => x !== v) }); };
  const handleSave = async () => {
    if (!form.itemName.trim() || !form.quantity || form.vendors.length === 0) return; setSaving(true);
    try {
      const payload = { rfqNumber: form.rfqNumber, itemName: form.itemName, quantity: parseInt(form.quantity), vendors: JSON.stringify(form.vendors), purchaseRequestId: form.purchaseRequestId ? parseInt(form.purchaseRequestId) : null };
      const res = await authFetch("/api/flex/rfqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok && form.purchaseRequestId) { await authFetch(`/api/flex/purchase-requests/${form.purchaseRequestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Converted" }) }); }
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Create RFQ" icon={FileCheck} onClose={onClose}>
      <div className="p-6 space-y-4">
        {approvedPRs.length > 0 && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Convert from approved PR</label><select value={form.purchaseRequestId} onChange={e => handleSelectPR(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Manual entry...</option>{approvedPRs.map(pr => <option key={pr.id} value={pr.id}>PR-{pr.id}: {pr.itemName} (Qty: {pr.requestedQty})</option>)}</select></div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">RFQ Number</label><input type="text" value={form.rfqNumber} onChange={e => setForm({ ...form, rfqNumber: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label><input type="text" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Assign Vendors</label>
          <div className="flex gap-2"><input type="text" value={form.vendorInput} onChange={e => setForm({ ...form, vendorInput: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addVendor(); } }} placeholder="Type vendor name and press Enter" className={inputCls + " flex-1"} /><button type="button" onClick={addVendor} className="px-3 py-2 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f]"><Plus className="w-4 h-4" /></button></div>
          {form.vendors.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{form.vendors.map(v => <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-200">{v}<button onClick={() => removeVendor(v)} className="hover:text-red-500"><X className="w-3 h-3" /></button></span>)}</div>}
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.itemName.trim() || !form.quantity || form.vendors.length === 0} label="Create RFQ" />
    </Modal>
  );
}

function QuotationValidationsView({ rfqs, bids, onRefresh }: { rfqs: RFQ[]; bids: Bid[]; onRefresh: () => void }) {
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const rfqsWithBids = rfqs.filter(r => r.status !== "Closed");
  const selectedBids = selectedRfq ? bids.filter(b => b.rfqId === selectedRfq.id) : [];

  const handleSelectBid = async (bidId: number) => {
    await authFetch(`/api/flex/rfq-bids/${bidId}/select`, { method: "PATCH", headers: { "Content-Type": "application/json" } });
    onRefresh();
  };

  const handleCreatePO = async (bid: Bid) => {
    if (!selectedRfq) return;
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const qty = selectedRfq.quantity;
    const rate = parseFloat(bid.unitPrice) || 0;
    const taxPct = parseFloat(bid.taxPercent) || 0;
    const lineTotal = qty * rate * (1 + taxPct / 100);
    const payload = { poNumber, vendorName: bid.vendorName, rfqId: selectedRfq.id, subtotal: (qty * rate).toString(), cgstTotal: ((qty * rate * taxPct / 200)).toString(), sgstTotal: ((qty * rate * taxPct / 200)).toString(), igstTotal: "0", grandTotal: lineTotal.toString(), status: "Draft", items: [{ description: selectedRfq.itemName, qty, rate: bid.unitPrice, cgstPercent: (taxPct / 2).toString(), sgstPercent: (taxPct / 2).toString(), igstPercent: "0", lineTotal: lineTotal.toString() }] };
    await authFetch("/api/flex/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await authFetch(`/api/flex/rfqs/${selectedRfq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Closed" }) });
    onRefresh(); setSelectedRfq(null);
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Quotation Validations</h1><p className="text-sm text-gray-400 mt-0.5">Compare vendor bids side-by-side and select the best offer</p></div>
      <div className="grid grid-cols-3 gap-4">
        {rfqsWithBids.length === 0 ? <div className="col-span-3"><EmptyState icon={BarChart3} text="No open RFQs to validate" /></div> : rfqsWithBids.map(rfq => {
          const rfqBids = bids.filter(b => b.rfqId === rfq.id);
          return (
            <div key={rfq.id} onClick={() => setSelectedRfq(rfq)} className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:border-[#E31E24]/40 ${selectedRfq?.id === rfq.id ? "border-[#E31E24] ring-1 ring-[#E31E24]/20" : "border-gray-100"}`}>
              <p className="text-xs font-mono text-gray-400">{rfq.rfqNumber}</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{rfq.itemName}</p>
              <p className="text-xs text-gray-500 mt-1">Qty: {rfq.quantity} · {rfqBids.length} bid{rfqBids.length !== 1 ? "s" : ""}</p>
              <StatusPill status={rfq.status} />
            </div>
          );
        })}
      </div>
      {selectedRfq && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Bids for {selectedRfq.rfqNumber}: {selectedRfq.itemName}</h2>
            <button onClick={() => setShowBidModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Bid</button>
          </div>
          {selectedBids.length === 0 ? <EmptyState icon={BarChart3} text="No bids yet — add vendor quotes" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBids.map(bid => {
                const totalPerUnit = (parseFloat(bid.unitPrice) || 0) * (1 + (parseFloat(bid.taxPercent) || 0) / 100);
                return (
                  <div key={bid.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${bid.selected === "Yes" ? "border-green-400 ring-1 ring-green-200" : "border-gray-100"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-800">{bid.vendorName}</p>
                      {bid.selected === "Yes" && <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-200">SELECTED</span>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-gray-400">Unit Price</span><span className="text-sm font-semibold text-gray-800">{fmt(parseFloat(bid.unitPrice) || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-400">Tax %</span><span className="text-sm font-medium text-gray-700">{bid.taxPercent}%</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-400">Lead Time</span><span className="text-sm font-medium text-gray-700">{bid.leadTimeDays} days</span></div>
                      <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="text-xs font-semibold text-gray-500">Total/Unit (incl. tax)</span><span className="text-sm font-bold text-[#E31E24]">{fmt(totalPerUnit)}</span></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {bid.selected !== "Yes" && <button onClick={() => handleSelectBid(bid.id)} className="flex-1 px-3 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">Select Winner</button>}
                      {bid.selected === "Yes" && <button onClick={() => handleCreatePO(bid)} className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">Approve & Create PO</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {showBidModal && selectedRfq && <AddBidModal rfq={selectedRfq} onClose={() => setShowBidModal(false)} onSaved={() => { setShowBidModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddBidModal({ rfq, onClose, onSaved }: { rfq: RFQ; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vendorName: "", unitPrice: "", taxPercent: "", leadTimeDays: "", notes: "" });
  const handleSave = async () => {
    if (!form.vendorName.trim() || !form.unitPrice) return; setSaving(true);
    try { const res = await authFetch("/api/flex/rfq-bids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rfqId: rfq.id, vendorName: form.vendorName, unitPrice: form.unitPrice, taxPercent: form.taxPercent || "0", leadTimeDays: parseInt(form.leadTimeDays) || 0, notes: form.notes }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title={`Add Bid for ${rfq.rfqNumber}`} icon={BarChart3} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label><input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Unit Price (₹)</label><input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Tax %</label><input type="number" value={form.taxPercent} onChange={e => setForm({ ...form, taxPercent: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Lead Time (days)</label><input type="number" value={form.leadTimeDays} onChange={e => setForm({ ...form, leadTimeDays: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.vendorName.trim() || !form.unitPrice} label="Submit Bid" />
    </Modal>
  );
}

function PurchaseOrdersView({ pos, onRefresh }: { pos: PO[]; onRefresh: () => void }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { if (!search.trim()) return pos; const q = search.toLowerCase(); return pos.filter(p => p.poNumber.toLowerCase().includes(q) || p.vendorName.toLowerCase().includes(q)); }, [pos, search]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1><p className="text-sm text-gray-400 mt-0.5">Formal order documents sent to vendors</p></div>
        <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Create PO</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={ShoppingCart} text="No purchase orders" /> : (
        <DataTable headers={["PO #", "Vendor", "PO Date", "Delivery Date", "Subtotal", "Tax", "Grand Total", "Status", ""]}>
          {filtered.map(po => (
            <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{po.poNumber}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{po.vendorName}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(po.poDate)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(po.deliveryDate)}</td>
              <td className="px-4 py-3.5 text-right text-sm text-gray-700">{fmt(parseFloat(po.subtotal) || 0)}</td>
              <td className="px-4 py-3.5 text-right text-xs text-gray-500">{fmt((parseFloat(po.cgstTotal) || 0) + (parseFloat(po.sgstTotal) || 0) + (parseFloat(po.igstTotal) || 0))}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{fmt(parseFloat(po.grandTotal) || 0)}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={po.status} /></td>
              <td className="px-4 py-3.5"><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={async () => { if (confirm("Delete PO?")) { await authFetch(`/api/flex/purchase-orders/${po.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div></td>
            </tr>
          ))}
        </DataTable>
      )}
      {showBuilder && <POBuilder onClose={() => setShowBuilder(false)} onSaved={() => { setShowBuilder(false); onRefresh(); }} />}
    </div>
  );
}

interface LineItem { description: string; hsnSac: string; qty: string; rate: string; cgstPercent: string; sgstPercent: string; igstPercent: string; }

function POBuilder({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ poNumber: `PO-${Date.now().toString().slice(-6)}`, vendorName: "", poDate: new Date().toISOString().split("T")[0], deliveryDate: "", terms: "" });
  const [items, setItems] = useState<LineItem[]>([{ description: "", hsnSac: "", qty: "1", rate: "0", cgstPercent: "9", sgstPercent: "9", igstPercent: "0" }]);

  const addLine = () => setItems([...items, { description: "", hsnSac: "", qty: "1", rate: "0", cgstPercent: "9", sgstPercent: "9", igstPercent: "0" }]);
  const removeLine = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateLine = (i: number, field: string, val: string) => { const n = [...items]; (n[i] as any)[field] = val; setItems(n); };

  const calcLine = (it: LineItem) => { const q = parseInt(it.qty) || 0; const r = parseFloat(it.rate) || 0; const base = q * r; const cgst = base * (parseFloat(it.cgstPercent) || 0) / 100; const sgst = base * (parseFloat(it.sgstPercent) || 0) / 100; const igst = base * (parseFloat(it.igstPercent) || 0) / 100; return { base, cgst, sgst, igst, total: base + cgst + sgst + igst }; };
  const totals = items.reduce((acc, it) => { const c = calcLine(it); return { subtotal: acc.subtotal + c.base, cgst: acc.cgst + c.cgst, sgst: acc.sgst + c.sgst, igst: acc.igst + c.igst, grand: acc.grand + c.total }; }, { subtotal: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 });

  const handleSave = async () => {
    if (!form.vendorName.trim() || items.every(i => !i.description.trim())) return; setSaving(true);
    const payload = {
      ...form, poDate: form.poDate || undefined, deliveryDate: form.deliveryDate || undefined,
      subtotal: totals.subtotal.toString(), cgstTotal: totals.cgst.toString(), sgstTotal: totals.sgst.toString(), igstTotal: totals.igst.toString(), grandTotal: totals.grand.toString(),
      items: items.filter(i => i.description.trim()).map(i => ({ ...i, qty: parseInt(i.qty) || 1, lineTotal: calcLine(i).total.toString() })),
    };
    try { const res = await authFetch("/api/flex/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">Purchase Order Builder</h2></div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">PO Number</label><input type="text" value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label><input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} placeholder="Tata Steel" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">PO Date</label><input type="date" value={form.poDate} onChange={e => setForm({ ...form, poDate: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Delivery Date</label><input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className={inputCls} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">Line Items</h3><button onClick={addLine} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Line</button></div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[200px]">Description</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase w-[70px]">HSN</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[60px]">Qty</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[80px]">Rate</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[60px]">CGST%</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[60px]">SGST%</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[60px]">IGST%</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase w-[90px]">Total</th>
                <th className="w-[36px]"></th>
              </tr></thead><tbody>
                {items.map((it, i) => { const c = calcLine(it); return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-2 py-1.5"><input type="text" value={it.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Item description" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-[#E31E24]" /></td>
                    <td className="px-1 py-1.5"><input type="text" value={it.hsnSac} onChange={e => updateLine(i, "hsnSac", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24]" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={it.qty} onChange={e => updateLine(i, "qty", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={it.rate} onChange={e => updateLine(i, "rate", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={it.cgstPercent} onChange={e => updateLine(i, "cgstPercent", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={it.sgstPercent} onChange={e => updateLine(i, "sgstPercent", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-1 py-1.5"><input type="number" value={it.igstPercent} onChange={e => updateLine(i, "igstPercent", e.target.value)} className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                    <td className="px-2 py-1.5 text-right text-sm font-semibold text-gray-800">{fmt(c.total)}</td>
                    <td className="px-1 py-1.5">{items.length > 1 && <button onClick={() => removeLine(i)} className="p-1 rounded text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}</td>
                  </tr>
                ); })}
              </tbody></table>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-[280px] bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-800">{fmt(totals.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">CGST</span><span className="text-gray-700">{fmt(totals.cgst)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">SGST</span><span className="text-gray-700">{fmt(totals.sgst)}</span></div>
              {totals.igst > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">IGST</span><span className="text-gray-700">{fmt(totals.igst)}</span></div>}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm"><span className="font-bold text-gray-800">Grand Total</span><span className="font-bold text-[#E31E24] text-base">{fmt(totals.grand)}</span></div>
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Terms & Conditions</label><textarea rows={3} value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="Payment terms, delivery conditions..." className={inputCls + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.vendorName.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> Save PO</button>
        </div>
      </div>
    </div>
  );
}

function GoodsReceiptsView({ grns, pos, onRefresh }: { grns: GRN[]; pos: PO[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Goods Receipts (GRN)</h1><p className="text-sm text-gray-400 mt-0.5">Log received shipments against approved POs</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Receipt</button></div>
      {grns.length === 0 ? <EmptyState icon={Package} text="No goods receipts" /> : (
        <DataTable headers={["GRN #", "PO #", "Vendor", "Received Date", "Received By", "Status", ""]}>
          {grns.map(grn => { const po = pos.find(p => p.id === grn.poId); return (
            <tr key={grn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{grn.grnNumber}</td>
              <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{po?.poNumber || `PO #${grn.poId}`}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{grn.vendorName || po?.vendorName || "—"}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(grn.receivedDate)}</td>
              <td className="px-4 py-3.5 text-sm text-gray-600">{grn.receivedBy || "—"}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={grn.status} /></td>
              <td className="px-4 py-3.5"><button onClick={async () => { const next = grn.status === "Pending" ? "Partial" : "Complete"; await authFetch(`/api/flex/goods-receipts/${grn.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); onRefresh(); }} className="px-3 py-1.5 text-[10px] font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Update status">{grn.status === "Pending" ? "Mark Partial" : grn.status === "Partial" ? "Mark Complete" : "Done"}</button></td>
            </tr>
          ); })}
        </DataTable>
      )}
      {showModal && <LogReceiptModal pos={pos} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogReceiptModal({ pos, onClose, onSaved }: { pos: PO[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string>("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [receivedQtys, setReceivedQtys] = useState<Record<number, string>>({});
  const [form, setForm] = useState({ grnNumber: `GRN-${Date.now().toString().slice(-6)}`, receivedDate: new Date().toISOString().split("T")[0], receivedBy: "", notes: "" });

  const handleSelectPO = async (poId: string) => {
    setSelectedPO(poId);
    if (poId) {
      const res = await authFetch(`/api/flex/purchase-orders/${poId}`);
      if (res.ok) { const data = await res.json(); setPoItems(data.items || []); const initial: Record<number, string> = {}; (data.items || []).forEach((it: POItem) => { initial[it.id] = it.qty.toString(); }); setReceivedQtys(initial); }
    } else { setPoItems([]); setReceivedQtys({}); }
  };

  const handleSave = async () => {
    if (!selectedPO) return; setSaving(true);
    const po = pos.find(p => p.id === parseInt(selectedPO));
    const grnItems = poItems.map(it => { const recv = parseInt(receivedQtys[it.id] || "0") || 0; return { description: it.description, orderedQty: it.qty, receivedQty: recv, acceptedQty: recv, rejectedQty: 0 }; });
    const hasItems = grnItems.length > 0;
    const allFull = hasItems && grnItems.every(g => g.receivedQty >= g.orderedQty);
    try { const res = await authFetch("/api/flex/goods-receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, poId: parseInt(selectedPO), vendorName: po?.vendorName || "", receivedDate: form.receivedDate || undefined, status: allFull ? "Complete" : "Partial", items: grnItems }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Log Goods Receipt" icon={Package} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Select PO</label><select value={selectedPO} onChange={e => handleSelectPO(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select a PO...</option>{pos.filter(p => p.status !== "Closed").map(p => <option key={p.id} value={p.id}>{p.poNumber} — {p.vendorName}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">GRN Number</label><input type="text" value={form.grnNumber} onChange={e => setForm({ ...form, grnNumber: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Received Date</label><input type="date" value={form.receivedDate} onChange={e => setForm({ ...form, receivedDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Received By</label><input type="text" value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} className={inputCls} /></div>
        </div>
        {poItems.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Line Items — Ordered vs Received</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Ordered Qty</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Received Qty</th>
            </tr></thead><tbody>
              {poItems.map(it => (
                <tr key={it.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-800">{it.description}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-600">{it.qty}</td>
                  <td className="px-4 py-2.5"><input type="number" value={receivedQtys[it.id] || ""} onChange={e => setReceivedQtys({ ...receivedQtys, [it.id]: e.target.value })} className="w-24 ml-auto block px-2 py-1.5 text-sm text-right border border-gray-200 rounded outline-none focus:border-[#E31E24] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                </tr>
              ))}
            </tbody></table></div>
          </div>
        )}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!selectedPO} label="Log Receipt" />
    </Modal>
  );
}

function PurchaseInvoicesView({ pinvs, pos, grns, onRefresh }: { pinvs: PInv[]; pos: PO[]; grns: GRN[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  const getMatchIndicator = (inv: PInv) => {
    const invAmt = parseFloat(inv.invoiceAmount) || 0;
    const poAmt = parseFloat(inv.poAmount) || 0;
    const grnAmt = parseFloat(inv.grnAmount) || 0;
    if (!poAmt && !grnAmt) return { label: "No Match Data", color: "text-gray-400", bg: "bg-gray-50" };
    const poMatch = Math.abs(invAmt - poAmt) < 1;
    const grnMatch = Math.abs(invAmt - grnAmt) < 1;
    if (poMatch && grnMatch) return { label: "3-Way Match", color: "text-green-600", bg: "bg-green-50" };
    if (poMatch || grnMatch) return { label: "Partial Match", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "Mismatch", color: "text-red-500", bg: "bg-red-50" };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1><p className="text-sm text-gray-400 mt-0.5">Vendor bills with 3-way matching (PO vs GRN vs Invoice)</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Invoice</button></div>
      {pinvs.length === 0 ? <EmptyState icon={Receipt} text="No purchase invoices" /> : (
        <DataTable headers={["Invoice #", "Vendor", "Date", "Invoice Amt", "PO Amt", "GRN Amt", "Match", "Payment", ""]}>
          {pinvs.map(inv => { const match = getMatchIndicator(inv); return (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{inv.invoiceNumber}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{inv.vendorName}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(inv.invoiceDate)}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{fmt(parseFloat(inv.invoiceAmount) || 0)}</td>
              <td className="px-4 py-3.5 text-right text-xs text-gray-500">{fmt(parseFloat(inv.poAmount) || 0)}</td>
              <td className="px-4 py-3.5 text-right text-xs text-gray-500">{fmt(parseFloat(inv.grnAmount) || 0)}</td>
              <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${match.bg} ${match.color}`}>{match.label === "3-Way Match" ? <CheckCircle className="w-3 h-3" /> : match.label === "Mismatch" ? <AlertTriangle className="w-3 h-3" /> : null}{match.label}</span></td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={inv.paymentStatus} /></td>
              <td className="px-4 py-3.5"><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {inv.paymentStatus === "Unpaid" && match.label === "3-Way Match" && <button onClick={async () => { await authFetch(`/api/flex/purchase-invoices/${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: "Approved", matchStatus: "Matched" }) }); onRefresh(); }} className="px-3 py-1.5 text-[10px] font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50">Approve Payment</button>}
                {inv.paymentStatus === "Approved" && <button onClick={async () => { await authFetch(`/api/flex/purchase-invoices/${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: "Paid" }) }); onRefresh(); }} className="px-3 py-1.5 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">Mark Paid</button>}
              </div></td>
            </tr>
          ); })}
        </DataTable>
      )}
      {showModal && <LogInvoiceModal pos={pos} grns={grns} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogInvoiceModal({ pos, grns, onClose, onSaved }: { pos: PO[]; grns: GRN[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ invoiceNumber: "", vendorName: "", poId: "", grnId: "", invoiceDate: new Date().toISOString().split("T")[0], invoiceAmount: "", notes: "" });

  const selectedPO = pos.find(p => p.id === parseInt(form.poId));
  const poAmount = selectedPO ? parseFloat(selectedPO.grandTotal) || 0 : 0;
  const matchedGrns = grns.filter(g => g.poId === parseInt(form.poId));
  const [grnAmount, setGrnAmount] = useState(0);

  const handleSelectPO = (poId: string) => {
    const po = pos.find(p => p.id === parseInt(poId));
    setForm({ ...form, poId, vendorName: po?.vendorName || form.vendorName, grnId: "" });
    setGrnAmount(0);
  };

  const handleSelectGRN = async (grnId: string) => {
    setForm({ ...form, grnId });
    if (grnId) {
      const res = await authFetch(`/api/flex/goods-receipts/${grnId}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const amt = items.reduce((sum: number, it: any) => sum + (it.acceptedQty || it.receivedQty || 0) * (parseFloat(selectedPO?.grandTotal || "0") / Math.max(1, (selectedPO as any)?.items?.reduce((s: number, i: any) => s + (i.qty || 0), 0) || 1)), 0);
        setGrnAmount(amt || poAmount);
      }
    } else { setGrnAmount(0); }
  };

  const effectiveGrnAmt = grnAmount || (form.grnId ? poAmount : 0);

  const handleSave = async () => {
    if (!form.invoiceNumber.trim() || !form.vendorName.trim() || !form.invoiceAmount) return; setSaving(true);
    const invAmt = parseFloat(form.invoiceAmount) || 0;
    const poMatch = poAmount > 0 && Math.abs(invAmt - poAmount) < 1;
    const grnMatch = effectiveGrnAmt > 0 && Math.abs(invAmt - effectiveGrnAmt) < 1;
    const matchStatus = poMatch && grnMatch ? "Matched" : (poMatch || grnMatch) ? "Partial" : (poAmount > 0 ? "Mismatch" : "Pending");
    try { const res = await authFetch("/api/flex/purchase-invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, poId: form.poId ? parseInt(form.poId) : null, grnId: form.grnId ? parseInt(form.grnId) : null, invoiceDate: form.invoiceDate || undefined, poAmount: poAmount.toString(), grnAmount: effectiveGrnAmt.toString(), matchStatus }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="Log Purchase Invoice" icon={Receipt} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Number</label><input type="text" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Date</label><input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to PO</label><select value={form.poId} onChange={e => handleSelectPO(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select PO...</option>{pos.map(p => <option key={p.id} value={p.id}>{p.poNumber} — {p.vendorName} ({fmt(parseFloat(p.grandTotal) || 0)})</option>)}</select></div>
        {matchedGrns.length > 0 && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to GRN</label><select value={form.grnId} onChange={e => handleSelectGRN(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select GRN...</option>{matchedGrns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({g.status})</option>)}</select></div>}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label><input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Amount (₹)</label><input type="number" value={form.invoiceAmount} onChange={e => setForm({ ...form, invoiceAmount: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        {form.poId && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 uppercase font-semibold mb-1">3-Way Match Preview</p><div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-[10px] text-gray-400">PO Amount</p><p className="text-sm font-bold text-gray-700">{fmt(poAmount)}</p></div><div><p className="text-[10px] text-gray-400">GRN Amount</p><p className="text-sm font-bold text-gray-700">{fmt(effectiveGrnAmt)}</p></div><div><p className="text-[10px] text-gray-400">Invoice Amount</p><p className="text-sm font-bold text-gray-700">{form.invoiceAmount ? fmt(parseFloat(form.invoiceAmount)) : "—"}</p></div></div></div>}
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.invoiceNumber.trim() || !form.vendorName.trim() || !form.invoiceAmount} label="Log Invoice" />
    </Modal>
  );
}

function PurchaseReturnsView({ prets, pos, grns, onRefresh }: { prets: PRet[]; pos: PO[]; grns: GRN[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Purchase Returns (Debit Notes)</h1><p className="text-sm text-gray-400 mt-0.5">Log items returned to vendors</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Log Return</button></div>
      {prets.length === 0 ? <EmptyState icon={RotateCcw} text="No purchase returns" /> : (
        <DataTable headers={["Return #", "Vendor", "Item", "Returned Qty", "Reason", "PO/GRN Ref", "Date", "Status"]}>
          {prets.map(pr => (
            <tr key={pr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{pr.returnNumber}</td>
              <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{pr.vendorName}</td>
              <td className="px-4 py-3.5 text-sm text-gray-700">{pr.itemName}</td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">{pr.returnedQty}</td>
              <td className="px-4 py-3.5"><span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${pr.reason === "Damage" ? "bg-red-50 text-red-500 border-red-200" : pr.reason === "Wrong Item" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{pr.reason}</span></td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{pr.poId ? `PO #${pr.poId}` : ""} {pr.grnId ? `GRN #${pr.grnId}` : ""}</td>
              <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(pr.returnDate)}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={pr.status} /></td>
            </tr>
          ))}
        </DataTable>
      )}
      {showModal && <LogReturnModal pos={pos} grns={grns} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function LogReturnModal({ pos, grns, onClose, onSaved }: { pos: PO[]; grns: GRN[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ returnNumber: `RET-${Date.now().toString().slice(-6)}`, vendorName: "", poId: "", grnId: "", itemName: "", returnedQty: "", reason: "Damage", notes: "", returnDate: new Date().toISOString().split("T")[0] });
  const handleSelectPO = (poId: string) => { const po = pos.find(p => p.id === parseInt(poId)); setForm({ ...form, poId, vendorName: po?.vendorName || form.vendorName }); };
  const handleSave = async () => {
    if (!form.vendorName.trim() || !form.itemName.trim() || !form.returnedQty) return; setSaving(true);
    try { const res = await authFetch("/api/flex/purchase-returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, returnedQty: parseInt(form.returnedQty), poId: form.poId ? parseInt(form.poId) : null, grnId: form.grnId ? parseInt(form.grnId) : null, returnDate: form.returnDate || undefined }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  const matchedGrns = grns.filter(g => g.poId === parseInt(form.poId));
  return (
    <Modal title="Log Purchase Return" icon={RotateCcw} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Return Number</label><input type="text" value={form.returnNumber} onChange={e => setForm({ ...form, returnNumber: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Return Date</label><input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to PO</label><select value={form.poId} onChange={e => handleSelectPO(e.target.value)} className={inputCls + " cursor-pointer"}><option value="">Select PO (optional)...</option>{pos.map(p => <option key={p.id} value={p.id}>{p.poNumber} — {p.vendorName}</option>)}</select></div>
        {matchedGrns.length > 0 && <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Link to GRN</label><select value={form.grnId} onChange={e => setForm({ ...form, grnId: e.target.value })} className={inputCls + " cursor-pointer"}><option value="">Select GRN...</option>{matchedGrns.map(g => <option key={g.id} value={g.id}>{g.grnNumber}</option>)}</select></div>}
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label><input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label><input type="text" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} placeholder="Returned item" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Returned Qty</label><input type="number" value={form.returnedQty} onChange={e => setForm({ ...form, returnedQty: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reason</label><select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Damage">Damage</option><option value="Wrong Item">Wrong Item</option><option value="Quality Issue">Quality Issue</option><option value="Excess Quantity">Excess Quantity</option></select></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.vendorName.trim() || !form.itemName.trim() || !form.returnedQty} label="Log Return" />
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center"><Icon className="w-4 h-4 text-[#E31E24]" /></div><h2 className="text-lg font-bold text-gray-900">{title}</h2></div><button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled, label }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean; label: string }) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
      <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /> {label}</button>
    </div>
  );
}
