import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, X, Search, Trash2, Download, BookOpen, BarChart3, CreditCard,
  Receipt, FileText, LayoutDashboard, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, ChevronDown, ChevronRight, Eye, Edit2, CheckCircle,
  Clock, ArrowUpCircle, ArrowDownCircle, Filter, Wallet,
} from "lucide-react";
import { useLedger } from "../hooks/useLedger";
import { useLedgerSub } from "../hooks/useLedgerSub";
import { fmtCur, fmtDate, inputCls } from "../utils/ledgerUtils";
import type { APRecord, ARRecord, CoaRecord, DashSummary, JournalEntry, JournalLine } from "../types";

function StatusBadge({ status, variant }: { status: string; variant?: "ap" | "ar" }) {
  const colors: Record<string, string> = { Pending: "bg-amber-50 text-amber-600 border-amber-200", Partial: "bg-blue-50 text-blue-600 border-blue-200", Paid: "bg-green-50 text-green-600 border-green-200", Received: "bg-green-50 text-green-600 border-green-200", Overdue: "bg-red-50 text-red-600 border-red-200", Draft: "bg-gray-50 text-gray-500 border-gray-200", Posted: "bg-green-50 text-green-600 border-green-200" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colors[status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{status}</span>;
}

export default function LedgerDashboard() {
  const sub = useLedgerSub();
  const { coa, journals, ap, ar, summary, loading, fetchAll } = useLedger();

  if (loading) return <div className="text-center py-16 text-gray-400">Loading financial data...</div>;

  switch (sub) {
    case "Finance Dashboard": return <FinanceDashboardView summary={summary} ap={ap} ar={ar} />;
    case "Chart of Accounts": return <ChartOfAccountsView coa={coa} onRefresh={fetchAll} />;
    case "Accounts Payable (AP)": return <AccountsPayableView ap={ap} onRefresh={fetchAll} />;
    case "Accounts Receivable (AR)": return <AccountsReceivableView ar={ar} onRefresh={fetchAll} />;
    case "Journal Entries": return <JournalEntriesView journals={journals} coa={coa} onRefresh={fetchAll} />;
    case "Financial Statements": return <FinancialStatementsView coa={coa} journals={journals} />;
    default: return <FinanceDashboardView summary={summary} ap={ap} ar={ar} />;
  }
}

function FinanceDashboardView({ summary, ap, ar }: { summary: DashSummary | null; ap: APRecord[]; ar: ARRecord[] }) {
  const metrics = [
    { label: "Total Cash", value: fmtCur(summary?.totalCash ?? 0), icon: Wallet, color: "blue" },
    { label: "Total Receivables", value: fmtCur(summary?.totalReceivables ?? 0), icon: ArrowDownCircle, color: "green" },
    { label: "Total Payables", value: fmtCur(summary?.totalPayables ?? 0), icon: ArrowUpCircle, color: "red" },
    { label: "Net Income", value: fmtCur(summary?.netIncome ?? 0), icon: TrendingUp, color: (summary?.netIncome ?? 0) >= 0 ? "green" : "red" },
  ];
  const agingCategories = ["30 Days", "60 Days", "90+ Days"];
  const arValues = [summary?.arAging.days30 ?? 0, summary?.arAging.days60 ?? 0, summary?.arAging.days90 ?? 0];
  const apValues = [summary?.apAging.days30 ?? 0, summary?.apAging.days60 ?? 0, summary?.apAging.days90 ?? 0];
  const maxAging = Math.max(...arValues, ...apValues, 1);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1><p className="text-sm text-gray-400 mt-0.5">Executive financial overview — double-entry accounting</p></div>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} color={m.color} isText />)}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#E31E24]" /> AR/AP Aging Analysis</h3>
          <div className="space-y-4">
            {agingCategories.map((cat, i) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-500 mb-2">{cat}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3"><span className="text-[10px] text-gray-400 w-[20px]">AR</span><div className="flex-1 bg-gray-100 rounded-full h-3"><div className="bg-green-500 rounded-full h-3 transition-all" style={{ width: `${(arValues[i] / maxAging) * 100}%` }} /></div><span className="text-xs font-semibold text-gray-600 w-[80px] text-right">{fmtCur(arValues[i])}</span></div>
                  <div className="flex items-center gap-3"><span className="text-[10px] text-gray-400 w-[20px]">AP</span><div className="flex-1 bg-gray-100 rounded-full h-3"><div className="bg-red-400 rounded-full h-3 transition-all" style={{ width: `${(apValues[i] / maxAging) * 100}%` }} /></div><span className="text-xs font-semibold text-gray-600 w-[80px] text-right">{fmtCur(apValues[i])}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-green-500" /> Recent Receivables</h3>
            {ar.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-medium text-gray-800">{r.clientName}</p><p className="text-[10px] text-gray-400">{r.invoiceNumber} · Due {fmtDate(r.dueDate)}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-gray-800">{fmtCur(r.amount)}</p><StatusBadge status={r.status} /></div>
              </div>
            ))}
            {ar.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No receivables</p>}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-red-500" /> Recent Payables</h3>
            {ap.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-medium text-gray-800">{p.vendorName}</p><p className="text-[10px] text-gray-400">{p.billNumber} · Due {fmtDate(p.dueDate)}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-gray-800">{fmtCur(p.amount)}</p><StatusBadge status={p.status} /></div>
              </div>
            ))}
            {ap.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No payables</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartOfAccountsView({ coa, onRefresh }: { coa: CoaRecord[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Asset: true, Liability: true, Equity: true, Revenue: true, Expense: true });

  const types = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
  const grouped = useMemo(() => {
    const g: Record<string, CoaRecord[]> = {};
    types.forEach(t => { g[t] = coa.filter(a => a.accountType === t); });
    return g;
  }, [coa]);

  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    Asset: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    Liability: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    Equity: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    Revenue: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    Expense: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1><p className="text-sm text-gray-400 mt-0.5">Hierarchical account structure grouped by type</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Account</button></div>
      <div className="space-y-3">
        {types.map(type => {
          const accounts = grouped[type] || [];
          const tc = typeColors[type];
          const isExpanded = expanded[type];
          const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance), 0);
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(prev => ({ ...prev, [type]: !prev[type] }))} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${tc.bg} ${tc.text} ${tc.border}`}>{type}</span>
                  <span className="text-sm font-bold text-gray-800">{type} Accounts</span>
                  <span className="text-xs text-gray-400">{accounts.length} accounts</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{fmtCur(totalBalance)}</span>
              </button>
              {isExpanded && accounts.length > 0 && (
                <div className="border-t border-gray-100">
                  <table className="w-full text-sm"><tbody>
                    {accounts.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 group">
                        <td className="px-5 py-3 w-[100px]"><span className="text-xs font-mono font-semibold text-gray-500">{a.accountCode}</span></td>
                        <td className="px-4 py-3"><p className="font-medium text-gray-800">{a.accountName}</p>{a.description && <p className="text-[10px] text-gray-400 mt-0.5">{a.description}</p>}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800 w-[150px]">{fmtCur(a.currentBalance)}</td>
                        <td className="px-4 py-3 w-[50px]"><button onClick={async () => { if (confirm("Delete account?")) { await authFetch(`/api/ledger/coa/${a.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
              {isExpanded && accounts.length === 0 && <p className="px-5 py-4 text-sm text-gray-400 border-t border-gray-100">No {type.toLowerCase()} accounts</p>}
            </div>
          );
        })}
      </div>
      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AddAccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ accountCode: "", accountName: "", accountType: "Asset", currentBalance: "0", description: "" });
  const handleSave = async () => {
    if (!form.accountCode.trim() || !form.accountName.trim()) return; setSaving(true);
    try { const res = await authFetch("/api/ledger/coa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Add Account" icon={BookOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Account Code</label><input type="text" value={form.accountCode} onChange={e => setForm({ ...form, accountCode: e.target.value })} placeholder="e.g. 1010" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Account Type</label><select value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Asset">Asset</option><option value="Liability">Liability</option><option value="Equity">Equity</option><option value="Revenue">Revenue</option><option value="Expense">Expense</option></select></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Account Name</label><input type="text" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="e.g. Cash in Hand" className={inputCls} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Opening Balance (₹)</label><input type="number" value={form.currentBalance} onChange={e => setForm({ ...form, currentBalance: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.accountCode.trim() || !form.accountName.trim()} label="Add Account" />
    </Modal>
  );
}

function AccountsPayableView({ ap, onRefresh }: { ap: APRecord[]; onRefresh: () => void }) {
  const [tab, setTab] = useState<"Bill" | "Debit Note">("Bill");
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<APRecord | null>(null);
  const filtered = ap.filter(r => r.entryType === tab);
  const totalPending = filtered.reduce((s, r) => s + parseFloat(r.amount) - parseFloat(r.paidAmount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Accounts Payable (AP)</h1><p className="text-sm text-gray-400 mt-0.5">Vendor bills and purchase returns</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Entry</button></div>
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["Bill", "Debit Note"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t === "Bill" ? "Pending Bills" : "Debit Notes"}</button>)}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4"><p className="text-xs text-gray-400">Outstanding Balance</p><p className="text-2xl font-bold text-red-500">{fmtCur(totalPending)}</p></div>
      {filtered.length === 0 ? <EmptyState icon={CreditCard} text={`No ${tab.toLowerCase()}s found`} /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Bill #</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Bill Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Paid</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 w-[80px]"></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => {
                const balance = parseFloat(r.amount) - parseFloat(r.paidAmount);
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.vendorName}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.billNumber || "—"}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(r.billDate)}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(r.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtCur(r.amount)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmtCur(r.paidAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-500">{fmtCur(balance)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} variant="ap" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status !== "Paid" && <button onClick={() => setPayModal(r)} className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50" title="Record Payment"><DollarSign className="w-3.5 h-3.5" /></button>}
                        <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/ledger/ap/${r.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <AddAPModal entryType={tab} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
      {payModal && <RecordPaymentModal record={payModal} endpoint="ap" amountField="paidAmount" onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); onRefresh(); }} />}
    </div>
  );
}

