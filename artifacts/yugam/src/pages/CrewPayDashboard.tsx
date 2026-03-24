import { useState, useEffect, useCallback } from "react";
import {
  Search,
  IndianRupee,
  Receipt,
  Wallet,
  UserCheck,
  Plus,
  X,
} from "lucide-react";

interface PayrollRecord {
  id: number;
  employeeName: string;
  payPeriod: string;
  grossPay: string;
  deductions: string;
  netPay: string;
  status: string;
  createdAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-700 border-green-200",
    Processing: "bg-orange-50 text-orange-600 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {status}
    </span>
  );
}

function formatCurrency(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  return "₹ " + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatCurrencyShort(val: number) {
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹ ${(val / 1000).toFixed(1)}K`;
  return `₹ ${val.toFixed(0)}`;
}

export default function CrewPayDashboard() {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ employeeName: "", payPeriod: "March 2026", grossPay: "", deductions: "", status: "Processing" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPayroll = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll");
      if (res.ok) setRecords(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: formData.employeeName,
          payPeriod: formData.payPeriod,
          grossPay: formData.grossPay || "0",
          deductions: formData.deductions || "0",
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add payroll record");
        return;
      }
      setShowModal(false);
      setFormData({ employeeName: "", payPeriod: "March 2026", grossPay: "", deductions: "", status: "Processing" });
      await fetchPayroll();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.payPeriod.toLowerCase().includes(search.toLowerCase())
  );

  const totalGross = records.reduce((s, r) => s + parseFloat(r.grossPay), 0);
  const totalDeductions = records.reduce((s, r) => s + parseFloat(r.deductions), 0);
  const totalNet = records.reduce((s, r) => s + parseFloat(r.netPay), 0);
  const paidCount = records.filter((r) => r.status === "Paid").length;

  const computedNetPay = parseFloat(formData.grossPay || "0") - parseFloat(formData.deductions || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll & Settlements</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage salaries & compensation</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Payslip
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 text-white rounded-xl p-5 shadow-lg">
          <div className="p-2 bg-white/10 rounded-lg w-fit mb-3">
            <IndianRupee className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Gross</p>
          <p className="text-2xl font-bold mt-0.5">{formatCurrencyShort(totalGross)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="p-2 bg-orange-50 rounded-lg w-fit mb-3">
            <Receipt className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deductions</p>
          <p className="text-2xl font-bold text-orange-500 mt-0.5">{formatCurrencyShort(totalDeductions)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="p-2 bg-red-50 rounded-lg w-fit mb-3">
            <Wallet className="w-5 h-5 text-[#E31E24]" />
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Net Payable</p>
          <p className="text-2xl font-bold text-[#E31E24] mt-0.5">{formatCurrencyShort(totalNet)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="p-2 bg-green-50 rounded-lg w-fit mb-3">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Employees Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-0.5">{paidCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Payroll Details</h2>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading payroll...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No payroll records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay Period</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Pay</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{r.employeeName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{r.payPeriod}</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(r.grossPay)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(r.deductions)}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(r.netPay)}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Payslip</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name</label>
                <input type="text" required value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} placeholder="e.g., Aarav Mehta" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Pay Period</label>
                <input type="text" required value={formData.payPeriod} onChange={(e) => setFormData({ ...formData, payPeriod: e.target.value })} placeholder="e.g., March 2026" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Gross Pay (₹)</label>
                  <input type="number" value={formData.grossPay} onChange={(e) => setFormData({ ...formData, grossPay: e.target.value })} placeholder="e.g., 85000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Deductions (₹)</label>
                  <input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: e.target.value })} placeholder="e.g., 12000" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Net Pay (auto-calculated)</span>
                <span className="text-sm font-bold text-gray-800">{formatCurrency(computedNetPay.toString())}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option value="Processing">Processing</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Saving..." : "Add Payslip"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
