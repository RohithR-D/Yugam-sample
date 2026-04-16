import { ArrowRight, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createTrip, getTrips, getVehicles, updateTripStatus } from "../services/fleetService";
import type { Trip, TripFormData, Vehicle } from "../types";
import { formatDateTime, inputCls } from "../utils/fleetUtils";
import { TripStatusBadge } from "./FleetBadges";

const initialForm: TripFormData = {
  vehicleId: "",
  vehicleReg: "",
  driverName: "",
  origin: "",
  destination: "",
  startTime: "",
  status: "Scheduled",
  notes: "",
};

export function DispatchTripsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TripFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsData, vehiclesData] = await Promise.all([getTrips(), getVehicles()]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await createTrip(form);
      if (!response.ok) {
        setError(response.error || "Failed to create trip");
        return;
      }

      setShowModal(false);
      setForm(initialForm);
      await fetchData();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tripId: number, status: string) => {
    await updateTripStatus(tripId, status);
    await fetchData();
  };

  const filteredTrips = useMemo(
    () => (filter === "all" ? trips : trips.filter((trip) => trip.status === filter)),
    [filter, trips],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch & Trips</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track active journeys and dispatch vehicles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      <div className="flex gap-2">
        {["all", "Scheduled", "In Transit", "Completed"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === item
                ? "bg-[#E31E24] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item === "all" ? "All Trips" : item} {item !== "all" ? `(${trips.filter((trip) => trip.status === item).length})` : `(${trips.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading trips...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trip ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Route</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Start</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">End</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No trips found
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-xs font-mono text-gray-400">TRP-{trip.id.toString().padStart(4, "0")}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-gray-800">{trip.vehicleReg}</td>
                    <td className="px-5 py-3 text-gray-600">{trip.driverName}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        {trip.origin} <ArrowRight className="w-3 h-3 text-gray-400" /> {trip.destination}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(trip.startTime)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{trip.endTime ? formatDateTime(trip.endTime) : "-"}</td>
                    <td className="px-5 py-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-5 py-3">
                      {trip.status === "Scheduled" && (
                        <button
                          onClick={() => handleStatusChange(trip.id, "In Transit")}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      {trip.status === "In Transit" && (
                        <button
                          onClick={() => handleStatusChange(trip.id, "Completed")}
                          className="px-2.5 py-1 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
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
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Dispatch</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Vehicle *</label>
                  <select
                    value={form.vehicleId}
                    onChange={(event) => {
                      const selectedVehicle = vehicles.find((vehicle) => vehicle.id === parseInt(event.target.value, 10));
                      setForm({
                        ...form,
                        vehicleId: event.target.value,
                        vehicleReg: selectedVehicle ? selectedVehicle.regNumber : "",
                      });
                    }}
                    className={inputCls + " bg-white"}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles
                      .filter((vehicle) => vehicle.status === "Available")
                      .map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.regNumber} - {vehicle.type} {vehicle.make}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={form.driverName}
                    onChange={(event) => setForm({ ...form, driverName: event.target.value })}
                    placeholder="Driver name"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Origin *</label>
                  <input
                    type="text"
                    required
                    value={form.origin}
                    onChange={(event) => setForm({ ...form, origin: event.target.value })}
                    placeholder="e.g., Mumbai Factory"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Destination *</label>
                  <input
                    type="text"
                    required
                    value={form.destination}
                    onChange={(event) => setForm({ ...form, destination: event.target.value })}
                    placeholder="e.g., Pune Warehouse"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className={inputCls + " bg-white"}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className={inputCls + " resize-none"}
                />
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
                  disabled={submitting || !form.vehicleId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"
                >
                  {submitting ? "Dispatching..." : "Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
