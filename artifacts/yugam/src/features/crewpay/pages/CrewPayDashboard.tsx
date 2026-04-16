import { Plus, Search } from "lucide-react";
import AddPayslipModal from "../components/AddPayslipModal";
import CrewPayMetrics from "../components/CrewPayMetrics";
import CrewPayTable from "../components/CrewPayTable";
import { useCrewPay } from "../hooks/useCrewPay";

export default function CrewPayDashboard() {
  const {
    search,
    setSearch,
    loading,
    showModal,
    setShowModal,
    formData,
    setFormData,
    submitting,
    error,
    filtered,
    metrics,
    computedNetPay,
    handleSubmit,
  } = useCrewPay();

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

      <CrewPayMetrics
        totalGross={metrics.totalGross}
        totalDeductions={metrics.totalDeductions}
        totalNet={metrics.totalNet}
        paidCount={metrics.paidCount}
      />

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
        <CrewPayTable loading={loading} records={filtered} />
      </div>

      <AddPayslipModal
        open={showModal}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        error={error}
        submitting={submitting}
        computedNetPay={computedNetPay}
      />
    </div>
  );
}
