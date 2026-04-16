import { ChangeEvent, FormEvent } from "react";
import { X } from "lucide-react";
import { EmployeeFormData } from "../types";

interface AddEmployeeModalProps {
  open: boolean;
  formData: EmployeeFormData;
  setFormData: (value: EmployeeFormData) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  error: string;
  submitting: boolean;
}

export default function AddEmployeeModal({
  open,
  formData,
  setFormData,
  onClose,
  onSubmit,
  error,
  submitting,
}: AddEmployeeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Add New Employee</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Ananya Reddy"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Designation</label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g., Senior Developer"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Offboarded">Offboarded</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Join Date</label>
            <input
              type="date"
              value={formData.joinDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, joinDate: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Adding..." : "Add Employee"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
