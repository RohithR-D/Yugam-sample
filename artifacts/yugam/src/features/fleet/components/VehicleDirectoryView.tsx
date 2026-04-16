import { Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createVehicle, getVehicles } from "../services/fleetService";
import type { Vehicle, VehicleFormData } from "../types";
import { formatDate, inputCls } from "../utils/fleetUtils";
import { VehicleStatusBadge, VehicleTypeBadge } from "./FleetBadges";

const initialForm: VehicleFormData = {
  regNumber: "",
  type: "Truck",
  make: "",
  model: "",
  status: "Available",
  rcExpiry: "",
  insuranceExpiry: "",
};

export function VehicleDirectoryView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<VehicleFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.regNumber.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.type.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.make.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, vehicles],
  );

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await createVehicle(form);
      if (!response.ok) {
        setError(response.error || "Failed to add vehicle");
        return;
      }

      setShowModal(false);
      setForm(initialForm);
      await fetchVehicles();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Directory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Complete fleet vehicle register</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by reg number, type, or make..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading vehicles...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reg Number</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Make / Model</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">RC Expiry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Insurance Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filtered.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono font-semibold text-gray-800">{vehicle.regNumber}</td>
                    <td className="px-5 py-3">
                      <VehicleTypeBadge type={vehicle.type} />
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {vehicle.make}
                      {vehicle.model ? ` ${vehicle.model}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      <VehicleStatusBadge status={vehicle.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {vehicle.rcExpiry ? formatDate(vehicle.rcExpiry) : "-"}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Vehicle</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={form.regNumber}
                  onChange={(event) => setForm({ ...form, regNumber: event.target.value })}
                  placeholder="e.g., MH-12-AB-1234"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type *</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                    className={inputCls + " bg-white"}
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Car">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className={inputCls + " bg-white"}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Make</label>
                  <input
                    type="text"
                    value={form.make}
                    onChange={(event) => setForm({ ...form, make: event.target.value })}
                    placeholder="e.g., Tata"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder="e.g., Ace Gold"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">RC Expiry</label>
                  <input
                    type="date"
                    value={form.rcExpiry}
                    onChange={(event) => setForm({ ...form, rcExpiry: event.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Insurance Expiry</label>
                  <input
                    type="date"
                    value={form.insuranceExpiry}
                    onChange={(event) => setForm({ ...form, insuranceExpiry: event.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
