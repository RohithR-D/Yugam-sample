import { Search, Plus } from "lucide-react";
import { useCrew } from "../hooks/useCrew";
import CrewMetrics from "../components/CrewMetrics";
import CrewEmployeeGrid from "../components/CrewEmployeeGrid";
import AddEmployeeModal from "../components/AddEmployeeModal";

export default function CrewDashboard() {
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
    handleSubmit,
  } = useCrew();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Employee directory & team overview</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <CrewMetrics
        totalCount={metrics.totalCount}
        activeCount={metrics.activeCount}
        onLeaveCount={metrics.onLeaveCount}
        offboardedCount={metrics.offboardedCount}
      />

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search employees, roles, or departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading employees...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No employees found</div>
      ) : (
        <CrewEmployeeGrid employees={filtered} />
      )}

      <AddEmployeeModal
        open={showModal}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        error={error}
        submitting={submitting}
      />
    </div>
  );
}
