import { Folder, FolderKanban, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createProject, deleteProject } from "../services/flowService";
import type { Milestone, ProjectRecord } from "../types";
import { formatCurrency, formatDate } from "../utils/flowUtils";
import { EmptyState, Modal, ModalFooter, StatusPill, inputCls } from "./FlowShared";

function CreateProjectModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    clientName: "",
    budget: "",
    totalValue: "",
    status: "Planning",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    description: "",
  });

  const handleSave = async () => {
    if (!form.projectName.trim() || !form.clientName.trim() || !form.dueDate) {
      return;
    }

    setSaving(true);
    try {
      const saved = await createProject({
        ...form,
        budget: form.budget || "0",
        totalValue: form.totalValue || form.budget || "0",
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
    <Modal title="Create New Project" icon={FolderKanban} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Project Name</label>
          <input
            type="text"
            value={form.projectName}
            onChange={(event) => setForm({ ...form, projectName: event.target.value })}
            placeholder="e.g. Solar Farm Phase 2"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Client Name</label>
          <input
            type="text"
            value={form.clientName}
            onChange={(event) => setForm({ ...form, clientName: event.target.value })}
            placeholder="e.g. GreenLeaf Industries"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Value (Rs)</label>
            <input
              type="number"
              value={form.totalValue}
              onChange={(event) => setForm({ ...form, totalValue: event.target.value })}
              placeholder="Contract value"
              className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Budget (Rs)</label>
            <input
              type="number"
              value={form.budget}
              onChange={(event) => setForm({ ...form, budget: event.target.value })}
              placeholder="Estimated budget"
              className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className={inputCls + " cursor-pointer"}
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Handover">Handover</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className={inputCls + " resize-none"}
          />
        </div>
      </div>
      <ModalFooter
        onClose={onClose}
        onSave={handleSave}
        saving={saving}
        disabled={!form.projectName.trim() || !form.clientName.trim() || !form.dueDate}
        label="Create Project"
      />
    </Modal>
  );
}

export function ProjectPortfolioView({
  projects,
  milestones,
  onRefresh,
}: {
  projects: ProjectRecord[];
  milestones: Milestone[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (project) =>
          project.projectName.toLowerCase().includes(q) || project.clientName.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      result = result.filter((project) => project.status === statusFilter);
    }
    return result;
  }, [projects, search, statusFilter]);

  const getMilestoneProgress = (projectId: number) => {
    const projectMilestones = milestones.filter((milestone) => milestone.projectId === projectId);
    if (projectMilestones.length === 0) {
      return 0;
    }
    return Math.round(
      projectMilestones.reduce((sum, milestone) => sum + milestone.completionPercent, 0) /
        projectMilestones.length,
    );
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Delete project and all linked data?")) {
      return;
    }
    await deleteProject(projectId);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Portfolio</h1>
          <p className="text-sm text-gray-400 mt-0.5">All projects at a glance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"
        >
          <option value="">All Status</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Handover">Handover</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} text="No projects found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const progress = getMilestoneProgress(project.id);
            const milestoneCount = milestones.filter((milestone) => milestone.projectId === project.id).length;

            return (
              <div
                key={project.id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-[#E31E24]/30 transition-colors group"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gray-50 rounded-lg shrink-0">
                      <Folder className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{project.projectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{project.clientName}</p>
                    </div>
                  </div>

                  <div className="w-[180px]">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-400">{milestoneCount} milestones</span>
                      <span className="font-semibold text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#E31E24] rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="text-center w-[100px]">
                    <p className="text-[10px] text-gray-400 uppercase">Value</p>
                    <p className="text-sm font-bold text-gray-800">
                      {formatCurrency(project.totalValue || project.budget)}
                    </p>
                  </div>

                  <div className="text-center w-[100px]">
                    <p className="text-[10px] text-gray-400 uppercase">Due</p>
                    <p className="text-xs font-medium text-gray-600">{formatDate(project.dueDate)}</p>
                  </div>

                  <div className="w-[80px] flex justify-center">
                    <StatusPill status={project.status} />
                  </div>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
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
