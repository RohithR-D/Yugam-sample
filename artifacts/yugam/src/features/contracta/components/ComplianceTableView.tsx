import { ChangeEvent } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useComplianceTable } from "../hooks/useContracta";
import { formatDate, daysUntil } from "../utils/contractaUtils";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";

interface ComplianceTableViewProps {
  category: string;
  title: string;
  subtitle: string;
}

export default function ComplianceTableView({ category, title, subtitle }: ComplianceTableViewProps) {
  const {
    loading,
    search,
    setSearch,
    showModal,
    setShowModal,
    formData,
    setFormData,
    submitting,
    error,
    handleSubmit,
    handleDelete,
    filtered,
  } = useComplianceTable(category);

  const isStatutory = category === "Statutory";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" />
          Upload Contract
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by title or entity..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isStatutory ? "text-red-500" : "text-gray-500"}`}>Expiry Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No records found</td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const days = daysUntil(record.expiryDate);
                  return (
                    <tr key={record.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{record.title}</td>
                      <td className="px-5 py-3.5 text-gray-600">{record.entityName}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(record.validFrom)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isStatutory && days <= 30 ? "text-red-600 font-bold" : "text-gray-500"}`}>
                            {formatDate(record.expiryDate)}
                          </span>
                          {days <= 30 && days > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{days}d left</span>}
                          {days <= 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">OVERDUE</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={record.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => handleDelete(record.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Upload Contract</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Annual Maintenance Contract"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Entity Name</label>
                <input
                  type="text"
                  required
                  value={formData.entityName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, entityName: e.target.value })}
                  placeholder={category === "Client" ? "Client company name" : category === "Vendor" ? "Vendor company name" : "Issuing authority"}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Saving..." : "Save Contract"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