function AddAPModal({ entryType, onClose, onSaved }: { entryType: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vendorName: "", billNumber: "", billDate: new Date().toISOString().split("T")[0], dueDate: "", amount: "", paidAmount: "0", status: "Pending", entryType, notes: "" });
  const handleSave = async () => {
    if (!form.vendorName.trim() || !form.dueDate || !form.amount) return; setSaving(true);
    try { const res = await authFetch("/api/ledger/ap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title={entryType === "Bill" ? "Add Vendor Bill" : "Add Debit Note"} icon={CreditCard} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Vendor Name</label><input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} placeholder="e.g. Steel Corp India" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Bill Number</label><input type="text" value={form.billNumber} onChange={e => setForm({ ...form, billNumber: e.target.value })} placeholder="e.g. BILL-001" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Bill Date</label><input type="date" value={form.billDate} onChange={e => setForm({ ...form, billDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.vendorName.trim() || !form.dueDate || !form.amount} label="Add Entry" />
    </Modal>
  );
}

function AccountsReceivableView({ ar, onRefresh }: { ar: ARRecord[]; onRefresh: () => void }) {
  const [tab, setTab] = useState<"Invoice" | "Credit Note">("Invoice");
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<ARRecord | null>(null);
  const filtered = ar.filter(r => r.entryType === tab);
  const totalPending = filtered.reduce((s, r) => s + parseFloat(r.amount) - parseFloat(r.receivedAmount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Accounts Receivable (AR)</h1><p className="text-sm text-gray-400 mt-0.5">Client invoices and sales returns</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Add Entry</button></div>
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["Invoice", "Credit Note"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t === "Invoice" ? "Pending Invoices" : "Credit Notes"}</button>)}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4"><p className="text-xs text-gray-400">Outstanding Receivable</p><p className="text-2xl font-bold text-green-600">{fmtCur(totalPending)}</p></div>
      {filtered.length === 0 ? <EmptyState icon={Receipt} text={`No ${tab.toLowerCase()}s found`} /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Invoice #</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Invoice Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Received</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 w-[80px]"></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => {
                const balance = parseFloat(r.amount) - parseFloat(r.receivedAmount);
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3 font-medium text-gray-800">{r.clientName}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.invoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(r.invoiceDate)}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(r.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtCur(r.amount)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmtCur(r.receivedAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">{fmtCur(balance)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} variant="ar" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status !== "Received" && <button onClick={() => setPayModal(r)} className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50" title="Receive Payment"><DollarSign className="w-3.5 h-3.5" /></button>}
                        <button onClick={async () => { if (confirm("Delete?")) { await authFetch(`/api/ledger/ar/${r.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <AddARModal entryType={tab} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
      {payModal && <RecordPaymentModal record={payModal} endpoint="ar" amountField="receivedAmount" onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); onRefresh(); }} />}
    </div>
  );
}

function AddARModal({ entryType, onClose, onSaved }: { entryType: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientName: "", invoiceNumber: "", invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", amount: "", receivedAmount: "0", status: "Pending", entryType, notes: "" });
  const handleSave = async () => {
    if (!form.clientName.trim() || !form.dueDate || !form.amount) return; setSaving(true);
    try { const res = await authFetch("/api/ledger/ar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title={entryType === "Invoice" ? "Add Client Invoice" : "Add Credit Note"} icon={Receipt} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label><input type="text" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="e.g. Mahindra Industries" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Number</label><input type="text" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="e.g. INV-001" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Date</label><input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + " resize-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.clientName.trim() || !form.dueDate || !form.amount} label="Add Entry" />
    </Modal>
  );
}

function RecordPaymentModal({ record, endpoint, amountField, onClose, onSaved }: { record: any; endpoint: string; amountField: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const currentPaid = parseFloat(record[amountField] || "0");
  const totalAmount = parseFloat(record.amount || "0");
  const balance = totalAmount - currentPaid;
  const [payAmount, setPayAmount] = useState(balance.toFixed(2));
  const handleSave = async () => {
    const pAmt = parseFloat(payAmount);
    if (isNaN(pAmt) || pAmt <= 0) return; setSaving(true);
    const newPaid = currentPaid + pAmt;
    const newStatus = newPaid >= totalAmount ? (endpoint === "ap" ? "Paid" : "Received") : "Partial";
    try { const res = await authFetch(`/api/ledger/${endpoint}/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [amountField]: newPaid.toFixed(2), status: newStatus }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title={endpoint === "ap" ? "Record Payment" : "Receive Payment"} icon={DollarSign} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
          <div><p className="text-[10px] text-gray-400 uppercase">Total Amount</p><p className="text-lg font-bold text-gray-800 mt-0.5">{fmtCur(totalAmount)}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase">Already Paid</p><p className="text-lg font-bold text-green-600 mt-0.5">{fmtCur(currentPaid)}</p></div>
          <div><p className="text-[10px] text-gray-400 uppercase">Balance</p><p className="text-lg font-bold text-red-500 mt-0.5">{fmtCur(balance)}</p></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Amount (₹)</label><input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputCls + " text-lg font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!payAmount || parseFloat(payAmount) <= 0} label={endpoint === "ap" ? "Record Payment" : "Receive Payment"} />
    </Modal>
  );
}

function JournalEntriesView({ journals, coa, onRefresh }: { journals: JournalEntry[]; coa: CoaRecord[]; onRefresh: () => void }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [viewLines, setViewLines] = useState<{ entry: JournalEntry; lines: JournalLine[] } | null>(null);

  const handleViewLines = async (entry: JournalEntry) => {
    const res = await authFetch(`/api/ledger/journal-entries/${entry.id}/lines`);
    if (res.ok) setViewLines({ entry, lines: await res.json() });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1><p className="text-sm text-gray-400 mt-0.5">Double-entry ledger — debits must equal credits</p></div>
        <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> New Journal Entry</button></div>
      {journals.length === 0 ? <EmptyState icon={FileText} text="No journal entries" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Reference</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Total Debit</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Total Credit</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 w-[80px]"></th>
            </tr></thead>
            <tbody>
              {journals.map(j => (
                <tr key={j.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-3 text-xs font-mono text-gray-400">JE-{String(j.id).padStart(4, "0")}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(j.entryDate)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">{j.reference || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{j.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtCur(j.totalDebit)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtCur(j.totalCredit)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewLines(j)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (confirm("Delete journal entry and all lines?")) { await authFetch(`/api/ledger/journal-entries/${j.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showBuilder && <JournalEntryBuilder coa={coa} onClose={() => setShowBuilder(false)} onSaved={() => { setShowBuilder(false); onRefresh(); }} />}
      {viewLines && (
        <Modal title={`JE-${String(viewLines.entry.id).padStart(4, "0")} — ${viewLines.entry.description || "Journal Entry"}`} icon={FileText} onClose={() => setViewLines(null)} wide>
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center mb-4">
              <div><p className="text-[10px] text-gray-400">Date</p><p className="text-sm font-bold text-gray-700">{fmtDate(viewLines.entry.entryDate)}</p></div>
              <div><p className="text-[10px] text-gray-400">Reference</p><p className="text-sm font-bold text-gray-700">{viewLines.entry.reference || "—"}</p></div>
              <div><p className="text-[10px] text-gray-400">Status</p><StatusBadge status={viewLines.entry.status} /></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Account</th><th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Memo</th><th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Debit</th><th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Credit</th></tr></thead>
              <tbody>
                {viewLines.lines.map(l => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="px-4 py-2.5"><span className="font-mono text-xs text-gray-400 mr-2">{l.accountCode}</span><span className="text-sm text-gray-800">{l.accountName}</span></td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{l.memo || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{parseFloat(l.debit) > 0 ? fmtCur(l.debit) : ""}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{parseFloat(l.credit) > 0 ? fmtCur(l.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-gray-200 font-bold"><td colSpan={2} className="px-4 py-2.5 text-sm text-gray-800">Total</td><td className="px-4 py-2.5 text-right text-gray-800">{fmtCur(viewLines.entry.totalDebit)}</td><td className="px-4 py-2.5 text-right text-gray-800">{fmtCur(viewLines.entry.totalCredit)}</td></tr></tfoot>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}

function JournalEntryBuilder({ coa, onClose, onSaved }: { coa: CoaRecord[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ entryDate: new Date().toISOString().split("T")[0], reference: "", description: "", status: "Draft" });
  const [lines, setLines] = useState<{ accountId: string; accountCode: string; accountName: string; debit: string; credit: string; memo: string }[]>([
    { accountId: "", accountCode: "", accountName: "", debit: "", credit: "", memo: "" },
    { accountId: "", accountCode: "", accountName: "", debit: "", credit: "", memo: "" },
  ]);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => setLines([...lines, { accountId: "", accountCode: "", accountName: "", debit: "", credit: "", memo: "" }]);
  const removeLine = (i: number) => { if (lines.length > 2) setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[i] as any)[field] = value;
    if (field === "accountId") {
      const acct = coa.find(a => a.id === parseInt(value));
      if (acct) { updated[i].accountCode = acct.accountCode; updated[i].accountName = acct.accountName; }
    }
    setLines(updated);
  };

  const handleSave = async () => {
    if (!form.entryDate || !isBalanced) return; setSaving(true);
    try {
      const payload = { ...form, lines: lines.filter(l => l.accountId).map(l => ({ accountId: l.accountId, accountCode: l.accountCode, accountName: l.accountName, debit: l.debit || "0", credit: l.credit || "0", memo: l.memo })) };
      const res = await authFetch("/api/ledger/journal-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } catch {} finally { setSaving(false); }
  };

  return (
    <Modal title="New Journal Entry" icon={FileText} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label><input type="date" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Reference</label><input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="e.g. JV-001" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}><option value="Draft">Draft</option><option value="Posted">Posted</option></select></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Salary payment for March 2026" className={inputCls} /></div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Account</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-[120px]">Memo</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase w-[120px]">Debit (₹)</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase w-[120px]">Credit (₹)</th>
              <th className="w-[40px]"></th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-1.5"><select value={l.accountId} onChange={e => updateLine(i, "accountId", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24] bg-white cursor-pointer"><option value="">Select account...</option>{coa.map(a => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}</select></td>
                  <td className="px-3 py-1.5"><input type="text" value={l.memo} onChange={e => updateLine(i, "memo", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24]" /></td>
                  <td className="px-3 py-1.5"><input type="number" step="0.01" value={l.debit} onChange={e => updateLine(i, "debit", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24] text-right font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                  <td className="px-3 py-1.5"><input type="number" step="0.01" value={l.credit} onChange={e => updateLine(i, "credit", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#E31E24] text-right font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" /></td>
                  <td className="px-2 py-1.5">{lines.length > 2 && <button onClick={() => removeLine(i)} className="p-0.5 text-gray-300 hover:text-red-500"><X className="w-3 h-3" /></button>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td colSpan={2} className="px-3 py-2.5"><button onClick={addLine} className="text-xs text-[#E31E24] font-semibold hover:underline">+ Add Line</button></td>
                <td className="px-3 py-2.5 text-right font-bold text-gray-800">{fmtCur(totalDebit)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-gray-800">{fmtCur(totalCredit)}</td>
                <td></td>
              </tr>
              <tr className="bg-gray-50/50">
                <td colSpan={5} className="px-3 py-2 text-center">
                  {isBalanced ? (
                    <span className="text-xs font-semibold text-green-600 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Balanced — Debits equal Credits</span>
                  ) : (
                    <span className="text-xs font-semibold text-red-500 flex items-center justify-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Unbalanced — Difference: {fmtCur(Math.abs(totalDebit - totalCredit))}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.entryDate || !isBalanced} label="Save Journal Entry" />
    </Modal>
  );
}

interface StmtAccount extends CoaRecord { periodBalance: number; periodDebit: number; periodCredit: number; }

function FinancialStatementsView({ coa: initialCoa, journals }: { coa: CoaRecord[]; journals: JournalEntry[] }) {
  const [activeTab, setActiveTab] = useState<"P&L" | "Balance Sheet" | "Trial Balance">("P&L");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stmtAccounts, setStmtAccounts] = useState<StmtAccount[]>([]);
  const [stmtLoading, setStmtLoading] = useState(false);

  const fetchStatements = useCallback(async () => {
    setStmtLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await authFetch(`/api/ledger/financial-statements?${params.toString()}`);
      if (res.ok) setStmtAccounts(await res.json());
    } catch {} finally { setStmtLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchStatements(); }, [fetchStatements]);

  const types = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
  const grouped = useMemo(() => {
    const g: Record<string, { accounts: StmtAccount[]; total: number }> = {};
    types.forEach(t => {
      const accts = stmtAccounts.filter(a => a.accountType === t);
      const total = accts.reduce((s, a) => s + a.periodBalance, 0);
      g[t] = { accounts: accts, total };
    });
    return g;
  }, [stmtAccounts]);

  const totalRevenue = grouped.Revenue?.total ?? 0;
  const totalExpense = grouped.Expense?.total ?? 0;
  const netIncome = totalRevenue - totalExpense;
  const totalAssets = grouped.Asset?.total ?? 0;
  const totalLiabilities = grouped.Liability?.total ?? 0;
  const totalEquity = (grouped.Equity?.total ?? 0) + netIncome;

  const handleExport = (format: "pdf" | "xls") => {
    const reportName = activeTab === "P&L" ? "Profit_Loss" : activeTab === "Balance Sheet" ? "Balance_Sheet" : "Trial_Balance";
    let csvContent = `${reportName} Report\nGenerated: ${new Date().toLocaleDateString("en-IN")}\n`;
    if (dateFrom || dateTo) csvContent += `Period: ${dateFrom || "Start"} to ${dateTo || "Present"}\n`;
    csvContent += "\n";
    if (activeTab === "P&L") {
      csvContent += "Type,Account Code,Account Name,Balance\n";
      ["Revenue", "Expense"].forEach(type => {
        grouped[type]?.accounts.forEach(a => { csvContent += `${type},${a.accountCode},${a.accountName},${a.periodBalance.toFixed(2)}\n`; });
      });
      csvContent += `\nNet Income,,,"${netIncome.toFixed(2)}"\n`;
    } else if (activeTab === "Balance Sheet") {
      csvContent += "Type,Account Code,Account Name,Balance\n";
      ["Asset", "Liability", "Equity"].forEach(type => {
        grouped[type]?.accounts.forEach(a => { csvContent += `${type},${a.accountCode},${a.accountName},${a.periodBalance.toFixed(2)}\n`; });
      });
    } else {
      csvContent += "Account Code,Account Name,Debit,Credit\n";
      stmtAccounts.forEach(a => {
        csvContent += `${a.accountCode},${a.accountName},${a.periodDebit.toFixed(2)},${a.periodCredit.toFixed(2)}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: format === "xls" ? "application/vnd.ms-excel" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${reportName}.${format === "xls" ? "xls" : "csv"}`; a.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (title: string, type: string, color: string) => {
    const data = grouped[type];
    if (!data) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className={`text-sm font-bold ${color}`}>{title}</span>
          <span className="text-sm font-bold text-gray-800">{fmtCur(data.total)}</span>
        </div>
        {data.accounts.map(a => (
          <div key={a.id} className="flex items-center justify-between px-5 py-2 border-b border-gray-50 hover:bg-gray-50/50">
            <div className="flex items-center gap-3"><span className="text-xs font-mono text-gray-400 w-[60px]">{a.accountCode}</span><span className="text-sm text-gray-700">{a.accountName}</span></div>
            <span className="text-sm font-semibold text-gray-800">{fmtCur(a.periodBalance)}</span>
          </div>
        ))}
        {data.accounts.length === 0 && <p className="px-5 py-3 text-sm text-gray-400">No accounts</p>}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Financial Statements</h1><p className="text-sm text-gray-400 mt-0.5">Standard financial reports — P&L, Balance Sheet, Trial Balance</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport("pdf")} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> Download PDF</button>
          <button onClick={() => handleExport("xls")} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/15"><Download className="w-3.5 h-3.5" /> Export Tally-Formatted XLS</button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(["P&L", "Balance Sheet", "Trial Balance"] as const).map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t === "P&L" ? "Profit & Loss" : t}</button>)}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#E31E24]" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#E31E24]" />
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 text-center">
            {activeTab === "P&L" ? "Profit & Loss Statement" : activeTab === "Balance Sheet" ? "Balance Sheet" : "Trial Balance"}
          </h2>
          <p className="text-xs text-gray-400 text-center mt-0.5">{dateFrom && dateTo ? `${fmtDate(dateFrom)} — ${fmtDate(dateTo)}` : `As of ${fmtDate(new Date().toISOString())}`}</p>
        </div>
        {activeTab === "P&L" && (
          <div>
            {renderSection("Revenue", "Revenue", "text-green-600")}
            {renderSection("Expenses", "Expense", "text-red-500")}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-t-2 border-gray-300">
              <span className="text-sm font-bold text-gray-900">Net Income</span>
              <span className={`text-lg font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtCur(netIncome)}</span>
            </div>
          </div>
        )}
        {activeTab === "Balance Sheet" && (
          <div>
            {renderSection("Assets", "Asset", "text-blue-600")}
            {renderSection("Liabilities", "Liability", "text-red-500")}
            {renderSection("Equity", "Equity", "text-purple-600")}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-t-2 border-gray-300">
              <div><span className="text-sm font-bold text-gray-900">Total Assets: </span><span className="text-sm font-bold text-blue-600">{fmtCur(totalAssets)}</span></div>
              <div><span className="text-sm font-bold text-gray-900">Liabilities + Equity: </span><span className="text-sm font-bold text-purple-600">{fmtCur(totalLiabilities + totalEquity)}</span></div>
            </div>
          </div>
        )}
        {activeTab === "Trial Balance" && (
          <div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Account Code</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Account Name</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Credit</th>
              </tr></thead>
              <tbody>
                {stmtAccounts.map(a => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-2.5 text-xs font-mono text-gray-500">{a.accountCode}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-800">{a.accountName}</td>
                      <td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">{a.accountType}</span></td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{a.periodDebit > 0 ? fmtCur(a.periodDebit) : (a.periodBalance >= 0 ? fmtCur(a.periodBalance) : "")}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{a.periodCredit > 0 ? fmtCur(a.periodCredit) : (a.periodBalance < 0 ? fmtCur(Math.abs(a.periodBalance)) : "")}</td>
                    </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-100">
                  <td colSpan={3} className="px-5 py-2.5 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{fmtCur(stmtAccounts.reduce((s, a) => s + a.periodDebit, 0) || stmtAccounts.filter(a => a.periodBalance >= 0).reduce((s, a) => s + a.periodBalance, 0))}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{fmtCur(stmtAccounts.reduce((s, a) => s + a.periodCredit, 0) || stmtAccounts.filter(a => a.periodBalance < 0).reduce((s, a) => s + Math.abs(a.periodBalance), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, isText }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string; isText?: boolean }) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = { blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" }, green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" }, red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-500" }, purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" } };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>
        <div><p className="text-xs text-gray-400">{label}</p><p className={`text-2xl font-bold ${c.text}`}>{isText ? value : value}</p></div></div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">{text}</p></div>;
}

function Modal({ title, icon: Icon, onClose, children, wide }: { title: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? "w-[780px]" : "w-[520px]"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
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
