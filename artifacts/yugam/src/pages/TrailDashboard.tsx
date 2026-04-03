import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, X, Search, Trash2, Download, LayoutDashboard, FileText,
  ClipboardList, Wallet, DollarSign, Clock, CheckCircle, XCircle,
  TrendingUp, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
  CreditCard, Car, Utensils, Briefcase, MapPin, Calendar,
} from "lucide-react";

type TrailSub = "Expense Dashboard" | "My Claims" | "Approval Queue" | "Petty Cash Ledger";

interface ClaimRecord { id: number; claimId: string; employeeName: string; date: string; category: string; claimType: string; amount: string; status: string; description: string; distance: string | null; ratePerKm: string | null; numDays: string | null; dailyRate: string | null; ledgerJournalId: string | null; createdAt: string | null; }
interface PettyCashRecord { id: number; date: string; description: string; cashIn: string; cashOut: string; runningBalance: string; createdAt: string | null; }
interface DashSummary { totalClaimsThisMonth: number; pendingApprovals: number; totalPettyCashDisbursed: number; categoryBreakdown: { Travel: number; Fuel: number; Meals: number; Misc: number }; }

const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtCur(val: string | number) { const n = typeof val === "string" ? parseFloat(val) : val; if (isNaN(n)) return "₹ 0"; if (Math.abs(n) >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`; if (Math.abs(n) >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`; if (Math.abs(n) >= 1000) return `₹ ${(n / 1000).toFixed(1)} K`; return `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { Pending: "bg-amber-50 text-amber-600 border-amber-200", Approved: "bg-blue-50 text-blue-600 border-blue-200", Rejected: "bg-red-50 text-red-500 border-red-200", Paid: "bg-green-50 text-green-600 border-green-200" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colors[status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{status}</span>;
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    Travel: { icon: MapPin, color: "text-indigo-500 bg-indigo-50" },
    Fuel: { icon: Car, color: "text-orange-500 bg-orange-50" },
    Meals: { icon: Utensils, color: "text-amber-500 bg-amber-50" },
    Misc: { icon: Briefcase, color: "text-gray-500 bg-gray-100" },
  };
  const cfg = icons[category] || icons.Misc;
  const Icon = cfg.icon;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}><Icon className="w-3 h-3" />{category}</span>;
}

export default function TrailDashboard() {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Trail:", "") || "Expense Dashboard") as TrailSub;
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashRecord[]>([]);
  const [summary, setSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [cR, pR, sR] = await Promise.all([
        authFetch("/api/trail/claims"), authFetch("/api/trail/petty-cash"),
        authFetch("/api/trail/dashboard-summary"),
      ]);
      if (cR.ok) setClaims(await cR.json());
      if (pR.ok) setPettyCash(await pR.json());
      if (sR.ok) setSummary(await sR.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading expense data...</div>;

  switch (sub) {
    case "Expense Dashboard": return <ExpenseDashboardView summary={summary} claims={claims} />;
    case "My Claims": return <MyClaimsView claims={claims} onRefresh={fetchAll} />;
    case "Approval Queue": return <ApprovalQueueView claims={claims} onRefresh={fetchAll} />;
    case "Petty Cash Ledger": return <PettyCashLedgerView pettyCash={pettyCash} onRefresh={fetchAll} />;
    default: return <ExpenseDashboardView summary={summary} claims={claims} />;
  }
}

function ExpenseDashboardView({ summary, claims }: { summary: DashSummary | null; claims: ClaimRecord[] }) {
  const metrics = [
    { label: "Total Claims This Month", value: fmtCur(summary?.totalClaimsThisMonth ?? 0), icon: CreditCard, color: "blue" },
    { label: "Pending Approvals", value: String(summary?.pendingApprovals ?? 0), icon: Clock, color: "amber" },
    { label: "Total Petty Cash Disbursed", value: fmtCur(summary?.totalPettyCashDisbursed ?? 0), icon: Wallet, color: "purple" },
  ];

  const categories = ["Travel", "Fuel", "Meals", "Misc"];
  const breakdown = summary?.categoryBreakdown ?? { Travel: 0, Fuel: 0, Meals: 0, Misc: 0 };
  const totalCat = Object.values(breakdown).reduce((s, v) => s + v, 0) || 1;
  const catColors: Record<string, string> = { Travel: "#6366f1", Fuel: "#f97316", Meals: "#f59e0b", Misc: "#6b7280" };

  const recentClaims = claims.slice(0, 8);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Expense Dashboard</h1><p className="text-sm text-gray-400 mt-0.5">Track employee reimbursements and expense categories</p></div>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          const bgColors: Record<string, string> = { blue: "bg-blue-50", amber: "bg-amber-50", purple: "bg-purple-50" };
          const iconColors: Record<string, string> = { blue: "text-blue-500", amber: "text-amber-500", purple: "text-purple-500" };
          const textColors: Record<string, string> = { blue: "text-blue-600", amber: "text-amber-600", purple: "text-purple-600" };
          return (
            <div key={m.label} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${bgColors[m.color]} flex items-center justify-center`}><Icon className={`w-5 h-5 ${iconColors[m.color]}`} /></div>
                <div><p className="text-xs text-gray-400">{m.label}</p><p className={`text-2xl font-bold ${textColors[m.color]}`}>{m.value}</p></div></div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Expenses by Category</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulative = 0;
                  return categories.map(cat => {
                    const pct = (breakdown[cat as keyof typeof breakdown] / totalCat) * 100;
                    const offset = cumulative;
                    cumulative += pct;
                    return <circle key={cat} cx="18" cy="18" r="15.9" fill="none" stroke={catColors[cat]} strokeWidth="3.5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`-${offset}`} strokeLinecap="round" />;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold text-gray-700">{fmtCur(totalCat)}</span></div>
            </div>
            <div className="flex-1 space-y-3">
              {categories.map(cat => {
                const val = breakdown[cat as keyof typeof breakdown];
                const pct = totalCat > 0 ? ((val / totalCat) * 100).toFixed(1) : "0.0";
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColors[cat] }} /><span className="text-sm text-gray-700">{cat}</span></div>
                    <div className="text-right"><span className="text-sm font-bold text-gray-800">{fmtCur(val)}</span><span className="text-[10px] text-gray-400 ml-1.5">{pct}%</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Recent Claims</h3>
          {recentClaims.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No claims yet</p> : (
            <div className="space-y-0">
              {recentClaims.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-medium text-gray-800">{c.employeeName}</p><p className="text-[10px] text-gray-400">{c.claimId} · {fmtDate(c.date)} · {c.category}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-800">{fmtCur(c.amount)}</p><StatusBadge status={c.status} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MyClaimsView({ claims, onRefresh }: { claims: ClaimRecord[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = claims.filter(c => c.employeeName.toLowerCase().includes(search.toLowerCase()) || c.claimId.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">My Claims</h1><p className="text-sm text-gray-400 mt-0.5">Personal claim history and new submissions</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> New Claim</button></div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" /><input type="search" placeholder="Search claims by name, ID, or description..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" /></div>
      {filtered.length === 0 ? <EmptyState icon={FileText} text="No claims found" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Claim ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Ledger</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-3 text-xs font-mono font-semibold text-gray-500">{c.claimId}</td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-800">{c.employeeName}</p>{c.description && <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(c.date)}</td>
                  <td className="px-4 py-3 text-center"><CategoryIcon category={c.category} /></td>
                  <td className="px-4 py-3 text-center"><span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">{c.claimType}</span></td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{fmtCur(c.amount)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-center">{c.ledgerJournalId ? <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded">{c.ledgerJournalId}</span> : <span className="text-[10px] text-gray-300">—</span>}</td>
                  <td className="px-4 py-3"><button onClick={async () => { if (confirm("Delete claim?")) { await authFetch(`/api/trail/claims/${c.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <NewClaimModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function NewClaimModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [claimType, setClaimType] = useState<"Standard Receipt" | "Mileage/Fuel Claim" | "Per Diem">("Standard Receipt");
  const [form, setForm] = useState({ employeeName: "", date: new Date().toISOString().split("T")[0], category: "Travel", description: "", amount: "" });
  const [mileage, setMileage] = useState({ distance: "", ratePerKm: "12" });
  const [perDiem, setPerDiem] = useState({ numDays: "", dailyRate: "1500" });

  const computedAmount = useMemo(() => {
    if (claimType === "Mileage/Fuel Claim") {
      const d = parseFloat(mileage.distance) || 0;
      const r = parseFloat(mileage.ratePerKm) || 0;
      return (d * r).toFixed(2);
    }
    if (claimType === "Per Diem") {
      const days = parseFloat(perDiem.numDays) || 0;
      const rate = parseFloat(perDiem.dailyRate) || 0;
      return (days * rate).toFixed(2);
    }
    return form.amount;
  }, [claimType, mileage, perDiem, form.amount]);

  const handleSave = async () => {
    if (!form.employeeName.trim() || !form.date || !computedAmount || parseFloat(computedAmount) <= 0) return;
    setSaving(true);
    const payload: any = { ...form, claimType, amount: computedAmount, status: "Pending" };
    if (claimType === "Mileage/Fuel Claim") { payload.distance = mileage.distance; payload.ratePerKm = mileage.ratePerKm; payload.category = "Fuel"; }
    if (claimType === "Per Diem") { payload.numDays = perDiem.numDays; payload.dailyRate = perDiem.dailyRate; }
    try { const res = await authFetch("/api/trail/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };

  const claimTypes = ["Standard Receipt", "Mileage/Fuel Claim", "Per Diem"] as const;

  return (
    <Modal title="New Claim" icon={Plus} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {claimTypes.map(t => <button key={t} onClick={() => setClaimType(t)} className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${claimType === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name</label><input type="text" value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} placeholder="e.g. Aarav Mehta" className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls + " cursor-pointer"}>
              <option value="Travel">Travel</option><option value="Fuel">Fuel</option><option value="Meals">Meals</option><option value="Misc">Misc</option>
            </select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." className={inputCls} /></div>
        </div>

        {claimType === "Standard Receipt" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" className={inputCls + " text-lg font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        )}

        {claimType === "Mileage/Fuel Claim" && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-orange-600 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Mileage Calculation</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Distance Traveled (km)</label><input type="number" step="0.1" value={mileage.distance} onChange={e => setMileage({ ...mileage, distance: e.target.value })} placeholder="e.g. 120" className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
              <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Rate per km (₹)</label><input type="number" step="0.5" value={mileage.ratePerKm} onChange={e => setMileage({ ...mileage, ratePerKm: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-orange-200">
              <span className="text-xs text-gray-500">Auto-calculated Total:</span>
              <span className="text-xl font-bold text-orange-600">{fmtCur(computedAmount)}</span>
            </div>
          </div>
        )}

        {claimType === "Per Diem" && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Per Diem Calculation</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Number of Days</label><input type="number" step="1" value={perDiem.numDays} onChange={e => setPerDiem({ ...perDiem, numDays: e.target.value })} placeholder="e.g. 5" className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
              <div><label className="block text-[10px] font-medium text-gray-500 mb-1">Daily Rate (₹)</label><input type="number" step="100" value={perDiem.dailyRate} onChange={e => setPerDiem({ ...perDiem, dailyRate: e.target.value })} className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-indigo-200">
              <span className="text-xs text-gray-500">Auto-calculated Total:</span>
              <span className="text-xl font-bold text-indigo-600">{fmtCur(computedAmount)}</span>
            </div>
          </div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.employeeName.trim() || !form.date || parseFloat(computedAmount) <= 0} label="Submit Claim" />
    </Modal>
  );
}

function ApprovalQueueView({ claims, onRefresh }: { claims: ClaimRecord[]; onRefresh: () => void }) {
  const pending = claims.filter(c => c.status === "Pending");

  const handleAction = async (id: number, status: "Approved" | "Rejected") => {
    try {
      await authFetch(`/api/trail/claims/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      onRefresh();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1><p className="text-sm text-gray-400 mt-0.5">Review and approve pending expense claims</p></div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700">Approving a claim automatically posts a payable entry to the Ledger (Debit: Expense Category, Credit: Employee Payable).</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-6">
        <div><p className="text-xs text-gray-400">Pending Claims</p><p className="text-2xl font-bold text-amber-600">{pending.length}</p></div>
        <div className="w-px h-10 bg-gray-200" />
        <div><p className="text-xs text-gray-400">Total Pending Amount</p><p className="text-2xl font-bold text-gray-800">{fmtCur(pending.reduce((s, c) => s + parseFloat(c.amount), 0))}</p></div>
      </div>
      {pending.length === 0 ? <EmptyState icon={CheckCircle} text="No pending claims — all caught up!" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Claim ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {pending.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-xs font-mono font-semibold text-gray-500">{c.claimId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.employeeName}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(c.date)}</td>
                  <td className="px-4 py-3 text-center"><CategoryIcon category={c.category} /></td>
                  <td className="px-4 py-3 text-center"><span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">{c.claimType}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{c.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{fmtCur(c.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleAction(c.id, "Approved")} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 shadow-sm transition-all"><CheckCircle className="w-3 h-3" /> Approve</button>
                      <button onClick={() => handleAction(c.id, "Rejected")} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-sm transition-all"><XCircle className="w-3 h-3" /> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PettyCashLedgerView({ pettyCash, onRefresh }: { pettyCash: PettyCashRecord[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const totalIn = pettyCash.reduce((s, r) => s + parseFloat(r.cashIn), 0);
  const totalOut = pettyCash.reduce((s, r) => s + parseFloat(r.cashOut), 0);
  const currentBalance = pettyCash.length > 0 ? parseFloat(pettyCash[0].runningBalance) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Petty Cash Ledger</h1><p className="text-sm text-gray-400 mt-0.5">Track office cash-on-hand transactions</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"><Plus className="w-4 h-4" /> Record Cash Transaction</button></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><ArrowDownCircle className="w-5 h-5 text-green-500" /></div><div><p className="text-xs text-gray-400">Total Cash IN</p><p className="text-2xl font-bold text-green-600">{fmtCur(totalIn)}</p></div></div></div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><ArrowUpCircle className="w-5 h-5 text-red-500" /></div><div><p className="text-xs text-gray-400">Total Cash OUT</p><p className="text-2xl font-bold text-red-500">{fmtCur(totalOut)}</p></div></div></div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-blue-500" /></div><div><p className="text-xs text-gray-400">Running Balance</p><p className="text-2xl font-bold text-blue-600">{fmtCur(currentBalance)}</p></div></div></div>
      </div>
      {pettyCash.length === 0 ? <EmptyState icon={Wallet} text="No petty cash transactions" /> : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Cash IN</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Cash OUT</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase">Running Balance</th>
            </tr></thead>
            <tbody>
              {pettyCash.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.description}</td>
                  <td className="px-4 py-3 text-right">{parseFloat(r.cashIn) > 0 ? <span className="font-bold text-green-600">{fmtCur(r.cashIn)}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right">{parseFloat(r.cashOut) > 0 ? <span className="font-bold text-red-500">{fmtCur(r.cashOut)}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{fmtCur(r.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <RecordPettyCashModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function RecordPettyCashModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], description: "", cashIn: "", cashOut: "" });
  const handleSave = async () => {
    if (!form.description.trim() || !form.date || (!form.cashIn && !form.cashOut)) return; setSaving(true);
    try { const res = await authFetch("/api/trail/petty-cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, cashIn: form.cashIn || "0", cashOut: form.cashOut || "0" }) }); if (res.ok) onSaved(); } catch {} finally { setSaving(false); }
  };
  return (
    <Modal title="Record Cash Transaction" icon={Wallet} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Office supplies purchase" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Cash IN (₹)</label><input type="number" step="0.01" value={form.cashIn} onChange={e => setForm({ ...form, cashIn: e.target.value })} placeholder="0.00" className={inputCls + " text-green-600 font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Cash OUT (₹)</label><input type="number" step="0.01" value={form.cashOut} onChange={e => setForm({ ...form, cashOut: e.target.value })} placeholder="0.00" className={inputCls + " text-red-500 font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} /></div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} disabled={!form.description.trim() || !form.date || (!form.cashIn && !form.cashOut)} label="Record Transaction" />
    </Modal>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm"><Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">{text}</p></div>;
}

function Modal({ title, icon: Icon, onClose, children }: { title: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
