import { CreditCard, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createBudgetLine, deleteBudgetLine } from "../services/flowService";
import type { BudgetLine, ProjectRecord } from "../types";
import { formatCurrency, inputCls } from "../utils/flowUtils";
import { Modal, ModalFooter } from "./FlowShared";

function AddBudgetLineModal({
  projects,
  defaultProjectId,
  onClose,
  onSaved,
}: {
  projects: ProjectRecord[];
  defaultProjectId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectId: defaultProjectId?.toString() || "",
    category: "Material Costs",
    description: "",
    estimatedBudget: "",
    actualCost: "0",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.projectId || !form.estimatedBudget) {
      return;
    }

    setSaving(true);
    try {
      const saved = await createBudgetLine({
        ...form,
        projectId: parseInt(form.projectId, 10),
        actualCost: form.actualCost || "0",
      });

      if (saved) {
        onSaved();
      }
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Budget Line" icon={CreditCard} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label>
          <select
            value={form.projectId}
            onChange={(event) => setForm({ ...form, projectId: event.target.value })}
            className={inputCls + " cursor-pointer"}
          >
            <option value="">Select Project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Cost Category</label>
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className={inputCls + " cursor-pointer"}
          >
            <option value="Material Costs">Material Costs</option>
            <option value="Procurement Costs">Procurement Costs</option>
            <option value="Labor/Machine Costs">Labor/Machine Costs</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="e.g. Structural steel procurement"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Estimated Budget (Rs)</label>
            <input
              type="number"
              value={form.estimatedBudget}
              onChange={(event) => setForm({ ...form, estimatedBudget: event.target.value })}
              className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Actual Cost (Rs)</label>
            <input
              type="number"
              value={form.actualCost}
              onChange={(event) => setForm({ ...form, actualCost: event.target.value })}
              className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className={inputCls + " resize-none"}
          />
        </div>
      </div>
      <ModalFooter
        onClose={onClose}
        onSave={handleSave}
        saving={saving}
        disabled={!form.projectId || !form.estimatedBudget}
        label="Add Line"
      />
    </Modal>
  );
}

export function BudgetsCostingView({
  projects,
  budgets,
  onRefresh,
}: {
  projects: ProjectRecord[];
  budgets: BudgetLine[];
  onRefresh: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);

  const projectBudgets = useMemo(() => {
    if (!selectedProject) {
      return budgets;
    }
    return budgets.filter((budget) => budget.projectId === selectedProject);
  }, [budgets, selectedProject]);

  const budgetCategories = ["Material Costs", "Procurement Costs", "Labor/Machine Costs"];

  const categoryTotals = useMemo(() => {
    return budgetCategories.map((category) => {
      const lines = projectBudgets.filter((budget) => budget.category === category);
      const estimated = lines.reduce((sum, budget) => sum + parseFloat(budget.estimatedBudget), 0);
      const actual = lines.reduce((sum, budget) => sum + parseFloat(budget.actualCost), 0);
      return {
        category,
        estimated,
        actual,
        variance: estimated - actual,
        lineCount: lines.length,
      };
    });
  }, [projectBudgets]);

  const grandEstimated = categoryTotals.reduce((sum, category) => sum + category.estimated, 0);
  const grandActual = categoryTotals.reduce((sum, category) => sum + category.actual, 0);
  const grandVariance = grandEstimated - grandActual;

  const selectedProjectRecord = projects.find((project) => project.id === selectedProject);

  const handleDeleteBudgetLine = async (budgetLineId: number) => {
    if (!confirm("Delete?")) {
      return;
    }
    await deleteBudgetLine(budgetLineId);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets & Costing</h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial matrix comparing estimated vs. actual costs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Budget Line
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedProject}
          onChange={(event) => setSelectedProject(event.target.value ? parseInt(event.target.value, 10) : "")}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm min-w-[250px]"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.projectName}
            </option>
          ))}
        </select>
        {selectedProjectRecord && (
          <div className="text-xs text-gray-400">
            Project Budget: <span className="font-semibold text-gray-600">{formatCurrency(selectedProjectRecord.budget)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Total Estimated</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(grandEstimated)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Total Actual</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(grandActual)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-400">Variance</p>
          <p className={`text-2xl font-bold mt-1 ${grandVariance >= 0 ? "text-green-600" : "text-red-500"}`}>
            {grandVariance >= 0 ? "+" : ""}
            {formatCurrency(grandVariance)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Cost Category
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Estimated Budget
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Actual Cost
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Burn %
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-[200px]">
                Visual
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.map((category) => {
              const burnPercent = category.estimated > 0 ? Math.round((category.actual / category.estimated) * 100) : 0;
              const barColor =
                burnPercent > 100 ? "bg-red-500" : burnPercent > 80 ? "bg-amber-500" : "bg-green-500";
              return (
                <tr key={category.category} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          category.category === "Material Costs"
                            ? "bg-blue-500"
                            : category.category === "Procurement Costs"
                              ? "bg-purple-500"
                              : "bg-amber-500"
                        }`}
                      />
                      <span className="font-medium text-gray-800">{category.category}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 ml-5 mt-0.5">{category.lineCount} line items</p>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-800">{formatCurrency(category.estimated)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-blue-600">{formatCurrency(category.actual)}</td>
                  <td
                    className={`px-4 py-4 text-right font-bold ${
                      category.variance >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {category.variance >= 0 ? "+" : ""}
                    {formatCurrency(category.variance)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        burnPercent > 100
                          ? "bg-red-50 text-red-500"
                          : burnPercent > 80
                            ? "bg-amber-50 text-amber-600"
                            : "bg-green-50 text-green-600"
                      }`}
                    >
                      {burnPercent}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`${barColor} rounded-full h-2.5 transition-all`}
                        style={{ width: `${Math.min(burnPercent, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50/80 border-t border-gray-200">
              <td className="px-5 py-3.5 font-bold text-gray-800 text-sm">Grand Total</td>
              <td className="px-4 py-3.5 text-right font-bold text-gray-800">{formatCurrency(grandEstimated)}</td>
              <td className="px-4 py-3.5 text-right font-bold text-blue-600">{formatCurrency(grandActual)}</td>
              <td className={`px-4 py-3.5 text-right font-bold ${grandVariance >= 0 ? "text-green-600" : "text-red-500"}`}>
                {grandVariance >= 0 ? "+" : ""}
                {formatCurrency(grandVariance)}
              </td>
              <td className="px-4 py-3.5 text-center">
                <span className="text-xs font-bold text-gray-700">
                  {grandEstimated > 0 ? Math.round((grandActual / grandEstimated) * 100) : 0}%
                </span>
              </td>
              <td className="px-4 py-3.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {projectBudgets.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-700">Line Item Detail</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Estimated</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Actual</th>
                <th className="w-[50px]" />
              </tr>
            </thead>
            <tbody>
              {projectBudgets.map((budget) => (
                <tr key={budget.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-3 text-sm text-gray-800">{budget.description || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                      {budget.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {formatCurrency(budget.estimatedBudget)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">
                    {formatCurrency(budget.actualCost)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteBudgetLine(budget.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddBudgetLineModal
          projects={projects}
          defaultProjectId={selectedProject || undefined}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
