import { Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createExpense, deleteExpense, getExpenses, getVehicles } from "../services/fleetService";
import type { Expense, ExpenseFormData, Vehicle } from "../types";
import { formatCurrency, formatDate, inputCls } from "../utils/fleetUtils";
import { ExpenseTypeBadge } from "./FleetBadges";

const initialForm: ExpenseFormData = {
  vehicleId: "",
  vehicleReg: "",
  expenseDate: new Date().toISOString().split("T")[0],
  expenseType: "Fuel",
  amount: "",
  description: "",
  loggedBy: "",
};

export function FuelMaintenanceView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, vehiclesData] = await Promise.all([getExpenses(), getVehicles()]);
      setExpenses(expensesData);
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
      const response = await createExpense(form);
      if (!response.ok) {
        setError(response.error || "Failed to log expense");
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

  const filtered = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
          expense.expenseType.toLowerCase().includes(search.toLowerCase()) ||
          expense.loggedBy.toLowerCase().includes(search.toLowerCase()),
      ),
    [expenses, search],
  );

  const totalFuel = useMemo(
    () => expenses.filter((expense) => expense.expenseType === "Fuel").reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
    [expenses],
  );
  const totalRepair = useMemo(
    () => expenses.filter((expense) => expense.expenseType === "Repair").reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
    [expenses],
  );
  const totalServicing = useMemo(
    () => expenses.filter((expense) => expense.expenseType === "Servicing").reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
    [expenses],
  );

  const handleDelete = async (id: number) => {
    await deleteExpense(id);
    await fetchData();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuel & Maintenance Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track fuel, repair, and servicing expenses by vehicle</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Fuel</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(totalFuel)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Repair</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalRepair)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Servicing</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalServicing)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by vehicle, type, or logged by..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading expenses...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle Reg No</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Expense Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Logged By</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No expenses logged
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr key={expense.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDate(expense.expenseDate)}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-gray-800">{expense.vehicleReg}</td>
                    <td className="px-5 py-3">
                      <ExpenseTypeBadge type={expense.expenseType} />
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">{formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs max-w-[200px] truncate">{expense.description || "-"}</td>
                    <td className="px-5 py-3 text-gray-600">{expense.loggedBy || "-"}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
              <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Vehicle *</label>
                <select
                  value={form.vehicleId}
                  onChange={(event) => {
                    const vehicle = vehicles.find((item) => item.id === parseInt(event.target.value, 10));
                    setForm({
                      ...form,
                      vehicleId: event.target.value,
                      vehicleReg: vehicle ? vehicle.regNumber : "",
                    });
                  }}
                  className={inputCls + " bg-white"}
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.regNumber} - {vehicle.type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Expense Type *</label>
                  <select
                    value={form.expenseType}
                    onChange={(event) => setForm({ ...form, expenseType: event.target.value })}
                    className={inputCls + " bg-white"}
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Repair">Repair</option>
                    <option value="Servicing">Servicing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (Rs) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date *</label>
                <input
                  type="date"
                  required
                  value={form.expenseDate}
                  onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Logged By</label>
                <input
                  type="text"
                  value={form.loggedBy}
                  onChange={(event) => setForm({ ...form, loggedBy: event.target.value })}
                  placeholder="e.g., Ramesh"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Details..."
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
                  {submitting ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
