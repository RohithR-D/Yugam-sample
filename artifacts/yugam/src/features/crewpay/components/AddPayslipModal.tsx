import { ChangeEvent, FormEvent } from "react";
import { X } from "lucide-react";
import { PayrollFormData } from "../types";
import { formatCurrency } from "../utils/crewPayUtils";

interface AddPayslipModalProps {
  open: boolean;
  formData: PayrollFormData;
  setFormData: (value: PayrollFormData) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  error: string;
  submitting: boolean;
  computedNetPay: number;
}

export default function AddPayslipModal({
  open,
  formData,
  setFormData,
  onClose,
  onSubmit,
  error,
  submitting,
  computedNetPay,
}: AddPayslipModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Add Payslip</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name</label>
            <input
              type="text"
              required
              value={formData.employeeName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, employeeName: e.target.value })}
              placeholder="e.g., Aarav Mehta"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Pay Period</label>
            <input
              type="text"
              required
              value={formData.payPeriod}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, payPeriod: e.target.value })}
              placeholder="e.g., March 2026"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Gross Pay (₹)</label>
              <input
                type="number"
                value={formData.grossPay}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, grossPay: e.target.value })}
                placeholder="e.g., 85000"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Deductions (₹)</label>
              <input
                type="number"
                value={formData.deductions}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, deductions: e.target.value })}
                placeholder="e.g., 12000"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Net Pay (auto-calculated)</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(computedNetPay.toString())}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white"
            >
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Saving..." : "Add Payslip"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
